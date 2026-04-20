import { NextRequest, NextResponse } from "next/server";
import { getPurchaseStatusByToken } from "@/lib/dsbGuideAccess";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ status: null }, { status: 400 });
    }

    const { status, guide_slug } = await getPurchaseStatusByToken(token);
    return NextResponse.json({ status, guide_slug });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
