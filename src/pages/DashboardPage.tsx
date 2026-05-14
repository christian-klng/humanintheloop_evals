import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface Project {
  id: string;
  name: string;
  models: string | null;
  last_run: string | null;
  status: string;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function DashboardPage() {
  const { logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Project[]>("/api/projects")
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleNewProject = async () => {
    const name = prompt("Project name:");
    if (!name?.trim()) return;
    const project = await api<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });
    setProjects((prev) => [project, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-[#1A1A1A]">
      <header className="h-12 border-b border-neutral-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10 w-full">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900">
            <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
            HUMAN IN THE LOOP
          </Link>
          <nav className="flex gap-4 text-xs font-medium text-neutral-500">
            <Link to="/dashboard" className="text-neutral-900 border-b-2 border-yellow-400 h-12 flex items-center">Projects</Link>
            <Link to="#" className="h-12 flex items-center hover:text-neutral-900 cursor-pointer">Datasets</Link>
            <Link to="#" className="h-12 flex items-center hover:text-neutral-900 cursor-pointer">Settings</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={logout} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
            Log out
          </button>
          <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Projects</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage and monitor your evaluation pipelines.</p>
          </div>
          <button
            onClick={handleNewProject}
            className="px-3 py-1.5 text-xs font-bold bg-yellow-400 border border-yellow-500 rounded shadow-sm text-black hover:bg-yellow-500 transition-colors flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            New Project
          </button>
        </div>

        <div className="border border-neutral-200 rounded bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            <div className="col-span-12 sm:col-span-5">Name</div>
            <div className="hidden sm:block col-span-3">Models</div>
            <div className="hidden sm:block col-span-2">Last Run</div>
            <div className="hidden sm:flex col-span-2 justify-end text-right">Status</div>
          </div>
          <div className="divide-y divide-neutral-200 bg-white">
            {loading ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No projects yet. Create your first one to get started.
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
                      {project.models || "No runs yet"}
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
  );
}
