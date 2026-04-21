"use client";

export default function BetaBanner() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[9999] border-b border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] px-4 py-[10px]"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex items-center justify-center gap-2 text-center text-[13px] text-[rgba(255,255,255,0.85)]">
        <span className="beta-dot h-[6px] w-[6px] rounded-full bg-[#C9A84C]" aria-hidden />
        <span>
          ArbeidMatch is currently in beta. Some features may not be fully available yet. We are improving in real time.
        </span>
      </div>
      <style jsx>{`
        .beta-dot {
          animation: betaPulse 1.8s ease-in-out infinite;
        }
        @keyframes betaPulse {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
