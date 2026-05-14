import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export function ImpressumPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC] text-[#1A1A1A]">
      <div className="pt-8 flex justify-center">
        <Navbar />
      </div>

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

      <Footer />
    </div>
  );
}
