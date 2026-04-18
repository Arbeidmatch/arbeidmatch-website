import type { Metadata } from "next";
import RecruiterNetworkClient from "@/components/recruiter-network/RecruiterNetworkClient";

export const metadata: Metadata = {
  title: "ArbeidMatch Recruiter Network — Build Your Recruitment Business",
  description:
    "Join the ArbeidMatch Recruiter Network. Whether you are an influencer, an experienced recruiter or just starting out — we give you everything to succeed.",
  openGraph: {
    title: "ArbeidMatch Recruiter Network — Build Your Recruitment Business",
    description:
      "Join the ArbeidMatch Recruiter Network. Whether you are an influencer, an experienced recruiter or just starting out — we give you everything to succeed.",
    url: "https://arbeidmatch.no/recruiter-network",
  },
};

export default function RecruiterNetworkPage() {
  return <RecruiterNetworkClient />;
}
