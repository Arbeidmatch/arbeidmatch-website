import PricingClient from "./PricingClient";
import { requireFeatureFlag } from "@/lib/featureFlag";

export default function PricingPage() {
  requireFeatureFlag();
  return <PricingClient />;
}
