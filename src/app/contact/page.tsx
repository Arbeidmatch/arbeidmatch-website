import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

const TITLE = "Kontakt oss | ArbeidMatch";
const DESCRIPTION =
  "Har dere spørsmål, eller er dere klare til å finne arbeidskraft til bedriften? Kontakt ArbeidMatch. Vi svarer innen én virkedag.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | Rekruttering fra EU/EØS til Norge",
} as const;

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: "/contact",
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
