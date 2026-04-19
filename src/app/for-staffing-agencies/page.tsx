import type { Metadata } from "next";
import StaffingAgenciesPage from "@/components/staffing-agencies/StaffingAgenciesPage";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/for-staffing-agencies",
  "For bemanningsbyråer | ArbeidMatch: din kilde til EU/EEA-kandidater",
  "ArbeidMatch er ikke en konkurrent, vi er din sourcing-partner. Få tilgang til pre-screene EU/EEA-kandidater for dine kunder. Vi konkurrerer ikke med deg. Vi hjelper deg å vokse.",
);

export default function ForStaffingAgenciesRoute() {
  return <StaffingAgenciesPage />;
}
