import type { Metadata } from "next";
import BecomePartnerClient from "./BecomePartnerClient";

export const metadata: Metadata = {
  title: "Become a partner | ArbeidMatch",
  description: "Partner onboarding: company details, terms, and electronic signature of the partnership agreement.",
};

export default async function BecomePartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const email = params.email ?? "";
  return <BecomePartnerClient token={token} initialEmail={email} />;
}
