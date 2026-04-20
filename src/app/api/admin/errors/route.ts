import { NextRequest } from "next/server";

import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { noStoreJson } from "@/lib/apiSecurity";

type ErrorStatus = "open" | "fixed" | "all";

function parseStatus(value: string | null): ErrorStatus {
  if (value === "open" || value === "fixed" || value === "all") return value;
  return "all";
}

export async function GET(request: NextRequest) {
  try {
    const configuredPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (configuredPassword) {
      const suppliedPassword = request.headers.get("x-admin-password") || "";
      if (suppliedPassword !== configuredPassword) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const status = parseStatus(request.nextUrl.searchParams.get("status"));
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return noStoreJson({ error: "Supabase configuration missing." }, { status: 500 });
    }

    let query = supabase
      .from("error_log")
      .select("id, created_at, route, error_message, error_stack, context, fix_applied, fix_commit, status, resolved_at, environment")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return noStoreJson({ error: "Failed to fetch errors." }, { status: 500 });
    }

    return noStoreJson({ errors: data || [] });
  } catch (error) {
    return noStoreJson({ error: "Unexpected admin errors API failure." }, { status: 500 });
  }
}
