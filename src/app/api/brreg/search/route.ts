import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";

type BrregResponse = {
  _embedded?: {
    enheter?: Array<{
      navn?: string;
      organisasjonsnummer?: string;
    }>;
  };
};

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json({ success: true, companies: [] });
    }

    const url = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(q)}&size=8`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ success: true, companies: [] });
    }

    const data = (await response.json()) as BrregResponse;
    const companies =
      data._embedded?.enheter?.map((item) => ({
        name: item.navn || "",
        orgNumber: item.organisasjonsnummer || "",
      })) ?? [];

    return NextResponse.json({ success: true, companies });
  } catch (error) {
    await notifyError({ route: "/api/brreg/search", error });
    return NextResponse.json({ success: false, companies: [] }, { status: 500 });
  }
}
