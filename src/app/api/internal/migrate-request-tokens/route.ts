import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Temporary one-time migration endpoint
// Remove after running: src/app/api/internal/migrate-request-tokens/route.ts
const SECRET = "mig-883379-request-tokens-2026";

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS public.request_tokens (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token                  uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  full_name              text        NOT NULL,
  company                text        NOT NULL,
  email                  text        NOT NULL,
  phone                  text        NOT NULL DEFAULT '',
  org_number             text        NULL,
  job_summary            text        NOT NULL DEFAULT 'General hiring inquiry',
  gdpr_consent           boolean     NOT NULL DEFAULT false,
  how_did_you_hear       text        NULL,
  social_media_platform  text        NULL,
  how_did_you_hear_other text        NULL,
  referral_company_name  text        NULL,
  referral_org_number    text        NULL,
  referral_email         text        NULL,
  expires_at             timestamptz NOT NULL,
  used                   boolean     NOT NULL DEFAULT false,
  industry               text        NULL,
  role                   text        NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_tokens_token_idx      ON public.request_tokens (token);
CREATE INDEX IF NOT EXISTS request_tokens_email_idx      ON public.request_tokens (lower(email));
CREATE INDEX IF NOT EXISTS request_tokens_expires_at_idx ON public.request_tokens (expires_at);
ALTER TABLE public.request_tokens ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.request_tokens IS 'Secure tokens for arbeidmatch.no/request employer wizard.';
`;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-migration-secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Check if table already exists
  const { error: checkErr } = await supabase.from("request_tokens").select("id").limit(0);
  if (!checkErr) {
    return NextResponse.json({ status: "already_exists", message: "Table request_tokens already exists" });
  }

  // Try Supabase Management API /pg/query endpoint
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

  const diagnostics: Record<string, unknown> = {
    supabaseUrl,
    projectRef,
    checkError: checkErr?.message,
  };

  // Attempt 1: Supabase Management API
  try {
    const mgmtResp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: CREATE_SQL }),
    });
    const mgmtBody = await mgmtResp.json().catch(() => ({ raw: await mgmtResp.text() }));
    diagnostics.mgmtStatus = mgmtResp.status;
    diagnostics.mgmtBody = mgmtBody;

    if (mgmtResp.ok) {
      const { error: verifyErr } = await supabase.from("request_tokens").select("id").limit(0);
      return NextResponse.json({ success: true, method: "management_api", tableExists: !verifyErr, diagnostics });
    }
  } catch (e) {
    diagnostics.mgmtError = String(e);
  }

  // Attempt 2: Try pg connection with POSTGRES_URL env var (set by Supabase Vercel integration)
  const pgUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";
  diagnostics.hasPgUrl = !!pgUrl;

  if (pgUrl) {
    try {
      // Dynamic import to avoid bundling issues
      const { Client } = await import("pg" as any);
      const client = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
      await client.connect();
      await client.query(CREATE_SQL);
      await client.end();

      const { error: verifyErr } = await supabase.from("request_tokens").select("id").limit(0);
      return NextResponse.json({ success: true, method: "pg_direct", tableExists: !verifyErr, diagnostics });
    } catch (e) {
      diagnostics.pgError = String(e);
    }
  }

  // All attempts failed - return SQL for manual execution
  return NextResponse.json(
    {
      success: false,
      message: "All automated migration attempts failed. Apply SQL manually in Supabase Dashboard > SQL Editor.",
      sql: CREATE_SQL,
      diagnostics,
    },
    { status: 500 },
  );
}
