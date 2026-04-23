import EmployerCreditsClient from "./EmployerCreditsClient";
import { requireFeatureFlag } from "@/lib/featureFlag";

export default function EmployerCreditsPage() {
  requireFeatureFlag();
  return <EmployerCreditsClient />;
}
