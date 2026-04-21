"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionCheck = {
  valid: boolean;
  reason?: "expired" | "invalid";
  request_token?: string;
};

export default function PartnerSessionPage() {
  const { session_token } = useParams<{ session_token: string }>();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "expired" | "invalid">("loading");

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/verify-partner-session?token=${encodeURIComponent(session_token)}`);
        const data = (await response.json()) as SessionCheck;
        if (response.ok && data.valid && data.request_token) {
          router.replace(`/request/${data.request_token}?start=wizard`);
          return;
        }
        if (data.reason === "expired") {
          setState("expired");
          return;
        }
        setState("invalid");
      } catch {
        setState("invalid");
      }
    };
    void run();
  }, [router, session_token]);

  if (state === "loading") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-center text-white">
        <p className="text-white/70">Verifying secure link...</p>
      </section>
    );
  }

  if (state === "expired") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
          <h1 className="text-2xl font-bold text-white">This link has expired. Please request a new one.</h1>
          <Link
            href="/request"
            className="mx-auto mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
          >
            Back to request
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-white">
      <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Invalid link.</h1>
        <Link
          href="/request"
          className="mx-auto mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
        >
          Back to request
        </Link>
      </div>
    </section>
  );
}
