import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArbeidMatch App",
  description:
    "The ArbeidMatch app is coming soon for iOS and Android. Join the waitlist to be notified when it launches.",
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
