// Kept for future About page redesign.

const ROWS = [
  { label: "Selskapsnavn", value: "ArbeidMatch Norge AS" },
  { label: "Organisasjonsnummer", value: "935 667 089 (MVA-registrert)" },
  { label: "Stiftet", value: "08. mai 2025" },
  { label: "Bransje", value: "78.200 - Midlertidig ansettelse" },
  { label: "Adresse", value: "Sverre Svendsens veg 38, 7056 Ranheim, Trondheim" },
  { label: "E-post", value: "post@arbeidmatch.no" },
  { label: "Telefon", value: "967 34 730" },
  { label: "Registrert i", value: "Brønnøysundregistrene" },
] as const;

export default function AboutCompanyFacts() {
  return (
    <section className="bg-[#0f1923] px-6 py-[100px]">
      <div className="mx-auto max-w-[900px]">
        <p
          className="text-[#C9A84C]"
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}
        >
          Registrerte opplysninger
        </p>
        <h2 className="text-[36px] font-bold text-white" style={{ marginBottom: "48px" }}>
          Selskapsinfo
        </h2>
        <div
          className="grid grid-cols-1 gap-0 rounded-2xl border border-white/[0.08] bg-white/[0.04] md:grid-cols-2"
          style={{ padding: "48px", borderRadius: "16px" }}
        >
          {ROWS.map((row, index) => {
            const showBorderMobile = index < ROWS.length - 1;
            const showBorderDesktop = index < ROWS.length - 2;
            return (
              <div
                key={row.label}
                className={[
                  "border-white/[0.06]",
                  showBorderMobile ? "border-b" : "",
                  showBorderDesktop ? "md:border-b" : "md:border-b-0",
                ].join(" ")}
                style={{ padding: "20px 0" }}
              >
                <div
                  className="text-[#C9A84C]"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "4px",
                  }}
                >
                  {row.label}
                </div>
                <div className="text-[15px] font-medium text-white">{row.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
