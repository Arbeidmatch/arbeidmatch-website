"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FlisleggerProjectForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const phone = String(data.get("phone") ?? "");
    const project = String(data.get("project") ?? "");
    const area = String(data.get("area") ?? "");
    const customerType = String(data.get("customerType") ?? "");
    const service = String(data.get("service") ?? "");
    const workType = String(data.get("workType") ?? "");
    const start = String(data.get("start") ?? "");
    const newsletter = data.get("newsletter") === "yes";

    try {
      const response = await fetch("/api/public/flislegger-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, customerType, service, workType, start, area, project, newsletter,
          message: `Ny prosjektforespørsel til Flislegger-avdelingen\nTelefon: ${phone}\nKundetype: ${customerType}\nTjeneste: ${service}\nArbeid: ${workType}\nØnsket oppstart: ${start}\nSted / postnummer: ${area}\nProsjekt: ${project}\nPersonvernvilkår: Godkjent\nNyhetsbrev: ${newsletter ? "Ja, uttrykkelig samtykke" : "Nei"}`,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Kunne ikke sende forespørselen.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-[#1d9e75] bg-[#0f1923] p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#1d9e75]" aria-hidden="true" />
        <h3 className="mt-5 text-2xl font-semibold">Takk, vi tar kontakt.</h3>
        <p className="mt-2 max-w-sm text-white/70">Vi vurderer prosjektet og kontakter deg for å avtale neste steg.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-[24px] border border-white/15 bg-[#0f1923] p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-white/75">
          Navn
          <input name="name" required minLength={2} className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-white/5 px-4 text-white outline-none focus:border-[#1d9e75]" />
        </label>
        <label className="text-sm font-medium text-white/75">
          Telefon
          <input name="phone" required type="tel" className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-white/5 px-4 text-white outline-none focus:border-[#1d9e75]" />
        </label>
        <label className="text-sm font-medium text-white/75">
          E-post
          <input name="email" required type="email" className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-white/5 px-4 text-white outline-none focus:border-[#1d9e75]" />
        </label>
        <label className="text-sm font-medium text-white/75">
          Sted / postnummer
          <input name="area" required className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-white/5 px-4 text-white outline-none focus:border-[#1d9e75]" />
        </label>
        <label className="text-sm font-medium text-white/75">
          Privatperson eller firma?
          <select name="customerType" required defaultValue="" className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-[#0f1923] px-4 text-white outline-none focus:border-[#1d9e75]">
            <option value="" disabled>Velg</option><option>Privatperson</option><option>Firma</option><option>Entreprenør / borettslag</option>
          </select>
        </label>
        <label className="text-sm font-medium text-white/75">
          Tjeneste
          <select name="service" required defaultValue="" className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-[#0f1923] px-4 text-white outline-none focus:border-[#1d9e75]">
            <option value="" disabled>Velg</option><option>Bad og våtrom</option><option>Kjøkken</option><option>Trapp</option><option>Terrasse</option><option>Næringslokale</option><option>Venetiansk stukkatur</option><option>Annet</option>
          </select>
        </label>
        <label className="text-sm font-medium text-white/75">
          Hva skal gjøres?
          <select name="workType" required defaultValue="" className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-[#0f1923] px-4 text-white outline-none focus:border-[#1d9e75]">
            <option value="" disabled>Velg</option><option>Bygge nytt</option><option>Renovere / reparere</option><option>Ikke avklart</option>
          </select>
        </label>
        <label className="text-sm font-medium text-white/75">
          Ønsket oppstart
          <input name="start" type="date" required className="mt-2 min-h-12 w-full rounded-[12px] border border-white/20 bg-[#0f1923] px-4 text-white outline-none focus:border-[#1d9e75]" />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-white/75">
        Fortell kort om prosjektet
        <textarea name="project" required minLength={10} rows={4} placeholder="For eksempel: totalrenovering av bad, ca. 8 m²" className="mt-2 w-full rounded-[12px] border border-white/20 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#1d9e75]" />
      </label>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/70">
        <input name="privacy" value="accepted" required type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#1d9e75]" />
        <span>Jeg godtar at ArbeidMatch bruker opplysningene mine for å behandle forespørselen og kontakte meg. Les <a href="/flislegger/personvern" target="_blank" className="font-semibold text-white underline underline-offset-2">personvernerklæringen</a>.</span>
      </label>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/70">
        <input name="newsletter" value="yes" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#1d9e75]" />
        <span>Ja takk, jeg vil motta nyheter, prosjektinspirasjon og relevante tilbud på e-post. Valgfritt, og kan trekkes tilbake når som helst.</span>
      </label>
      {error ? <p className="mt-3 text-sm text-white">{error}</p> : null}
      <button disabled={busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d9e75] px-6 font-semibold text-white hover:brightness-110 disabled:opacity-60">
        {busy ? "Sender..." : "Be om gratis vurdering"}
        {!busy ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
      </button>
      <p className="mt-4 text-center text-xs text-white/45">Uforpliktende. Vi deler ikke opplysningene dine med andre.</p>
    </form>
  );
}

