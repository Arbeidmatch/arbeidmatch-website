"use client";

export default function BetaBanner() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[rgba(201,168,76,0.12)] bg-[#0D1B2A]/95 backdrop-blur-md"
      style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-content items-center justify-center gap-3 px-4 py-2.5 text-center md:px-8">
        <span
          className="hidden h-1 w-1 shrink-0 rounded-full bg-[#C9A84C] sm:block"
          style={{ boxShadow: "0 0 12px rgba(201,168,76,0.35)" }}
          aria-hidden
        />
        <p className="text-[11px] font-medium leading-snug tracking-wide text-white/55 md:text-xs">
          <span className="text-[#C9A84C]/95">Beta</span>
          <span className="mx-2 text-white/25" aria-hidden>
            ·
          </span>
          Some features are still rolling out; we ship improvements continuously.
        </p>
      </div>
    </div>
  );
}
