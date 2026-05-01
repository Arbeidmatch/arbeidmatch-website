import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

const TITLE = "Contact Us | ArbeidMatch";
const DESCRIPTION =
  "Have a question or ready to find workers for your business? Contact ArbeidMatch. We respond within 1 business day.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
