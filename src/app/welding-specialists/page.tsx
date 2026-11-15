import type { Metadata } from "next";
import WeldingSpecialistsPage from "@/components/welding/WeldingSpecialistsPage";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const URL = "https://www.arbeidmatch.no/welding-specialists";
const base = nbPageMetadata(
  "/welding-specialists",
  "ISO-Certified Welders and Welding Specialists for Norway | ArbeidMatch",
  "Find pre-screened ISO 9606 and EN-certified welders for Norwegian industrial, offshore, and construction projects. EU/EEA sourcing with basic certificate validity checks as part of screening.",
);

export const metadata: Metadata = { ...base, alternates: { canonical: URL, languages: { en: URL, "x-default": URL } } };

export default function WeldingSpecialistsRoutePage() {
  return <WeldingSpecialistsPage />;
}
