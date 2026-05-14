export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center pt-8 overflow-x-hidden w-full bg-[#FCFCFC] text-[#1A1A1A]">
      {/* Navigation */}
      <nav className="w-full max-w-6xl flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900">
          <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
          HUMAN IN THE LOOP
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center text-center px-6 mt-32 relative z-10">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-[#1A1A1A] leading-[1.1] mb-6">
          Human in the Loop <br />
          <span className="text-neutral-400">Academy</span>
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl font-light mb-10 leading-relaxed">
          Verbessere die Antworten von Gro&szlig;en Sprachmodellen mit wenigen Klicks. Von einem einfachen Prompt zu hochwertigen Automatisierungen. <span className="italic text-neutral-400">Diese Webseite ist im Aufbau.</span>
        </p>
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
        <div className="w-full max-w-6xl px-6 py-16">
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900 mb-4">
            <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
            HUMAN IN THE LOOP
          </div>
          <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
            Verbessere die Antworten von Gro&szlig;en Sprachmodellen mit wenigen Klicks. Von einem einfachen Prompt zu hochwertigen Automatisierungen.
          </p>
        </div>

        <div className="w-full border-t border-neutral-200">
          <div className="w-full max-w-6xl mx-auto px-6 h-10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>&copy; {new Date().getFullYear()} HUMAN IN THE LOOP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
