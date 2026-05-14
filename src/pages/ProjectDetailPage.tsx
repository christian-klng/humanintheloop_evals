import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, PlayCircle, Settings2, Plus, Info, X, Loader2, ChevronDown, Search, Check } from "lucide-react";
import { api } from "../lib/api";

interface Project {
  id: string;
  name: string;
  status: string;
  workspace_id: string | null;
  default_model: string | null;
}

interface ProviderModel {
  id: string;
  name: string;
}

interface Criterion {
  id: string;
  title: string;
  description: string;
  weight: number;
}

interface EvalScore {
  criteria_title: string;
  criteria_weight: number;
  score: number;
  note: string | null;
}

interface EvalRun {
  id: string;
  model_tag: string;
  system_prompt: string;
  user_input: string;
  output_text: string | null;
  latency_ms: number | null;
  overall_score: number | null;
  summary_text: string | null;
  status: string;
  scores?: EvalScore[];
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [latestRun, setLatestRun] = useState<EvalRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableModels, setAvailableModels] = useState<ProviderModel[]>([]);
  const [showCriterionModal, setShowCriterionModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");
  const [streamLatency, setStreamLatency] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<Project>(`/api/projects/${id}`),
      api<Criterion[]>(`/api/projects/${id}/criteria`),
      api<EvalRun[]>(`/api/projects/${id}/runs?limit=1`),
    ]).then(async ([proj, crit, runs]) => {
      setProject(proj);
      setCriteria(crit);
      if (runs.length > 0) {
        const run = await api<EvalRun>(`/api/projects/${id}/runs/${runs[0].id}`);
        setLatestRun(run);
        setSystemPrompt(run.system_prompt || "");
        setUserPrompt(run.user_input || "");
      }
      const modelsUrl = proj.workspace_id
        ? `/api/workspaces/${proj.workspace_id}/provider/models`
        : "/api/me/provider/models";
      api<{ models: ProviderModel[] }>(modelsUrl)
        .then((data) => setAvailableModels(data.models || []))
        .catch(() => {});
    }).finally(() => setLoading(false));
  }, [id]);

  const canStart = criteria.length > 0 && userPrompt.trim().length > 0 && !!project?.default_model;
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const handleStartEval = async () => {
    if (!project || !canStart) return;
    setStreaming(true);
    setStreamingOutput("");
    setStreamLatency(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_tag: project.default_model,
          system_prompt: systemPrompt,
          user_input: userPrompt,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Fehler: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Kein Stream verfügbar");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.chunk) {
              fullText += parsed.chunk;
              setStreamingOutput(fullText);
              outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
            }
            if (parsed.done) {
              setStreamLatency(parsed.latency_ms);
              const runId = parsed.run_id;
              if (runId) {
                const run = await api<EvalRun>(`/api/projects/${project.id}/runs/${runId}`);
                setLatestRun(run);
              }
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e: any) {
            if (e.message && !e.message.includes("JSON")) throw e;
          }
        }
      }
    } catch (err: any) {
      setStreamingOutput((prev) => prev + `\n\n[Fehler: ${err.message}]`);
    } finally {
      setStreaming(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-xs text-neutral-400">Laden...</div>;
  }

  if (!project) {
    return <div className="h-screen flex items-center justify-center text-xs text-neutral-400">Projekt nicht gefunden</div>;
  }

  const overallScore = latestRun?.overall_score;
  const scores = latestRun?.scores || [];
  const displayOutput = streaming ? streamingOutput : latestRun?.output_text;
  const displayLatency = streaming ? streamLatency : latestRun?.latency_ms;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-sm">
      <header className="h-12 border-b border-neutral-200 px-6 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/dashboard" className="text-neutral-400 hover:text-neutral-600 transition-colors">Projekte</Link>
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">{project.name}</span>
          <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 text-[10px] rounded text-neutral-500 font-bold uppercase tracking-widest">
            {streaming ? "LÄUFT" : latestRun?.status?.toUpperCase() || "KEINE LÄUFE"}
          </span>
        </div>
        <div className="flex gap-2">
          {availableModels.length > 0 && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded hover:bg-neutral-50 transition-colors flex items-center gap-1.5 text-neutral-700"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {project.default_model ? `Modell: ${project.default_model.split("/").pop()}` : "Standardmodell wählen"}
            </button>
          )}
          <button
            onClick={handleStartEval}
            disabled={!canStart || streaming}
            title={
              !project.default_model ? "Standardmodell muss gesetzt sein" :
              criteria.length === 0 ? "Mindestens ein Kriterium erforderlich" :
              !userPrompt.trim() ? "Prompt des Nutzers darf nicht leer sein" :
              undefined
            }
            className="px-3 py-1.5 text-xs font-bold bg-primary-400 border border-primary-500 rounded shadow-sm text-black flex items-center gap-2 hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
            {streaming ? "Läuft…" : "Evaluierung starten"}
          </button>
        </div>
      </header>

      <div className="flex-1 w-full bg-[#FCFCFC] flex overflow-hidden divide-x divide-neutral-200">
        {/* Column 1: Criteria */}
        <div className="w-[300px] shrink-0 flex flex-col bg-white">
          <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">01. Kriterien</span>
              {criteria.length > 0 && (
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${totalWeight === 100 ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}`}>
                  {totalWeight}/100
                </span>
              )}
            </div>
            <button onClick={() => setShowCriterionModal(true)} className="text-neutral-400 hover:text-neutral-900 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {criteria.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Noch keine Kriterien definiert</p>
            ) : (
              criteria.map((c) => (
                <CriteriaCard key={c.id} title={c.title} desc={c.description} weight={`${c.weight}%`} />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Prompts (editable) */}
        <div className="flex-[1.2] min-w-[320px] flex flex-col bg-white">
          <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between z-10">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">02. Eingabe-Prompt</span>
            {project.default_model && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-neutral-600 bg-neutral-100 border border-neutral-200 font-mono tracking-wide">
                {project.default_model.split("/").pop()?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">System-Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Optional: System-Prompt eingeben…"
                rows={5}
                disabled={streaming}
                className="w-full border border-neutral-200 rounded p-3 text-xs text-neutral-700 font-mono leading-relaxed resize-none bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">
                Prompt des Nutzers <span className="text-red-400">*</span>
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Prompt eingeben…"
                rows={6}
                disabled={streaming}
                className="w-full border border-neutral-200 rounded p-3 text-xs text-neutral-700 font-mono leading-relaxed resize-none bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Generated Result */}
        <div className="flex-[1.1] min-w-[300px] flex flex-col bg-white">
          <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between z-10">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">03. Ausgabe</span>
            <div className="flex items-center gap-2">
              {streaming && <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />}
              {displayLatency && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[10px] text-neutral-500 font-mono">{displayLatency}ms</span>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
            {displayOutput ? (
              <div ref={outputRef} className="bg-white border border-neutral-200 rounded p-4 h-full overflow-y-auto leading-relaxed text-xs text-neutral-800 shadow-inner whitespace-pre-wrap">
                {displayOutput}
                {streaming && <span className="inline-block w-1.5 h-3.5 bg-neutral-400 animate-pulse ml-0.5 align-text-bottom" />}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-8">Noch keine Ausgabe</p>
            )}
          </div>
        </div>

        {/* Column 4: Evaluation Results */}
        <div className="flex-[1.3] min-w-[320px] flex flex-col bg-neutral-50/50">
          <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between z-10">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">04. Evaluierung</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
            {overallScore != null ? (
              <>
                <div className="p-4 bg-white border border-green-200 rounded-lg flex items-center gap-4 mb-6 shadow-sm">
                  <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-neutral-900">{Math.round(Number(overallScore))}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{Number(overallScore) >= 80 ? "Bestanden" : "Überprüfung nötig"}</p>
                    <p className="text-[10px] text-neutral-500">Konfidenz: {Number(overallScore) >= 90 ? "Hoch" : Number(overallScore) >= 70 ? "Mittel" : "Niedrig"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {scores.map((s, i) => (
                    <ResultItem
                      key={i}
                      title={s.criteria_title}
                      score={Number(s.score)}
                      note={s.note || undefined}
                      icon={Number(s.score) >= 0.9
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <AlertCircle className="w-4 h-4 text-orange-500" />
                      }
                    />
                  ))}
                </div>

                {latestRun?.summary_text && (
                  <div className="mt-8 border border-neutral-200 rounded p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      <Info className="w-3.5 h-3.5" /> Zusammenfassung
                    </div>
                    <p className="text-neutral-700 text-xs leading-relaxed">
                      {latestRun.summary_text}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-8">Noch keine Evaluierungsergebnisse</p>
            )}
          </div>
        </div>
      </div>

      {showCriterionModal && (
        <AddCriterionModal
          projectId={project.id}
          usedWeight={totalWeight}
          onClose={() => setShowCriterionModal(false)}
          onCreated={(c) => {
            setCriteria([...criteria, c]);
            setShowCriterionModal(false);
          }}
        />
      )}

      {showConfigModal && (
        <DefaultModelModal
          projectId={project.id}
          currentModel={project.default_model}
          availableModels={availableModels}
          onClose={() => setShowConfigModal(false)}
          onSaved={(model) => {
            setProject({ ...project, default_model: model });
            setShowConfigModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddCriterionModal({
  projectId,
  usedWeight,
  onClose,
  onCreated,
}: {
  projectId: string;
  usedWeight: number;
  onClose: () => void;
  onCreated: (c: Criterion) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(Math.min(100 - usedWeight, 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const remaining = 100 - usedWeight;
  const validWeight = weight > 0 && weight <= remaining;

  const handleSave = async () => {
    if (!title.trim()) { setError("Name ist erforderlich."); return; }
    if (!validWeight) { setError(`Gewichtung muss zwischen 1 und ${remaining} liegen.`); return; }
    setSaving(true);
    setError("");
    try {
      const c = await api<Criterion>(`/api/projects/${projectId}/criteria`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim(), weight }),
      });
      onCreated(c);
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">Kriterium hinzufügen</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Name</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Relevanz, Ton, Korrektheit…"
            className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe, was dieses Kriterium bewertet…"
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">
            Gewichtung
            <span className="ml-2 font-normal normal-case text-neutral-400">({remaining} von 100 verfügbar)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={remaining}
              value={weight}
              onChange={(e) => setWeight(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 px-3 py-2 border border-neutral-300 rounded text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${validWeight ? "bg-primary-400" : "bg-red-400"}`}
                style={{ width: `${Math.min((weight / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !validWeight}
            className="flex-1 px-3 py-1.5 text-xs font-bold bg-primary-400 border border-primary-500 rounded text-black hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

function DefaultModelModal({
  projectId,
  currentModel,
  availableModels,
  onClose,
  onSaved,
}: {
  projectId: string;
  currentModel: string | null;
  availableModels: ProviderModel[];
  onClose: () => void;
  onSaved: (model: string | null) => void;
}) {
  const [selectedModel, setSelectedModel] = useState(currentModel || "");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableModels;
    const q = search.toLowerCase();
    return availableModels.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    );
  }, [search, availableModels]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/api/projects/${projectId}/default-model`, {
        method: "PATCH",
        body: JSON.stringify({ default_model: selectedModel || null }),
      });
      onSaved(selectedModel || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Standardmodell</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-neutral-500 mb-3">Wird bei neuen Evaluierungen vorausgewählt.</p>
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Modell suchen…"
            className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
        </div>
        <div className="border border-neutral-200 rounded max-h-56 overflow-y-auto">
          <button
            type="button"
            onClick={() => setSelectedModel("")}
            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-50 ${selectedModel === "" ? "bg-primary-50 font-semibold" : ""}`}
          >
            {selectedModel === "" && <Check className="w-3 h-3 text-primary-600 shrink-0" />}
            <span className={selectedModel === "" ? "" : "pl-5"}>Kein Standardmodell</span>
          </button>
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModel(m.id)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-50 border-t border-neutral-100 ${selectedModel === m.id ? "bg-primary-50 font-semibold" : ""}`}
            >
              {selectedModel === m.id && <Check className="w-3 h-3 text-primary-600 shrink-0" />}
              <span className={selectedModel === m.id ? "" : "pl-5"}>
                {m.name !== m.id ? m.name : m.id}
                {m.name !== m.id && <span className="text-neutral-400 ml-1.5 font-mono">{m.id}</span>}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-neutral-400 text-center">Keine Modelle gefunden</div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-3 py-1.5 text-xs font-bold bg-primary-400 border border-primary-500 rounded text-black hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function CriteriaCard({ title, desc, weight }: React.ComponentProps<"div"> & { title: string; desc: string; weight: string }) {
  return (
    <div className="p-3 border border-neutral-200 rounded bg-white hover:border-neutral-300 transition-all cursor-default">
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-semibold text-neutral-900 text-xs">{title}</h3>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 bg-neutral-50 font-mono tracking-widest">{weight}</span>
      </div>
      <p className="text-[10px] text-neutral-500 leading-snug">{desc}</p>
    </div>
  );
}

function ResultItem({ title, score, note, icon }: React.ComponentProps<"div"> & { title: string; score: number; note?: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 text-xs">{title}</span>
          {note && <span className="text-[10px] text-neutral-500">{note}</span>}
        </div>
      </div>
      <span className={`text-[11px] font-bold font-mono ${score >= 0.9 ? 'text-green-600' : 'text-neutral-600'}`}>{score.toFixed(1)}</span>
    </div>
  );
}
