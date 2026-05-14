import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
      <Link to="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-neutral-900">
        <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
        HUMAN IN THE LOOP
      </Link>
      <Link to="/impressum" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Impressum</Link>
    </nav>
  );
}
