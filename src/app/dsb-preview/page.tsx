import type { Metadata } from "next";
import { isPreviewAuthorized } from "@/lib/previewAuth";
import DsbPreviewClient from "./DsbPreviewClient";
import PreviewUnlockForm from "./PreviewUnlockForm";

export const metadata: Metadata = {
  title: "DSB Preview",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function DsbPreviewPage() {
  const authorized = await isPreviewAuthorized();
  if (!authorized) {
    return <PreviewUnlockForm />;
  }
  return <DsbPreviewClient />;
}
