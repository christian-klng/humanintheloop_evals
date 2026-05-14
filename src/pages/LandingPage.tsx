import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center pt-8 overflow-x-hidden w-full bg-[#FCFCFC] text-[#1A1A1A]">
      {/* Navigation */}
      <nav className="w-full max-w-6xl flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900">
          <div className="w-5 h-5 bg-yellow-400 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-black rotate-45"></div>
          </div>
          SYNTAX.AI
        </div>
        <div className="flex items-center gap-6 text-xs font-medium text-neutral-500">
          <Link to="#" className="hover:text-neutral-900 transition-colors">Features</Link>
          <Link to="#" className="hover:text-neutral-900 transition-colors">Methodology</Link>
          <Link to="#" className="hover:text-neutral-900 transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to="/login" className="text-neutral-500 hover:text-neutral-900 transition-colors">Log in</Link>
          <Link to="/login" className="px-3 py-1.5 text-xs font-bold bg-yellow-400 border border-yellow-500 rounded shadow-sm text-black transition-colors hover:bg-yellow-500">
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center text-center px-6 mt-32 relative z-10">
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-neutral-100/50 border border-neutral-200 mb-8 text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
          <span className="w-2 h-2 rounded bg-yellow-400 border border-yellow-500"></span>
          EvalMaster v2.0 is now live
        </div>
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-[#1A1A1A] leading-[1.1] mb-6">
          Evaluate AI Prompts <br />
          <span className="text-neutral-400">with absolute precision.</span>
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl font-light mb-10 leading-relaxed">
          Bring software engineering rigor to prompt engineering. Test, evaluate, and version your LLM outputs in one beautiful workspace.
        </p>

        <div className="flex items-center gap-4 z-20">
          <Link to="/login" className="px-4 py-2 text-sm font-bold bg-yellow-400 border border-yellow-500 rounded shadow-sm hover:bg-yellow-500 text-[#1A1A1A] transition-all">
            Start evaluating for free
          </Link>
          <Link to="#" className="px-4 py-2 text-sm font-medium bg-white border border-neutral-200 rounded shadow-sm text-[#1A1A1A] hover:bg-neutral-50 transition-colors">
            Book a demo
          </Link>
        </div>
      </main>

      {/* Mockup visual to anchor the bottom */}
      <div className="w-full max-w-5xl mt-24 px-6 relative">
        <div className="w-full aspect-[16/9] bg-[#FCFCFC] rounded-t border-t border-l border-r border-neutral-200 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 w-full h-10 border-b border-neutral-200 bg-white flex items-center px-4 gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-200"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-200"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-200"></div>
          </div>
          <div className="w-full h-full pt-10 flex text-[#1A1A1A]">
            {/* Fake layout to resemble the app */}
            <div className="w-64 border-r border-neutral-200 p-4 bg-neutral-50 flex flex-col gap-2">
              <div className="h-4 w-24 bg-neutral-200 rounded-sm mb-4"></div>
              <div className="h-3 w-32 bg-neutral-200/50 rounded-sm"></div>
              <div className="h-3 w-28 bg-neutral-200/50 rounded-sm"></div>
            </div>
            <div className="flex-1 p-6 flex gap-4 divide-x divide-neutral-200">
               <div className="flex-1 p-4 bg-white border border-neutral-200 rounded"><div className="h-4 w-32 bg-neutral-100 rounded-sm mb-4"></div></div>
               <div className="flex-1 p-4 bg-white border border-neutral-200 rounded"><div className="h-4 w-32 bg-neutral-100 rounded-sm mb-4"></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-neutral-200 mt-auto flex flex-col items-center relative z-20">
        <div className="w-full max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900 mb-4">
              <div className="w-5 h-5 bg-yellow-400 rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-black rotate-45"></div>
              </div>
              SYNTAX.AI
            </div>
            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed mb-6">
              Bring software engineering rigor to your AI workflows. Test, evaluate, and version LLM outputs with absolute precision.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 font-medium">
               <span>NYC</span>
               <span>•</span>
               <span>LONDON</span>
               <span>•</span>
               <span>SF</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 mb-4">Product</h4>
            <ul className="space-y-3 text-xs text-neutral-500 font-medium">
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Features</Link></li>
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Integrations</Link></li>
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Pricing</Link></li>
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-xs text-neutral-500 font-medium">
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-neutral-900 transition-colors">Security</Link></li>
              <li><Link to="#" className="flex items-center gap-2 hover:text-neutral-900 transition-colors">
                System Status
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              </Link></li>
            </ul>
          </div>
        </div>
        
        <div className="w-full border-t border-neutral-200">
          <div className="w-full max-w-6xl mx-auto px-6 h-10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} SYNTAX.AI, INC.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">● ALL SYSTEMS OPERATIONAL</span>
              <span className="text-neutral-900 font-bold">V.2.4.1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
