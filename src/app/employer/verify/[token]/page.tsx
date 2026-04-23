import Link from "next/link";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type VerifyStatus = "valid" | "invalid";

async function getVerifyStatus(token: string): Promise<VerifyStatus> {
  const isUuid = z.string().uuid().safeParse(token).success;
  if (!isUuid) return "invalid";

  const supabase = getSupabaseAdminClient();
  if (!supabase) return "invalid";

  const { data, error } = await supabase
    .from("request_tokens")
    .select("token,expires_at,used,job_summary,type")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return "invalid";
  if (data.used === true) return "invalid";
  if (new Date(data.expires_at).getTime() <= Date.now()) return "invalid";

  const summaryType = (data.job_summary || "").trim().toLowerCase();
  if (summaryType !== "employer_trial" && summaryType !== "partner_application") return "invalid";

  return "valid";
}

export default async function EmployerVerifyTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const status = await getVerifyStatus(token);

  if (status === "valid") {
    return (
      <main className="min-h-screen bg-[#0D1B2A] px-6 py-14 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C9A84C]/25 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/15">
            <span className="motion-safe:animate-pulse text-3xl font-bold text-[#C9A84C]">✓</span>
          </div>
          <h1 className="mt-5 text-2xl font-bold">Your email has been confirmed ✓</h1>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Great — now let's set up your company profile to activate your account.
          </p>
          <Link
            href={`/employer/trial/${encodeURIComponent(token)}`}
            className="mt-6 inline-flex rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] transition hover:bg-[#b8953f]"
          >
            Set up my company profile
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-6 py-14 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#C9A84C]/18 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-bold">This link has expired or is invalid.</h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Request a new secure link to continue your ArbeidMatch employer onboarding.
        </p>
        <Link
          href="/become-a-partner"
          className="mt-6 inline-flex rounded-xl border border-[#C9A84C]/35 px-6 py-3 font-semibold text-[#C9A84C] transition hover:bg-[#C9A84C]/10"
        >
          Request a new link
        </Link>
      </div>
    </main>
  );
}
