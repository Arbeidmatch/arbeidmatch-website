import type { Metadata } from "next";
import { Suspense } from "react";
import BecomePartnerClient from "./BecomePartnerClient";

export const metadata: Metadata = {
  title: "Become a Recruitment Partner | ArbeidMatch",
  description:
    "Apply as a recruitment partner and access pre-screened EU/EEA candidates for your clients in Norway.",
};

export default function BecomePartnerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <BecomePartnerClient />
    </Suspense>
  );
}
