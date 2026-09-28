import { NextRequest, NextResponse } from "next/server";

import { searchBrregCompanies } from "@/lib/brreg";
import { notifyError } from "@/lib/errorNotifier";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json({ success: true, companies: [] });
    }

    const companies = await searchBrregCompanies(q);
    return NextResponse.json({ success: true, companies: companies ?? [] });
  } catch (error) {
    await notifyError({ route: "/api/brreg/search", error });
    return NextResponse.json({ success: false, companies: [] }, { status: 500 });
  }
}
