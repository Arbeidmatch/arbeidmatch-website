import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with ArbeidMatch. We help Norwegian employers find qualified EU/EEA candidates fast.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
