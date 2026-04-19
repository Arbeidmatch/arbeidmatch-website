import { redirect } from "next/navigation";

import { finalizePremiumCheckoutSession } from "@/app/premium/success/actions";
import PremiumSuccessClient from "@/app/premium/success/PremiumSuccessClient";

type Search = Promise<{ session_id?: string }>;

export default async function PremiumSuccessPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  if (sp.session_id) {
    const result = await finalizePremiumCheckoutSession(sp.session_id);
    if (!result.ok) {
      redirect("/premium?checkout=failed");
    }
  }
  return <PremiumSuccessClient />;
}
