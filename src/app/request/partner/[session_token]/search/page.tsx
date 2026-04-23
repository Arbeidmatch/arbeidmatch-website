import PartnerSearchClient from "./PartnerSearchClient";
import { requireFeatureFlag } from "@/lib/featureFlag";

export default function PartnerSearchPage() {
  requireFeatureFlag();
  return <PartnerSearchClient />;
}
