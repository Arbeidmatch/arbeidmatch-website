import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "DSB Information for Non-EU Electricians in Norway",
  description: "Free DSB authorization information for non-EU electricians who plan to work in Norway.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbSupportNonEuPage() {
  redirect("/electricians-norway?section=dsb");
}
