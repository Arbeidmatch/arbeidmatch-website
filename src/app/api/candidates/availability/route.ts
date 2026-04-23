import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { verifyAvailabilityToken } from "@/lib/candidates/availabilityToken";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type AvailabilityStatus = "available" | "unavailable";

function parseStatus(raw: string | null): AvailabilityStatus | null {
  if (raw === "available" || raw === "unavailable") return raw;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
    const status = parseStatus(request.nextUrl.searchParams.get("status"));
    if (!token || !status) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const payload = await verifyAvailabilityToken(token);
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }

    const nowIso = new Date().toISOString();

    if (status === "available") {
      const { error } = await supabase
        .from("candidates")
        .update({
          available: true,
          unavailable_until: null,
          status: "active",
          last_availability_check: nowIso,
          availability_checked_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", payload.candidateId)
        .eq("email", payload.email);
      if (error) throw error;

      await logAuditEvent("candidate_availability_marked_available", "candidate", payload.candidateId, "candidate", {
        email: payload.email,
      });

      return NextResponse.redirect(new URL("/candidates?availability=updated", request.url));
    }

    return NextResponse.redirect(new URL(`/candidates/availability?token=${encodeURIComponent(token)}`, request.url));
  } catch (error) {
    await notifyError({ route: "/api/candidates/availability GET", error });
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; months?: number };
    const token = body.token?.trim() ?? "";
    const months = Number(body.months);
    if (!token || ![1, 2, 3].includes(months)) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const payload = await verifyAvailabilityToken(token);
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }

    const now = new Date();
    const unavailableUntil = new Date(now);
    unavailableUntil.setMonth(unavailableUntil.getMonth() + months);
    const nowIso = now.toISOString();

    const { error } = await supabase
      .from("candidates")
      .update({
        available: false,
        status: "inactive",
        unavailable_until: unavailableUntil.toISOString(),
        last_availability_check: nowIso,
        availability_checked_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", payload.candidateId)
      .eq("email", payload.email);
    if (error) throw error;

    await logAuditEvent("candidate_availability_marked_unavailable", "candidate", payload.candidateId, "candidate", {
      email: payload.email,
      months,
      unavailable_until: unavailableUntil.toISOString(),
    });

    return NextResponse.json({ success: true, unavailableUntil: unavailableUntil.toISOString() });
  } catch (error) {
    await notifyError({ route: "/api/candidates/availability POST", error });
    return NextResponse.json({ error: "Failed to update availability." }, { status: 500 });
  }
}
