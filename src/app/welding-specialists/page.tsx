import type { Metadata } from "next";
import WeldingSpecialistsPage from "@/components/welding/WeldingSpecialistsPage";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/welding-specialists",
  "ISO-Certified Welders and Welding Specialists for Norway | ArbeidMatch",
  "Find pre-screened ISO 9606 and EN-certified welders for Norwegian industrial, offshore, and construction projects. EU/EEA sourcing, certificate verification included.",
);

export default function WeldingSpecialistsRoutePage() {
  return <WeldingSpecialistsPage />;
}
