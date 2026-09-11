"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SLOW_REVIEW_MESSAGE } from "@/lib/job-ads/errors";
import { emptyAdvert, INDUSTRIES, type AdvertDraft, type PublicOrderView } from "@/lib/job-ads/types";
import AdvertForm, { type AdvertSubmitResult, type StoredDraft } from "./AdvertForm";
import { DRAFT_KEY, readJson, rememberedOrders, rememberOrder, removeKey, type RememberedOrder } from "./storage";
import { bigSpinnerClass } from "./ui";

export type AdvertPrefill = {
  company?: string;
  org?: string;
  name?: string;
  email?: string;
  phone?: string;
  industry?: string;
  title?: string;
  city?: string;
};

/** Fill only what is still empty: a draft the visitor already wrote wins over a link's guess. */
function applyPrefill(ad: AdvertDraft, p: AdvertPrefill): AdvertDraft {
  const pick = (current: string | null | undefined, incoming?: string) => (String(current ?? "").trim() ? current ?? "" : (incoming ?? "").trim());
  const industry = INDUSTRIES.find((i) => i.value.toLowerCase() === String(p.industry ?? "").trim().toLowerCase())?.value;
  return {
    ...ad,
    title: pick(ad.title, p.title),
    industry: ad.industry || industry || "",
    location: { ...ad.location, city: pick(ad.location.city, p.city) },
    employer: {
      ...ad.employer,
      name: pick(ad.employer.name, p.company),
      orgNumber: pick(ad.employer.orgNumber, String(p.org ?? "").replace(/\D/g, "").slice(0, 9)),
    },
    contact: {
      ...ad.contact,
      name: pick(ad.contact.name, p.name),
      email: pick(ad.contact.email, p.email),
      phone: pick(ad.contact.phone, p.phone),
    },
  };
}

export default function NewAdvertClient({ prefill }: { prefill: AdvertPrefill }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<AdvertDraft>(emptyAdvert());
  const [initialStep, setInitialStep] = useState(0);
  const [initialStartedAt, setInitialStartedAt] = useState<number | undefined>(undefined);
  const [hadDraft, setHadDraft] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [orders, setOrders] = useState<RememberedOrder[]>([]);

  useEffect(() => {
    const draft = readJson<StoredDraft>(DRAFT_KEY);
    const base = draft?.advert && typeof draft.advert === "object" ? { ...emptyAdvert(), ...draft.advert } : emptyAdvert();
    setInitial(applyPrefill(base, prefill));
    setInitialStep(draft && Number.isInteger(draft.step) ? draft.step : 0);
    const recent = draft && Number.isFinite(draft.startedAt) && Date.now() - draft.startedAt < 30 * 86_400_000;
    setInitialStartedAt(recent ? draft.startedAt : undefined);
    setHadDraft(Boolean(draft?.advert));
    setOrders(rememberedOrders());
    setReady(true);
    // Read once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOver = () => {
    removeKey(DRAFT_KEY);
    setInitial(applyPrefill(emptyAdvert(), prefill));
    setInitialStep(0);
    setInitialStartedAt(undefined);
    setHadDraft(false);
    setFormKey((k) => k + 1);
  };

  const submit = async (input: { advert: AdvertDraft; rulesVersion: string; startedAt: number; honeypot: string }): Promise<AdvertSubmitResult> => {
    try {
      const res = await fetch("/api/job-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advert: input.advert,
          rulesVersion: input.rulesVersion,
          rulesAccepted: true,
          startedAt: input.startedAt,
          company_website: input.honeypot,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; order?: PublicOrderView; error?: string; fields?: Record<string, string> }
        | null;
      if (!res.ok || !json?.ok || !json.order?.token) {
        return {
          ok: false,
          error: json?.error || "Vi fikk ikke sendt annonsen. Prøv igjen om et minutt.",
          fields: json?.fields,
          rulesChanged: res.status === 409,
        };
      }
      removeKey(DRAFT_KEY);
      rememberOrder(json.order.token, json.order.advert?.title ?? input.advert.title);
      router.push(`/annonse/${json.order.token}`);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: SLOW_REVIEW_MESSAGE,
      };
    }
  };

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">For arbeidsgivere</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Publiser en stillingsannonse</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/70">
          Skriv annonsen og godta annonsereglene. Vi kontrollerer den før dere betaler noe. Når den er godkjent, velger dere pakke og
          betaler med kort eller faktura, og annonsen publiseres på arbeidmatch.no.
        </p>
        <ol className="mt-5 grid grid-cols-1 gap-2 text-sm text-white/75 sm:grid-cols-3">
          {["Dere skriver annonsen", "Vi kontrollerer den", "Dere velger pakke og betaler"].map((t, i) => (
            <li key={t} className="flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.02] px-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(201,168,76,0.15)] text-xs font-bold text-[#C9A84C]">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </header>

      {orders.length > 0 ? (
        <div className="mb-6 rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
          <p className="font-semibold text-white">Dine bestillinger</p>
          <ul className="mt-2 space-y-1">
            {orders.map((o) => (
              <li key={o.token}>
                <Link href={`/annonse/${o.token}`} className="text-[#C9A84C] underline underline-offset-2 hover:text-[#e0c46a]">
                  {o.title || "Stillingsannonse"}
                </Link>
                <span className="ml-2 text-white/40">{new Date(o.savedAt).toLocaleDateString("nb-NO")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!ready ? (
        <div className="flex justify-center py-20">
          <span className={bigSpinnerClass} />
        </div>
      ) : (
        <>
          {hadDraft ? (
            <p className="mb-4 text-sm text-white/60">
              Vi har tatt vare på det dere skrev sist.{" "}
              <button type="button" onClick={startOver} className="font-semibold text-[#C9A84C] underline underline-offset-2">
                Start på nytt
              </button>
            </p>
          ) : null}
          <AdvertForm
            key={formKey}
            mode="create"
            initial={initial}
            initialStep={initialStep}
            initialStartedAt={initialStartedAt}
            onSubmit={submit}
          />
        </>
      )}

      <p className="mt-8 text-center text-[13px] text-white/45">
        Spørsmål? Skriv til{" "}
        <a href="mailto:post@arbeidmatch.no" className="text-white/70 underline underline-offset-2">
          post@arbeidmatch.no
        </a>
      </p>
    </div>
  );
}
