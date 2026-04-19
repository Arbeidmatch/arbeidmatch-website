// Kept for future About page redesign.

const MILESTONES = [
  { date: "Mai 2025", text: "Selskapet stiftet i Trondheim" },
  { date: "Juni 2025", text: "Første norske kunde signert" },
  { date: "August 2025", text: "50+ kandidater registrert i databasen" },
  { date: "Oktober 2025", text: "100 vellykkede plasseringer fullført" },
  { date: "Desember 2025", text: "30+ aktive norske kunder" },
  { date: "Februar 2026", text: "500+ plasseringer fullført" },
  { date: "Pågående", text: "Ekspansjon til nye bransjer og byer i Norge" },
] as const;

function MilestoneCard({ date, text }: { date: string; text: string }) {
  return (
    <div
      className="rounded-[10px] border border-black/[0.06] bg-white px-5 py-4"
      style={{ padding: "16px 20px", borderRadius: "10px" }}
    >
      <div className="text-[13px] font-semibold text-[#C9A84C]">{date}</div>
      <div className="mt-1 text-[15px] text-[#374151]" style={{ marginTop: "4px" }}>
        {text}
      </div>
    </div>
  );
}

export default function AboutTimeline() {
  return (
    <section className="bg-[#f9f8f5] px-6 py-[100px]">
      <div className="mx-auto max-w-[800px]">
        <p
          className="text-[#C9A84C]"
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}
        >
          Vår reise
        </p>
        <h2 className="text-[36px] font-bold text-[#0f1923]" style={{ marginBottom: "64px" }}>
          Fra idé til 500+ plasseringer
        </h2>

        {/* Mobile: line at left 20px, content to the right */}
        <div className="relative md:hidden">
          <div
            className="absolute bottom-0 top-0 w-[2px] bg-[#C9A84C]"
            style={{ left: "20px" }}
            aria-hidden
          />
          <div className="space-y-10">
            {MILESTONES.map((m) => (
              <div key={m.date} className="relative pl-[44px]">
                <div
                  className="absolute left-[21px] top-5 z-10 -translate-x-1/2 rounded-full border-[3px] border-white bg-[#C9A84C]"
                  style={{ width: "12px", height: "12px" }}
                  aria-hidden
                />
                <MilestoneCard date={m.date} text={m.text} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="relative hidden md:block">
          <div
            className="absolute bottom-0 top-0 w-[2px] -translate-x-1/2 bg-[#C9A84C]"
            style={{ left: "50%" }}
            aria-hidden
          />
          <div className="space-y-12">
            {MILESTONES.map((m, i) => (
              <div key={m.date} className="relative grid grid-cols-2 gap-x-12">
                <div className="flex justify-end">
                  {i % 2 === 1 ? <MilestoneCard date={m.date} text={m.text} /> : null}
                </div>
                <div className="flex justify-start">
                  {i % 2 === 0 ? <MilestoneCard date={m.date} text={m.text} /> : null}
                </div>
                <div
                  className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border-[3px] border-white bg-[#C9A84C]"
                  style={{ width: "12px", height: "12px" }}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
