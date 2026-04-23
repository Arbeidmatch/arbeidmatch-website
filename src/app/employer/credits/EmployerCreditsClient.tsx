"use client";

import { useEffect, useMemo, useState } from "react";

import CheckoutModal from "@/components/payments/CheckoutModal";

type PackageType = "credits_starter" | "credits_growth" | "credits_pro";

const PACKAGES: Array<{
  id: PackageType;
  title: string;
  credits: number;
  priceNok: number;
  mvaText: string;
}> = [
  { id: "credits_starter", title: "Starter", credits: 10, priceNok: 299, mvaText: "ex MVA: 239 NOK + 60 NOK MVA" },
  { id: "credits_growth", title: "Growth", credits: 30, priceNok: 799, mvaText: "ex MVA: 639 NOK + 160 NOK MVA" },
  { id: "credits_pro", title: "Pro", credits: 75, priceNok: 1499, mvaText: "ex MVA: 1.199 NOK + 300 NOK MVA" },
];

export default function EmployerCreditsClient() {
  const [email, setEmail] = useState("");
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<(typeof PACKAGES)[number] | null>(null);

  const canBuy = useMemo(() => email.trim().includes("@"), [email]);

  const refreshBalance = async () => {
    if (!email.trim().includes("@")) return;
    setLoadingBalance(true);
    try {
      const res = await fetch(`/api/employer/credits/balance?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = (await res.json().catch(() => ({}))) as { credits_balance?: number };
      if (res.ok) setCreditsBalance(Number(data.credits_balance ?? 0));
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    void refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Employer Credits</h1>
        <p className="mt-2 text-sm text-white/70">Purchase credits to unlock candidate contacts and priority workflows.</p>

        <div className="mt-5 max-w-md">
          <label className="mb-1.5 block text-xs text-white/55">Employer email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="company@domain.no"
            className="w-full rounded-xl border border-white/15 bg-[#0A1624] px-3 py-2.5 text-sm text-white"
          />
          <p className="mt-2 text-sm text-white/70">
            Balance: <span className="font-semibold text-[#C9A84C]">{loadingBalance ? "Loading..." : creditsBalance}</span> credits
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-semibold">{pkg.title}</h2>
              <p className="mt-1 text-sm text-white/75">{pkg.credits} credits</p>
              <p className="mt-4 text-3xl font-bold text-[#C9A84C]">{pkg.priceNok} NOK</p>
              <p className="mt-1 text-xs text-white/50">{pkg.mvaText}</p>
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => setSelectedPackage(pkg)}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#C9A84C] font-semibold text-[#0D1B2A] disabled:opacity-50"
              >
                Purchase
              </button>
            </article>
          ))}
        </div>
      </div>

      {selectedPackage ? (
        <CheckoutModal
          open
          onClose={() => setSelectedPackage(null)}
          onSuccess={() => void refreshBalance()}
          amountNok={selectedPackage.priceNok}
          packageType={selectedPackage.id}
          packageTitle={`${selectedPackage.title} (${selectedPackage.credits} credits)`}
          employerEmail={email}
        />
      ) : null}
    </main>
  );
}
