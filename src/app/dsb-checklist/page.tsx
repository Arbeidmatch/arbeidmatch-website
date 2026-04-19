import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/dsb-support",
  "DSB Authorization for Electricians in Norway | ArbeidMatch",
  "Complete guide and checklist for EU/EEA electricians applying for DSB authorization in Norway. Documents required, processing times, and step-by-step guidance.",
);

export default function DsbChecklistPage() {
  redirect("/dsb-support");
}
