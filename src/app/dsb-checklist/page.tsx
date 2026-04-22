import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = {
  ...nbPageMetadata(
    "/electricians-norway",
    "DSB Authorization for Electricians in Norway | ArbeidMatch",
    "Complete guide and checklist for EU/EEA electricians applying for DSB authorization in Norway. Documents required, processing times, and step-by-step guidance.",
  ),
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbChecklistPage() {
  redirect("/electricians-norway?section=dsb");
}
