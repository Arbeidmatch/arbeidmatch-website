import type { Metadata } from "next";
import BecomePartnerWaitlistClient from "./BecomePartnerWaitlistClient";

export const metadata: Metadata = {
  title: "Become a Recruitment Partner | ArbeidMatch",
  description:
    "Apply as a recruitment partner and access pre-screened EU/EEA candidates for your clients in Norway.",
};

export default function BecomePartnerPage() {
  return <BecomePartnerWaitlistClient />;
}
