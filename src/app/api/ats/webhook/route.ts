/**
 * Receives events FROM ATS → website (e.g. partner_approved, job_filled).
 * Status: READY FOR INTEGRATION - extend handlers when ATS sends real payloads.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body) as { type?: string; data?: unknown };

    switch (event.type) {
      case "partner.approved":
        // TODO: send approval email to employer
        void event.data;
        break;
      case "partner.rejected":
        // TODO: send rejection email to employer
        void event.data;
        break;
      case "candidate.status_updated":
        // TODO: sync status if needed
        void event.data;
        break;
      default:
        void event.type;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
