import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { buildAvailabilityCheckEmailHtml } from "@/lib/candidates/availabilityEmail";
import { signAvailabilityToken } from "@/lib/candidates/availabilityToken";
import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { notifyCronFailed } from "@/lib/slack/notify";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type CandidateAvailabilityRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  profile_score: number | null;
  available: boolean | null;
  gdpr_consent: boolean | null;
};

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 6 * 60 * 1000;

function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function chunk<T>(input: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < input.length; i += size) out.push(input.slice(i, i + size));
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseServiceClient();
    const transporter = createSmtpTransporter();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    if (!transporter) return NextResponse.json({ error: "SMTP not configured." }, { status: 500 });

    const { data, error } = await supabase
      .from("candidates")
      .select("id,email,first_name,profile_score,available,gdpr_consent")
      .neq("available", false)
      .gt("profile_score", 0)
      .eq("gdpr_consent", true)
      .is("deleted_at", null);
    if (error) throw error;

    const candidates = ((data ?? []) as CandidateAvailabilityRow[]).filter((row) => (row.email ?? "").includes("@"));
    const shuffled = shuffleArray(candidates);
    const batches = chunk(shuffled, BATCH_SIZE);
    const baseUrl = getSiteOrigin();
    let sent = 0;
    let failed = 0;

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      for (const candidate of batch) {
        const email = candidate.email!.trim().toLowerCase();
        try {
          const token = await signAvailabilityToken({ candidateId: candidate.id, email });
          const availableUrl = `${baseUrl}/api/candidates/availability?token=${encodeURIComponent(token)}&status=available`;
          const unavailableUrl = `${baseUrl}/api/candidates/availability?token=${encodeURIComponent(token)}&status=unavailable`;
          const html = buildAvailabilityCheckEmailHtml({
            firstName: candidate.first_name?.trim() || "there",
            availableUrl,
            unavailableUrl,
          });

          await safeSendEmail(email, "Are you still available for work?", html, {
            ...mailHeaders(),
            text:
              `Quick check-in from ArbeidMatch.\n\n` +
              `Are you still looking for work in Norway?\n` +
              `Yes: ${availableUrl}\n` +
              `Not right now: ${unavailableUrl}`,
            transporter,
          });

          sent += 1;
          await logAuditEvent("candidate_availability_check_sent", "candidate", candidate.id, "system", { email });
        } catch {
          failed += 1;
        }
      }

      const hasNextBatch = index < batches.length - 1;
      if (hasNextBatch) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    await logAuditEvent("candidate_availability_cron_run", "candidate", null, "system", {
      selected_candidates: candidates.length,
      sent,
      failed,
      batches: batches.length,
      batch_size: BATCH_SIZE,
      batch_delay_ms: BATCH_DELAY_MS,
    });

    return NextResponse.json({ success: true, selected: candidates.length, sent, failed, batches: batches.length });
  } catch (error) {
    await notifyError({ route: "/api/cron/availability-check", error });
    await notifyCronFailed(
      "availability-check",
      error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error),
    );
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
