import { Link } from "react-router-dom";
import { Plus, Users, FolderOpen, LogIn, Copy, Check } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
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

export function DashboardPage() {
  const { logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
          <Link to="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-neutral-900">
            <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
            HUMAN IN THE LOOP
          </Link>
          <nav className="flex gap-4 text-xs font-medium text-neutral-500">
            <Link to="/dashboard" className="text-neutral-900 border-b-2 border-yellow-400 h-12 flex items-center">Projekte</Link>
            <Link to="#" className="h-12 flex items-center hover:text-neutral-900 cursor-pointer">Datensätze</Link>
            <Link to="#" className="h-12 flex items-center hover:text-neutral-900 cursor-pointer">Einstellungen</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={logout} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
            Abmelden
          </button>
          <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300"></div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-3rem)] border-r border-neutral-200 bg-white flex flex-col">
          <div className="p-3">
            <button
              onClick={() => handleSelectWorkspace(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeWorkspace === null
                  ? "bg-yellow-50 text-neutral-900 border border-yellow-200"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              Meine Projekte
            </button>
          </div>

          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Arbeitsbereiche</span>
          </div>

          <div className="flex-1 px-3 space-y-0.5">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  activeWorkspace === ws.id
                    ? "bg-yellow-50 text-neutral-900 border border-yellow-200"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ws.name}</span>
                <span className="ml-auto text-[10px] text-neutral-400">{ws.member_count}</span>
              </button>
            ))}

            {workspaces.length === 0 && (
              <p className="text-[10px] text-neutral-400 px-3 py-2">Noch keine Arbeitsbereiche.</p>
            )}
          </div>

          <div className="p-3 border-t border-neutral-200 space-y-1.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Bereich erstellen
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 rounded transition-colors"
            >
              <LogIn className="w-3 h-3" />
              Bereich beitreten
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                {currentWorkspace ? currentWorkspace.name : "Meine Projekte"}
              </h1>
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
        </main>
      </div>

      {showJoinModal && <JoinWorkspaceModal onClose={() => setShowJoinModal(false)} onJoined={handleWorkspaceJoined} />}
      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} onCreated={handleWorkspaceCreated} />}
    </div>
  );
}
