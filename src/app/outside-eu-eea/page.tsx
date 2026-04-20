import type { Metadata } from "next";
import OutsideEuEeaClient from "./OutsideEuEeaClient";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/outside-eu-eea",
  "Working in Norway as a Non-EU Citizen | ArbeidMatch",
  "Permits, documents, and first steps for skilled workers outside the EU/EEA. Free guide and practical overview from ArbeidMatch.",
);

export default function OutsideEuEeaPage() {
  return <OutsideEuEeaClient />;
}
