import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "DSB checkout is disabled. Free DSB information is available on /electricians-norway.",
    },
    { status: 410 },
  );
}
