import type { Metadata } from "next";
import DsbChecklistClient from "./DsbChecklistClient";

export const metadata: Metadata = {
  title: "Free DSB Checklist",
  description:
    "Download the free EU/EEA DSB document checklist for electricians in Norway — official-ready PDF list by email.",
};

export default function DsbChecklistPage() {
  return <DsbChecklistClient />;
}
