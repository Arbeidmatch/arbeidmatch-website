import { NextResponse } from "next/server";
import { getCandidateActivityStats } from "@/lib/candidateActivityStats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getCandidateActivityStats();
  return NextResponse.json(stats);
}
