import type { Metadata } from "next";
import RecruiterNetworkClient from "@/components/recruiter-network/RecruiterNetworkClient";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/recruiter-network",
  "Recruiter Network | ArbeidMatch",
  "Invite-only network of independent recruiters sourcing EU and EEA candidates for Norway. Request an invitation.",
);

export default function RecruiterNetworkPage() {
  return <RecruiterNetworkClient />;
}
