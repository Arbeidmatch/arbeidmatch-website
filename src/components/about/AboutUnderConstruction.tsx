import Link from "next/link";

const FACTS = [
  { label: "Org.nr", value: "935 667 089 (MVA-registrert)" },
  { label: "Stiftet", value: "08. mai 2025" },
  { label: "Adresse", value: "Sverre Svendsens veg 38, 7056 Ranheim" },
  { label: "E-post", value: "post@arbeidmatch.no" },
  { label: "Telefon", value: "967 34 730" },
  { label: "Bransje", value: "78.200 — Midlertidig ansettelse" },
] as const;

export default function AboutUnderConstruction() {
  return (
    <div className="min-h-[70vh] bg-[#0f1923] text-white">
      <div className="mx-auto max-w-[600px] px-6 py-[120px]">
        <p
          className="inline-block border border-[#C9A84C] text-[#C9A84C]"
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderRadius: "20px",
            padding: "4px 16px",
          }}
        >
          Vi jobber med siden
        </p>
        <h1 className="mt-8 text-[32px] font-bold text-white">ArbeidMatch Norge AS</h1>
        <p className="mt-4 text-base text-white/60">Kommer snart — vi setter opp alt riktig for deg.</p>
        <div className="my-10 border-t border-white/[0.08]" />
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8">
          {FACTS.map((row) => (
            <div key={row.label}>
              <dt
                className="text-[#C9A84C]"
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-12">
          <Link href="/contact" className="text-sm font-medium text-[#C9A84C] hover:underline">
            Ta kontakt med oss →
          </Link>
        </p>
      </div>
    </div>
  );
}
