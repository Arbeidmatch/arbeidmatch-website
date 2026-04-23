import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const statusSchema = z.object({
  status: z.enum(["draft", "pending", "paid", "overdue", "cancelled"]),
});

async function getIdFromContext(context: { params: Promise<unknown> }): Promise<string> {
  const params = (await context.params) as { id?: string } | null;
  return typeof params?.id === "string" ? params.id : "";
}

export async function GET(_request: NextRequest, context: { params: Promise<unknown> }) {
  try {
    const id = await getIdFromContext(context);
    if (!id) return NextResponse.json({ error: "Invoice id is required." }, { status: 400 });
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const { data: invoice, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    const { data: items, error: itemsError } = await supabase.from("invoice_items").select("*").eq("invoice_id", id);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

    return NextResponse.json({ ...invoice, invoice_items: items ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected invoice fetch error." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<unknown> }) {
  try {
    const id = await getIdFromContext(context);
    if (!id) return NextResponse.json({ error: "Invoice id is required." }, { status: 400 });
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const patch: Record<string, string | null> = { status: parsed.data.status };
    if (parsed.data.status === "paid") {
      patch.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected invoice update error." },
      { status: 500 },
    );
  }
}
