import type { Metadata } from "next";
import AdminLiveClient from "./AdminLiveClient";

export const metadata: Metadata = {
  title: "Live control",
  robots: { index: false, follow: false },
};

export default function AdminLivePage() {
  return <AdminLiveClient />;
}
