import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "DSB Information for EU/EEA Electricians in Norway",
  description: "Free DSB authorization information for EU/EEA electricians who plan to work in Norway.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbSupportEuPage() {
  redirect("/electricians-norway?section=dsb");
}
