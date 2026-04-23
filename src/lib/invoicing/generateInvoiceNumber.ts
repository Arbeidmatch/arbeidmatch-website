import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function generateInvoiceNumber(): Promise<string> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { data, error } = await supabase.rpc("generate_invoice_number");
  if (error || typeof data !== "string" || !data.trim()) {
    throw new Error(`Failed to generate invoice number: ${error?.message || "Unknown error"}`);
  }

  return data.trim();
}
