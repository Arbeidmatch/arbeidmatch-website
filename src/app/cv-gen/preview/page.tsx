import type { Metadata } from "next";
import { PreviewTab } from "@/app/cv-gen/preview/_components/PreviewTab";

export const metadata: Metadata = {
  title: "CV preview",
  robots: { index: false, follow: false },
};

export default function CvPreviewPage() {
  return <PreviewTab />;
}
