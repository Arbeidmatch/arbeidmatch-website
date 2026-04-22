import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { fetchAdminDashboardData } from "@/lib/admin/dashboardData";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ secret?: string }> };

export default async function AdminDashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected || sp.secret !== expected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#0D1B2A] px-6 text-center">
        <p className="text-sm font-medium text-white/80">Unauthorized</p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-white/55">
          Open this page with the correct <span className="text-[#C9A84C]">?secret=</span> query matching{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-white/70">ADMIN_SECRET</code>.
        </p>
      </div>
    );
  }

  const data = await fetchAdminDashboardData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F18] p-8 text-white/60">Loading…</div>}>
      <AdminDashboardClient data={data} />
    </Suspense>
  );
}
