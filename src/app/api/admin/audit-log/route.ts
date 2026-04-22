import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function csvEscape(s: string): string {
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET?.trim();
  const secret = request.nextUrl.searchParams.get("secret")?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const format = request.nextUrl.searchParams.get("format")?.toLowerCase();
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(200, Math.max(10, Number(request.nextUrl.searchParams.get("pageSize") || "50") || 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const eventType = request.nextUrl.searchParams.get("eventType")?.trim();
  const entityType = request.nextUrl.searchParams.get("entityType")?.trim();
  const dateFrom = request.nextUrl.searchParams.get("dateFrom")?.trim();
  const dateTo = request.nextUrl.searchParams.get("dateTo")?.trim();

  let q = supabase
    .from("master_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (eventType) q = q.eq("event_type", eventType);
  if (entityType) q = q.eq("entity_type", entityType);
  if (dateFrom) q = q.gte("created_at", dateFrom);
  if (dateTo) q = q.lte("created_at", dateTo);

  const res = await q;

  if (res.error) {
    return NextResponse.json({ error: res.error.message, rows: [], total: 0 }, { status: 200 });
  }

  const rows = res.data ?? [];
  const total = res.count ?? rows.length;

  if (format === "csv") {
    const header = ["id", "event_type", "entity_type", "entity_id", "actor", "metadata", "created_at"].join(",");
    const lines = (rows as Record<string, unknown>[]).map((r) =>
      [
        csvEscape(String(r.id ?? "")),
        csvEscape(String(r.event_type ?? "")),
        csvEscape(String(r.entity_type ?? "")),
        csvEscape(String(r.entity_id ?? "")),
        csvEscape(String(r.actor ?? "")),
        csvEscape(JSON.stringify(r.metadata ?? {})),
        csvEscape(String(r.created_at ?? "")),
      ].join(","),
    );
    const body = [header, ...lines].join("\n");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ rows, total, page, pageSize });
}
