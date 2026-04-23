import { Suspense } from "react";
import PartnerSearchClient from "./PartnerSearchClient";

type PageProps = {
  params: Promise<{ session_token: string }>;
};

export default async function Page({ params }: PageProps) {
  const { session_token } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A]" />}>
      <PartnerSearchClient session_token={session_token} />
    </Suspense>
  );
}
