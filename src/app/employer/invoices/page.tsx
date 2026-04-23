"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";
type InvoiceRow = {
  id: string;
  invoice_number: string;
  due_date: string;
  created_at: string;
  amount_inc_vat: number;
  status: InvoiceStatus;
  pdf_url?: string | null;
};

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "border-white/25 text-white/80",
  pending: "border-yellow-400/50 text-yellow-300",
  paid: "border-emerald-400/50 text-emerald-300",
  overdue: "border-red-400/50 text-red-300",
  cancelled: "border-slate-400/40 text-slate-300",
};

function formatDate(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeZone: "Europe/Oslo" }).format(date);
}

function formatNok(cents: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export default function EmployerInvoicesPage() {
  const [email, setEmail] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedEmail = window.localStorage.getItem("employerEmail") || "";
    if (storedEmail.includes("@")) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!email || !email.includes("@")) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/invoices?email=${encodeURIComponent(email)}`);
        const json = (await res.json().catch(() => ({}))) as { invoices?: InvoiceRow[]; error?: string };
        if (!res.ok) {
          setError(json.error || "Could not load invoices.");
          return;
        }
        setInvoices(Array.isArray(json.invoices) ? json.invoices : []);
      } catch {
        setError("Could not load invoices.");
      } finally {
        setLoading(false);
      }
    };
    void fetchInvoices();
  }, [email]);

  const visibleInvoices = useMemo(
    () => invoices.filter((inv) => (statusFilter === "all" ? true : inv.status === statusFilter)),
    [invoices, statusFilter],
  );

  const ytdPaidTotal = useMemo(() => {
    const year = new Date().getFullYear();
    return invoices
      .filter((inv) => inv.status === "paid" && new Date(inv.created_at).getFullYear() === year)
      .reduce((sum, inv) => sum + (inv.amount_inc_vat || 0), 0);
  }, [invoices]);

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-4 py-10 text-white md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-2xl border border-[#C9A84C]/30 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.12em] text-[#C9A84C]">Employer billing</p>
          <h1 className="mt-2 text-3xl font-semibold">Invoices</h1>
          <p className="mt-2 text-sm text-white/70">Track all issued invoices and payment status.</p>

          <div className="mt-6 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-[#C9A84C]">Total paid YTD</p>
            <p className="mt-1 text-2xl font-bold text-[#C9A84C]">{formatNok(ytdPaidTotal)}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {(["all", "pending", "paid", "overdue"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  statusFilter === value ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]" : "border-white/20 text-white/80"
                }`}
              >
                {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03]">
          {loading ? (
            <div className="p-6 text-sm text-white/80">Loading invoices...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-300">{error}</div>
          ) : visibleInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto max-w-xl rounded-2xl border border-[#C9A84C]/25 bg-[#0f1923] p-8">
                <p className="text-xl font-semibold text-white">No invoices yet</p>
                <p className="mt-2 text-sm text-white/70">Your billed requests will appear here once generated.</p>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[#0f1923] text-xs uppercase tracking-[0.08em] text-white/65">
                <tr>
                  <th className="px-4 py-3">Fakturanummer</th>
                  <th className="px-4 py-3">Dato</th>
                  <th className="px-4 py-3">Forfallsdato</th>
                  <th className="px-4 py-3">Beløp inkl MVA</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">PDF</th>
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium text-white">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-white/80">{formatDate(invoice.created_at)}</td>
                    <td className="px-4 py-3 text-white/80">{formatDate(invoice.due_date)}</td>
                    <td className="px-4 py-3 text-white/90">{formatNok(invoice.amount_inc_vat)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${STATUS_STYLES[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.pdf_url ? (
                        <Link
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#C9A84C] hover:underline"
                        >
                          Download PDF
                        </Link>
                      ) : (
                        <span className="text-sm text-white/45">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
