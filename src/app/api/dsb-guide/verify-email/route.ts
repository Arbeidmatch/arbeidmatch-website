import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "DSB paid verification flow is disabled.",
    },
    { status: 410 },
  );
}
