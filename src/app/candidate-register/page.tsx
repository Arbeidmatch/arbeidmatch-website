"use client";

import { useEffect } from "react";

import { useSheets } from "@/components/site/sheet/SheetHost";
import { gateSourceFrom } from "@/lib/candidateGate";
import { CANDIDATE_PORTAL_LOGIN_URL } from "@/lib/candidatePortal";

/**
 * THE ONE ENTRY GATE FOR NEW CANDIDATES (ORDER 396, 20 November 2026). His
 * words: "sa fie o singura poarta de intrare si aia sa fie prin site nu prin
 * ats". Every door that makes a profile leads here: a job's Register, a
 * recruiter's /register/<handle>, a referral, the Messenger bot, and RecOS's
 * own "Create my profile". The page opens the "Create your profile" sheet at
 * once, carrying the source the address names; behind it, one line and a
 * button to open it again.
 */
export default function CandidateRegisterPage() {
  const { open } = useSheets();
  const openGate = () => open("register", { source: gateSourceFrom(new URLSearchParams(window.location.search)) });

  useEffect(() => {
    open("register", { source: gateSourceFrom(new URLSearchParams(window.location.search)) });
  }, [open]);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-surface px-5 py-14 md:px-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-7">
        <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Create your candidate profile</h1>
        <p className="mt-3 leading-relaxed text-text-secondary">
          Free for you. Answer three questions and we e-mail you a link that opens your profile. Only people aged 18 or older can register.
        </p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <button
            type="button"
            onClick={openGate}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-navy px-7 py-3 text-base font-semibold text-white transition hover:bg-navy/90"
          >
            Create my profile
          </button>
          <a href={CANDIDATE_PORTAL_LOGIN_URL} className="inline-flex min-h-[44px] items-center justify-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
            I already have a profile: sign in
          </a>
        </div>
      </div>
    </main>
  );
}
