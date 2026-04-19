export default function AboutHero() {
  return (
    <section
      className="w-full bg-[#0f1923]"
      style={{ paddingTop: "120px", paddingBottom: "100px" }}
    >
      <div className="mx-auto max-w-[800px] px-6 text-center">
        <p
          className="text-[#C9A84C]"
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "24px",
          }}
        >
          Om oss
        </p>
        <h1
          className="text-white"
          style={{
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "24px",
          }}
        >
          Vi bygger broer mellom Europa og norsk næringsliv
        </h1>
        <p
          className="mx-auto text-[rgba(255,255,255,0.65)]"
          style={{
            fontSize: "18px",
            lineHeight: 1.75,
            maxWidth: "640px",
            margin: "0 auto",
          }}
        >
          ArbeidMatch ble grunnlagt i Trondheim i 2025 med ett klart oppdrag - å gjøre det enklere for norske bedrifter
          å finne kvalifiserte arbeidere fra EU/EEA, og gi europeiske arbeidere tilgang til lovlige, godt betalte jobber
          i Norge.
        </p>
        <div
          className="mx-auto bg-[#C9A84C]"
          style={{ width: "60px", height: "1px", margin: "48px auto 0" }}
          aria-hidden
        />
      </div>
    </section>
  );
}
