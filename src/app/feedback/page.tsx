import type { Metadata } from "next";

import FeedbackPageClient from "./FeedbackPageClient";

export const metadata: Metadata = {
  title: "Feedback | ArbeidMatch",
  description: "Share your experience with ArbeidMatch. Your feedback helps us improve our recruitment service.",
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  return <FeedbackPageClient />;
}
