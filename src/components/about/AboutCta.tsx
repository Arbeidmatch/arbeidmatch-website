import Link from "next/link";

export default function AboutCta() {
  return (
    <section className="bg-[#0f1923] px-6 py-[100px]">
      <div className="mx-auto max-w-[600px] text-center">
        <h2
          className="mb-4 text-white"
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          Klar til å finne de riktige arbeiderne?
        </h2>
        <p
          className="text-[rgba(255,255,255,0.65)]"
          style={{ fontSize: "17px", marginBottom: "40px" }}
        >
          Ta kontakt i dag og få pre-kvalifiserte kandidater levert innen 2 uker.
        </p>
        <div className="flex flex-wrap justify-center gap-4" style={{ gap: "16px" }}>
          <Link
            href="/request"
            className="inline-block rounded-lg bg-[#C9A84C] px-8 py-4 text-[15px] font-semibold text-[#0f1923] transition-colors duration-[180ms] hover:bg-[#b8953f]"
            style={{ padding: "16px 32px", borderRadius: "8px" }}
          >
            Be om kandidater
          </Link>
          <Link
            href="/contact"
            className="inline-block rounded-lg border border-white/30 bg-transparent px-8 py-4 text-[15px] font-medium text-white transition-colors duration-[180ms] hover:border-white"
            style={{ padding: "16px 32px", borderRadius: "8px", borderWidth: "1px" }}
          >
            Kontakt oss
          </Link>
        </div>
      </div>
    </section>
  );
}
