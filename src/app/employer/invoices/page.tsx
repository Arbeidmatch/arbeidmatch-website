import EmployerInvoicesClient from "./EmployerInvoicesClient";
import { requireFeatureFlag } from "@/lib/featureFlag";

export default function EmployerInvoicesPage() {
  requireFeatureFlag();
  return <EmployerInvoicesClient />;
}
