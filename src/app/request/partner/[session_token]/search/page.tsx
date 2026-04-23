import { Suspense } from "react";
import PartnerSearchClient from "./PartnerSearchClient";

export default function Page({ params }: { params: { session_token: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <PartnerSearchClient session_token={params.session_token} />
    </Suspense>
  );
}
