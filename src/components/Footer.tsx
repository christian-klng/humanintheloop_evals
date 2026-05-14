import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-neutral-200 mt-auto flex flex-col items-center">
      <div className="w-full max-w-6xl px-6 py-16">
        <div className="flex items-center gap-2 font-semibold text-sm tracking-tight text-neutral-900 mb-4">
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
  );
}
