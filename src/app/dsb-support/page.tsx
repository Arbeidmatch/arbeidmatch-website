import { Suspense } from "react";
import type { Metadata } from "next";
import DsbSupportClient from "./DsbSupportClient";

export const metadata: Metadata = {
  title: "DSB Authorization Guides",
  description:
    "DSB authorization guides for electricians in Norway — EU/EEA and non-EU paths, secure checkout and online access.",
};

export default function DsbSupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <DsbSupportClient />
    </Suspense>
  );
}
