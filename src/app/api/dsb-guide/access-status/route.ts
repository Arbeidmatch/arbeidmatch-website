import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: null,
      error: "DSB purchase access flow is disabled.",
    },
    { status: 410 },
  );
}
