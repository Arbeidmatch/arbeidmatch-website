import { Suspense } from "react";
import PartnerAlertsClient from "./PartnerAlertsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <PartnerAlertsClient />
    </Suspense>
  );
}
