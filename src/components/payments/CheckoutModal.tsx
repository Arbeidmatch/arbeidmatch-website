"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";

import { stripeBrowserPromise } from "@/lib/stripe/browserClient";

type CheckoutPackageType = "credits_starter" | "credits_growth" | "credits_pro" | "premium_annual";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amountNok: number;
  packageType: CheckoutPackageType;
  packageTitle: string;
  employerEmail: string;
};

const appearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#C9A84C",
    colorBackground: "#0D1B2A",
    colorText: "#ffffff",
    colorDanger: "#ef4444",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "12px",
  },
};

export default function CheckoutModal(props: Props) {
  const { open, onClose, onSuccess, amountNok, packageType, packageTitle, employerEmail } = props;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  const canRender = open && stripeBrowserPromise;

  useEffect(() => {
    if (!open) return;
    if (!employerEmail.trim().includes("@")) {
      setInitError("Please provide a valid employer email before payment.");
      return;
    }
    setLoadingIntent(true);
    setInitError(null);
    setClientSecret(null);
    void fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount_nok: amountNok,
        description: `${packageTitle} package`,
        employer_email: employerEmail.trim().toLowerCase(),
        package_type: packageType,
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { client_secret?: string; error?: string };
        if (!res.ok || !data.client_secret) {
          setInitError(data.error || "Could not initialize payment.");
          return;
        }
        setClientSecret(data.client_secret);
      })
      .catch(() => setInitError("Could not initialize payment."))
      .finally(() => setLoadingIntent(false));
  }, [open, employerEmail, amountNok, packageType, packageTitle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-[90%] max-w-md rounded-2xl border border-white/10 bg-[#0D1B2A] p-8">
        <h2 className="text-2xl font-bold text-white">{packageTitle}</h2>
        <p className="mt-2 text-sm text-white/75">
          {amountNok} NOK (incl. MVA). Secure payment for ArbeidMatch employer services.
        </p>

        {loadingIntent ? <p className="mt-6 text-sm text-white/70">Preparing checkout...</p> : null}
        {initError ? <p className="mt-6 text-sm text-red-300">{initError}</p> : null}

        {canRender && clientSecret ? (
          <Elements stripe={stripeBrowserPromise} options={{ clientSecret, appearance }}>
            <CheckoutForm amountNok={amountNok} onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        ) : null}

        <button type="button" onClick={onClose} className="mt-4 w-full text-center text-xs text-white/50 hover:text-white/80">
          Close
        </button>
        <p className="mt-4 text-center text-xs text-white/20">Powered by Stripe</p>
      </div>
    </div>
  );
}

function CheckoutForm({
  amountNok,
  onClose,
  onSuccess,
}: {
  amountNok: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    onSuccess();
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="mt-6">
      <PaymentElement />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!stripe || submitting || success}
        className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#C9A84C] font-bold text-[#0D1B2A] disabled:opacity-60"
      >
        {submitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0D1B2A] border-t-transparent" /> : null}
        <span className={submitting ? "ml-2" : ""}>{submitting ? "Processing..." : `Pay ${amountNok} NOK`}</span>
      </button>
      {success ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#C9A84C]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#C9A84C]">✓</span>
          <span>Payment successful! Your account has been updated.</span>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
