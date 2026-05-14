import { Link } from "react-router-dom";

export function ImpressumPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC] text-[#1A1A1A]">
      <nav className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900">
          <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
          HUMAN IN THE LOOP
        </Link>
      </nav>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-8">Impressum</h1>

        <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Angaben gem&auml;&szlig; &sect; 5 TMG</h2>
            <p>
              Christian Klang<br />
              K&ouml;penicker Landstr. 262<br />
              12437 Berlin
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Kontakt</h2>
            <p>E-Mail: christian (at) humanintheloop.academy</p>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-neutral-200 flex flex-col items-center">
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
            <Link to="/impressum" className="hover:text-neutral-900 transition-colors">Impressum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
