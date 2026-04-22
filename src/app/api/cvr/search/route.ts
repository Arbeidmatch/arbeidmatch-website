import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

type CvrApiResponse = Record<string, unknown> | Record<string, unknown>[];

function rowToCompany(row: Record<string, unknown>): { name: string; orgNumber: string } | null {
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const vat = row.vat;
  const cvrnr = row.cvrnr;
  const org =
    typeof vat === "number"
      ? String(vat)
      : typeof vat === "string"
        ? vat.trim()
        : typeof cvrnr === "string"
          ? cvrnr.replace(/\D/g, "")
          : "";
  if (!name || !org) return null;
  return { name, orgNumber: org };
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json({ success: true, companies: [] });
    }

    const url = `https://cvrapi.dk/api?search=${encodeURIComponent(q)}&country=dk`;
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "ArbeidMatch/1.0 (employer-request)" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ success: true, companies: [] });
    }

    const data = (await response.json()) as CvrApiResponse;
    const companies: { name: string; orgNumber: string }[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item === "object") {
          const c = rowToCompany(item as Record<string, unknown>);
          if (c) companies.push(c);
        }
      }
    } else if (data && typeof data === "object") {
      const c = rowToCompany(data as Record<string, unknown>);
      if (c) companies.push(c);
    }

    return NextResponse.json({ success: true, companies: companies.slice(0, 8) });
  } catch (error) {
    await notifyError({ route: "/api/cvr/search", error });
    return NextResponse.json({ success: false, companies: [] }, { status: 500 });
  }
}
