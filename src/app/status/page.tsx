import type { Metadata } from "next";
import { PlatformStatus } from "./platform-status";
export const metadata: Metadata = {
  title: "RecOS platform status",
  description: "Current service updates and incidents for RecOS.",
  robots: { index: false, follow: false },
};
export default function StatusPage() {
  return <PlatformStatus />;
}
