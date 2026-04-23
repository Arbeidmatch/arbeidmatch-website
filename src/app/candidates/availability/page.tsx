import { Suspense } from "react";
import AvailabilityClient from "./AvailabilityClient";
import { requireFeatureFlag } from "@/lib/featureFlag";

export default function CandidateAvailabilityPage() {
  requireFeatureFlag();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <AvailabilityClient />
    </Suspense>
  );
}
