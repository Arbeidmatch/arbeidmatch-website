import { NextRequest, NextResponse } from "next/server";

import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const ALLOWED_SERVICE_TYPES = new Set([
  "accounting_tax",
  "authorized_translators",
  "norwegian_language_courses",
  "accommodation_norway",
  "construction_companies",
  "legal_services",
]);

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;
    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "partner-interest", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const service_type = typeof body.service_type === "string" ? body.service_type.trim() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!ALLOWED_SERVICE_TYPES.has(service_type)) {
      return NextResponse.json({ error: "Invalid service type." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const { error } = await supabase.from("partner_interest").insert({ email, service_type });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      return NextResponse.json({ error: "Could not save your request." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
