import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type ConnectEvent = {
  data?: {
    envelopeSummary?: {
      status?: string;
      customFields?: {
        textCustomFields?: Array<{ name?: string; value?: string }>;
      };
    };
  };
};

function mapEnvelopeStatus(status: string): string | null {
  if (status === "completed") return "contract_signed";
  if (status === "declined") return "contract_declined";
  if (status === "voided") return "contract_voided";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ConnectEvent;
    const envelope = payload.data?.envelopeSummary;
    const status = envelope?.status?.trim().toLowerCase() || "";
    const mappedStatus = mapEnvelopeStatus(status);
    if (!mappedStatus) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const requestId =
      envelope?.customFields?.textCustomFields?.find((field) => field.name === "request_id")?.value?.trim() || "";
    if (!requestId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { error } = await supabase.from("partner_requests").update({ status: mappedStatus }).eq("id", requestId);
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await notifyError({ route: "/api/docusign/webhook", error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

