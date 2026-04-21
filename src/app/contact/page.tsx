import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact ArbeidMatch | Staffing in Norway",
  description:
    "Contact ArbeidMatch for EU/EEA staffing and recruitment support in Norway. We respond quickly and help you plan your hiring needs.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
