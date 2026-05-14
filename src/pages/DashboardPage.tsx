import { Link } from "react-router-dom";
import { Plus, Users, Copy, Check, ChevronDown, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface Project {
  id: string;
  name: string;
  models: string | null;
  last_run: string | null;
  status: string;
  workspace_id: string | null;
}

interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  role: string;
  member_count: number;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nie";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

function JoinWorkspaceModal({ onClose, onJoined }: { onClose: () => void; onJoined: (ws: Workspace) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length !== 6) {
      setError("Bitte gib einen 6-stelligen Code ein.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ws = await api<Workspace>("/api/workspaces/join", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      onJoined(ws);
    } catch (err: any) {
      setError(err.message || "Code ungültig");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-neutral-900 mb-1">Arbeitsbereich beitreten</h2>
        <p className="text-xs text-neutral-500 mb-4">Gib den 6-stelligen Einladungscode ein.</p>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm font-mono text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50">
            Abbrechen
          </button>
          <button
            onClick={handleJoin}
            disabled={loading || code.length !== 6}
            className="flex-1 px-3 py-1.5 text-xs font-bold bg-yellow-400 border border-yellow-500 rounded text-black hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "..." : "Beitreten"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ws: Workspace) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const ws = await api<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      onCreated(ws);
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-neutral-900 mb-1">Arbeitsbereich erstellen</h2>
        <p className="text-xs text-neutral-500 mb-4">Gib deinem Arbeitsbereich einen Namen.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Mein Team"
          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50">
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 px-3 py-1.5 text-xs font-bold bg-yellow-400 border border-yellow-500 rounded text-black hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "..." : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors text-[10px] font-mono tracking-wider text-neutral-600"
      title="Code kopieren"
    >
      {code}
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-neutral-400" />}
    </button>
  );
}

function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  onSelect,
}: {
  workspaces: Workspace[];
  activeWorkspace: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = activeWorkspace
    ? workspaces.find((w) => w.id === activeWorkspace)
    : null;

  const label = current ? current.name : "Meine Projekte";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-12 text-sm font-semibold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors"
      >
        <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-0 w-52 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
              activeWorkspace === null
                ? "bg-yellow-50 text-neutral-900 font-semibold"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            Meine Projekte
          </button>
          {workspaces.length > 0 && <div className="border-t border-neutral-100 my-1" />}
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { onSelect(ws.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                activeWorkspace === ws.id
                  ? "bg-yellow-50 text-neutral-900 font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-3 h-3 text-neutral-400" />
                <span className="truncate">{ws.name}</span>
              </span>
              <span className="text-[10px] text-neutral-400">{ws.member_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProviderModel {
  id: string;
  name: string;
}

interface ProviderConfig {
  provider: string | null;
  api_key_masked?: string;
  configured_at?: string;
}

function WorkspaceSettings({ apiBase }: { apiBase: string }) {
  const [provider, setProvider] = useState<"openrouter" | "cortecs" | "">("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [configuredAt, setConfiguredAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [modelFilter, setModelFilter] = useState("");

  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const data = await api<{ models: ProviderModel[] }>(`${apiBase}/provider/models`);
      setModels(data.models || []);
    } catch {
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [apiBase]);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    setError("");
    try {
      const config = await api<ProviderConfig>(`${apiBase}/provider`);
      if (config.provider) {
        setProvider(config.provider as "openrouter" | "cortecs");
        setMaskedKey(config.api_key_masked || null);
        setConfiguredAt(config.configured_at || null);
        loadModels();
      } else {
        setProvider("");
        setMaskedKey(null);
        setConfiguredAt(null);
        setModels([]);
      }
    } catch {
      setError("Konfiguration konnte nicht geladen werden.");
    } finally {
      setLoadingConfig(false);
    }
  }, [apiBase, loadModels]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!provider || !apiKey.trim()) {
      setError("Bitte wähle einen Anbieter und gib einen API-Schlüssel ein.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    setTestResult(null);
    try {
      const result = await api<ProviderConfig>(`${apiBase}/provider`, {
        method: "PUT",
        body: JSON.stringify({ provider, api_key: apiKey.trim() }),
      });
      setMaskedKey(result.api_key_masked || null);
      setConfiguredAt(result.configured_at || null);
      setApiKey("");
      setSuccess("Anbieter erfolgreich konfiguriert.");
      loadModels();
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api<{ ok: boolean; error?: string }>(`${apiBase}/provider/test`, {
        method: "POST",
      });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      await api(`${apiBase}/provider`, { method: "DELETE" });
      setProvider("");
      setMaskedKey(null);
      setConfiguredAt(null);
      setModels([]);
      setApiKey("");
      setTestResult(null);
      setSuccess("Anbieter-Konfiguration entfernt.");
    } catch (err: any) {
      setError(err.message || "Fehler beim Entfernen.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredModels = modelFilter
    ? models.filter(
        (m) =>
          m.id.toLowerCase().includes(modelFilter.toLowerCase()) ||
          m.name.toLowerCase().includes(modelFilter.toLowerCase())
      )
    : models;

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">Einstellungen</h1>
        <p className="text-sm text-neutral-500 mt-1">Konfiguriere den LLM-Anbieter für deine Evaluierungen.</p>
      </div>

      <div className="border border-neutral-200 rounded bg-white shadow-sm p-6 space-y-6">
        <div>
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-3">Anbieter</label>
          <div className="flex gap-3">
            {(["cortecs", "openrouter"] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setProvider(p); setError(""); setSuccess(""); }}
                className={`px-4 py-2.5 text-xs font-medium border rounded transition-colors ${
                  provider === p
                    ? "bg-yellow-50 border-yellow-400 text-neutral-900 font-bold"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {p === "cortecs" ? "Cortecs AI" : "OpenRouter"}
              </button>
            ))}
          </div>
        </div>

        {provider && (
          <div>
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">API-Schlüssel</label>
            {maskedKey && !apiKey && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-neutral-500 font-mono">{maskedKey}</span>
                {configuredAt && (
                  <span className="text-[10px] text-neutral-400">
                    — zuletzt aktualisiert {new Date(configuredAt).toLocaleDateString("de-DE")}
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(""); setSuccess(""); }}
                  placeholder={maskedKey ? "Neuen Schlüssel eingeben..." : "API-Schlüssel eingeben..."}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-xs font-mono pr-9 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !provider || !apiKey.trim()}
                className="px-4 py-2 text-xs font-bold bg-yellow-400 border border-yellow-500 rounded text-black hover:bg-yellow-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Speichern
              </button>
              {maskedKey && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-4 py-2 text-xs font-medium border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {testing && <Loader2 className="w-3 h-3 animate-spin" />}
                  Testen
                </button>
              )}
              {maskedKey && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-2 text-xs border border-neutral-200 rounded text-red-500 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
                  title="Konfiguration entfernen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}
        {testResult && (
          <p className={`text-xs ${testResult.ok ? "text-green-600" : "text-red-500"}`}>
            {testResult.ok ? "Verbindung erfolgreich." : `Verbindung fehlgeschlagen: ${testResult.error || "Unbekannter Fehler"}`}
          </p>
        )}
      </div>

      {maskedKey && (
        <div className="border border-neutral-200 rounded bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Verfügbare Modelle</span>
              <span className="text-[10px] text-neutral-400 ml-2">{models.length} Modelle</span>
            </div>
            {models.length > 10 && (
              <input
                type="text"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                placeholder="Modelle filtern..."
                className="px-2.5 py-1.5 border border-neutral-200 rounded text-xs w-48 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {loadingModels ? (
              <div className="p-6 text-center">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400 mx-auto" />
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                {modelFilter ? "Keine Modelle gefunden." : "Keine Modelle verfügbar."}
              </div>
            ) : (
              filteredModels.map((model) => (
                <div key={model.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-neutral-50">
                  <span className="text-xs font-mono text-neutral-700 truncate">{model.id}</span>
                  {model.name !== model.id && (
                    <span className="text-[10px] text-neutral-400 ml-3 truncate">{model.name}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"projekte" | "einstellungen">("projekte");

  const loadProjects = useCallback(async (workspaceId: string | null) => {
    setLoading(true);
    try {
      const url = workspaceId ? `/api/projects?workspace_id=${workspaceId}` : "/api/projects";
      const data = await api<Project[]>(url);
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api<Workspace[]>("/api/workspaces").then(setWorkspaces);
    loadProjects(null);
  }, [loadProjects]);

  const handleSelectWorkspace = (id: string | null) => {
    setActiveWorkspace(id);
    setActiveTab("projekte");
    loadProjects(id);
  };

  const handleNewProject = async () => {
    const name = prompt("Projektname:");
    if (!name?.trim()) return;
    const project = await api<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), workspace_id: activeWorkspace }),
    });
    setProjects((prev) => [project, ...prev]);
  };

  const handleWorkspaceJoined = (ws: Workspace) => {
    setShowJoinModal(false);
    if (!workspaces.find((w) => w.id === ws.id)) {
      setWorkspaces((prev) => [...prev, { ...ws, role: "member", member_count: 0 }]);
    }
    setActiveWorkspace(ws.id);
    loadProjects(ws.id);
  };

  const handleWorkspaceCreated = (ws: Workspace) => {
    setShowCreateModal(false);
    setWorkspaces((prev) => [...prev, { ...ws, role: "owner", member_count: 1 }]);
    setActiveWorkspace(ws.id);
    loadProjects(ws.id);
  };

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspace);

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-[#1A1A1A]">
      <header className="h-12 border-b border-neutral-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10 w-full">
        <div className="flex items-center gap-6">
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onSelect={handleSelectWorkspace}
          />
          <nav className="flex gap-4 text-xs font-medium text-neutral-500">
            <button
              onClick={() => setActiveTab("projekte")}
              className={`h-12 flex items-center transition-colors ${activeTab === "projekte" ? "text-neutral-900 border-b-2 border-yellow-400" : "hover:text-neutral-900"}`}
            >
              Projekte
            </button>
            <button className="h-12 flex items-center hover:text-neutral-900 cursor-pointer">Datensätze</button>
            <button
              onClick={() => setActiveTab("einstellungen")}
              className={`h-12 flex items-center transition-colors ${activeTab === "einstellungen" ? "text-neutral-900 border-b-2 border-yellow-400" : "hover:text-neutral-900"}`}
            >
              Einstellungen
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Bereich erstellen
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Bereich beitreten
          </button>
          <div className="w-px h-5 bg-neutral-200" />
          <button onClick={logout} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
            Abmelden
          </button>
          <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {activeTab === "einstellungen" ? (
          <WorkspaceSettings apiBase={activeWorkspace ? `/api/workspaces/${activeWorkspace}` : "/api/me"} />
        ) : (
          <>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">Projekte</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  {currentWorkspace
                    ? "Projekte in diesem Arbeitsbereich."
                    : "Deine privaten Evaluierungspipelines."}
                </p>
                {currentWorkspace && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wide font-bold">Einladungscode:</span>
                    <InviteCodeDisplay code={currentWorkspace.invite_code} />
                  </div>
                )}
              </div>
              <button
                onClick={handleNewProject}
                className="px-3 py-1.5 text-xs font-bold bg-yellow-400 border border-yellow-500 rounded shadow-sm text-black hover:bg-yellow-500 transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Neues Projekt
              </button>
            </div>

            <div className="border border-neutral-200 rounded bg-white overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                <div className="col-span-12 sm:col-span-5">Name</div>
                <div className="hidden sm:block col-span-3">Modelle</div>
                <div className="hidden sm:block col-span-2">Letzter Lauf</div>
                <div className="hidden sm:flex col-span-2 justify-end text-right">Status</div>
              </div>
              <div className="divide-y divide-neutral-200 bg-white">
                {loading ? (
                  <div className="p-8 text-center text-xs text-neutral-400">Laden...</div>
                ) : projects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    {currentWorkspace
                      ? "Noch keine Projekte in diesem Arbeitsbereich."
                      : "Noch keine Projekte. Erstelle dein erstes, um loszulegen."}
                  </div>
                ) : (
                  projects.map((project) => (
                    <Link key={project.id} to={`/project/${project.id}`} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-neutral-50 transition-colors group cursor-pointer block sm:grid">
                      <div className="col-span-12 sm:col-span-5 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        </div>
                        <span className="font-semibold text-neutral-900 text-xs transition-colors truncate">{project.name}</span>
                      </div>
                      <div className="hidden sm:flex col-span-3 items-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-200 bg-neutral-100 text-neutral-600 font-mono text-[10px] truncate">
                          {project.models || "Noch keine Läufe"}
                        </span>
                      </div>
                      <div className="hidden sm:block col-span-2 text-[11px] text-neutral-500">{formatTimeAgo(project.last_run)}</div>
                      <div className="hidden sm:flex col-span-2 justify-end">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-wide border border-neutral-200 bg-white text-neutral-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          {project.status.toUpperCase()}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {showJoinModal && <JoinWorkspaceModal onClose={() => setShowJoinModal(false)} onJoined={handleWorkspaceJoined} />}
      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} onCreated={handleWorkspaceCreated} />}
    </div>
  );
}
