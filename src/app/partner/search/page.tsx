import { Suspense } from "react";

import PartnerSearchClient from "./PartnerSearchClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <PartnerSearchClient />
    </Suspense>
  );
}

