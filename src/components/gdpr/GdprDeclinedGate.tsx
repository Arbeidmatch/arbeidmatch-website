"use client";

type Props = {
  variant: "apply" | "profile";
  onOpenAcceptance: () => void;
};

export default function GdprDeclinedGate({ variant, onOpenAcceptance }: Props) {
  const title = variant === "apply" ? "Applications need your consent" : "Profile setup needs your consent";
  const body =
    variant === "apply"
      ? "You are browsing in read-only mode. To send an application, accept the terms and data processing in the privacy dialog."
      : "You are browsing in read-only mode. To create or edit your candidate profile, accept the terms and data processing first.";

  return (
    <div className="container-site py-10 md:py-14">
      <div className="mx-auto max-w-lg rounded-[18px] border border-[#C9A84C]/25 bg-[#0A0F18] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">Privacy</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/72">{body}</p>
        <button
          type="button"
          onClick={onOpenAcceptance}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-[#C9A84C] px-6 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#b8953f] sm:w-auto"
        >
          Review terms and accept
        </button>
      </div>
    </div>
  );
}
