import type { Metadata } from "next";
import RecruiterNetworkClient from "@/components/recruiter-network/RecruiterNetworkClient";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/recruiter-network",
  "Rekrutteringsnettverk | ArbeidMatch Partner Program",
  "Bli partner med ArbeidMatch og tjen provisjon på vellykkede plasseringer i Norge. Åpent for rekrutterere og agenter i hele EU/EEA.",
);

export default function RecruiterNetworkPage() {
  return <RecruiterNetworkClient />;
}
