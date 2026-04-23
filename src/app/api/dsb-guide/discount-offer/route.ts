import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "DSB discount and checkout flows are disabled.",
    },
    { status: 410 },
  );
}
