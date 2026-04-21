export const metadata = { robots: "noindex, nofollow" };
import BecomePartnerClient from "./BecomePartnerClient";

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
