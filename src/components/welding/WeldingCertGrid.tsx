"use client";

import { WELDING_CERT_ITEMS } from "./weldingCertItems";

const GOLD = "#C9A84C";

type Variant = "dark" | "light";

export default function WeldingCertGrid({ variant }: { variant: Variant }) {
  const isDark = variant === "dark";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {WELDING_CERT_ITEMS.map(({ Icon, title, body }) => (
        <article
          key={title}
          className={`group rounded-[14px] border p-5 transition-[border-color,transform] duration-200 ${
            isDark
              ? "border-white/[0.08] bg-white/[0.03] hover:-translate-y-[3px] hover:border-[rgba(201,168,76,0.4)]"
              : "border-black/[0.08] bg-white hover:-translate-y-[3px] hover:border-[#C9A84C]"
          }`}
          style={{ borderWidth: "0.5px" }}
        >
          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-110"
            style={{
              background: "rgba(201,168,76,0.1)",
              borderColor: "rgba(201,168,76,0.15)",
            }}
          >
            <Icon className="h-[22px] w-[22px]" stroke={GOLD} strokeWidth={1.5} />
          </div>
          <h3 className={`text-[15px] font-bold leading-snug ${isDark ? "text-white" : "text-[#0f1923]"}`}>{title}</h3>
          <p
            className={`mt-1.5 text-[13px] leading-relaxed ${isDark ? "text-white/[0.6]" : "text-[#374151]"}`}
          >
            {body}
          </p>
        </article>
      ))}
    </div>
  );
}
