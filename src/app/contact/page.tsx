import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/contact",
  "Kontakt ArbeidMatch | Bemanningsbyrå Norge",
  "Ta kontakt med ArbeidMatch for bemanning og rekruttering av EU/EEA-arbeidere. Vi svarer innen 24 timer. post@arbeidmatch.no | Ranheim, Trondheim.",
);

export default function ContactPage() {
  return <ContactPageClient />;
}
