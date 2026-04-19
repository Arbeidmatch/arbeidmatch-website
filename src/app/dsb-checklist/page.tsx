import type { Metadata } from "next";
import DsbChecklistClient from "./DsbChecklistClient";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/dsb-checklist",
  "DSB-sjekkliste for utenlandske elektrikere | ArbeidMatch",
  "Last ned gratis DSB-sjekkliste for EU/EEA-elektrikere som søker godkjenning i Norge. Alle dokumenter du trenger — samlet på ett sted.",
);

export default function DsbChecklistPage() {
  return <DsbChecklistClient />;
}
