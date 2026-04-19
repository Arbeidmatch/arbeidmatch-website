const STATS = [
  { value: "500+", label: "Vellykkede plasseringer" },
  { value: "50+", label: "Aktive norske kunder" },
  { value: "30", label: "EU/EEA-land vi rekrutterer fra" },
  { value: "98%", label: "Kundetilfredshet" },
] as const;

export default function AboutStats() {
  return (
    <section className="bg-[#f9f8f5] px-6 py-[60px]">
      <div className="mx-auto grid w-full grid-cols-2 md:grid-cols-4">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={["text-center", index < 3 ? "border-r border-[rgba(0,0,0,0.08)]" : ""].join(" ")}
            style={{ padding: "20px" }}
          >
            <div
              className="text-[#C9A84C]"
              style={{ fontSize: "52px", fontWeight: 800, lineHeight: 1 }}
            >
              {stat.value}
            </div>
            <div
              className="text-[#6b7280]"
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: "8px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
