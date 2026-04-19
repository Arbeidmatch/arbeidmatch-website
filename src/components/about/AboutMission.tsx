const BULLETS = [
  "Direkte sourcing fra 30+ EU/EEA-land",
  "Full overholdelse av norsk arbeidslovgivning",
  "Dedikert rekrutterer per kunde",
  "Oppfølging etter hver plassering",
] as const;

export default function AboutMission() {
  return (
    <section className="bg-white px-6 py-[100px]">
      <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-2 md:gap-20">
        <div>
          <span
            className="mb-[-20px] block text-[#C9A84C] opacity-30"
            style={{ fontSize: "80px", lineHeight: 1 }}
            aria-hidden
          >
            ❝
          </span>
          <p
            className="text-[#0f1923]"
            style={{
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Vi tror på lovlig, rettferdig og lønnsom arbeidskraft — for alle parter.
          </p>
        </div>
        <div>
          <p
            className="mb-8 text-[#374151]"
            style={{ fontSize: "17px", lineHeight: 1.8, marginBottom: "32px" }}
          >
            Siden oppstarten i 2025 har ArbeidMatch hjulpet norske bedrifter med å finne riktige fagarbeidere fra hele
            EU/EEA. Vi kombinerer direkte sourcing, strukturert screening og personlig oppfølging for å levere
            arbeidskraft som faktisk fungerer — raskt, lovlig og med full dokumentasjon.
          </p>
          <ul className="list-none p-0">
            {BULLETS.map((text) => (
              <li
                key={text}
                className="mb-3 flex items-center text-[15px] text-[#374151]"
                style={{ marginBottom: "12px" }}
              >
                <span
                  className="inline-block shrink-0 rounded-full bg-[#C9A84C]"
                  style={{ width: "6px", height: "6px", marginRight: "12px" }}
                  aria-hidden
                />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
