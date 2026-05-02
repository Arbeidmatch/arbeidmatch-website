import { NextResponse } from "next/server";

import { LEGAL_SEED_ROWS } from "@/lib/legal-seed-documents-data";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const secret = process.env.SEED_LEGAL_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const header = request.headers.get("x-seed-secret");
  if (!header || header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const rows = LEGAL_SEED_ROWS.map((r) => ({
    id: r.id,
    title: r.title,
    content_md: r.content_md,
    version: 1,
    last_updated: now,
    effective_from: now,
    updated_at: now,
  }));

  const { error } = await client.from("legal_documents").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("[seed-legal-documents]", error.message);
    return NextResponse.json({ error: "upsert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
