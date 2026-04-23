import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function DsbSupportVerifyPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  redirect("/electricians-norway?section=dsb");
}
