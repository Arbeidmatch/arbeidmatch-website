import { Suspense } from "react";
import AvailabilityClient from "./AvailabilityClient";

export default function CandidateAvailabilityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <AvailabilityClient />
    </Suspense>
  );
}
