"use client";

export default function BetaBanner() {
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 sm:bottom-4 sm:right-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0D1B2A]/80 px-2.5 py-1 text-[11px] text-white/50 backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-xs">
        <span className="h-2 w-2 rounded-full bg-[#C9A84C] motion-reduce:animate-none animate-pulse" aria-hidden />
        <span>We're building something great</span>
      </div>
    </div>
  );
}
