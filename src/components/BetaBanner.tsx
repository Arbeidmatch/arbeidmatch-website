"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { langForPath } from "@/lib/pageLang";

const LEGAL_POLICY_PATHS = new Set(["/privacy", "/terms", "/unsubscribed"]);

function normalizePathname(pathname: string | null): string {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export default function BetaBanner() {
  const pathname = usePathname();
  const no = pathname === "/" || langForPath(pathname) === "nb";
  const copy = no ? {
    heading: "Under utvikling. Bedre sammen med deg.",
    intro: "Nettsiden er i betaversjon. Vi forbedrer funksjoner, innhold og design fortløpende. Dine tilbakemeldinger hjelper oss å forstå behovene dine og gjøre tjenesten bedre.",
    details: "Om betaversjonen og forventninger",
    operation: "I betaperioden kan det forekomme feil, avbrudd, forsinkelser eller visningsproblemer. Innhold, funksjoner og grafisk utforming kan endres. Illustrasjonsbilder og eksempler viser ikke nødvendigvis en bestemt kandidat, arbeidsplass eller et avtalt leveranseomfang.",
    results: "Informasjon, kandidatpresentasjoner og estimater på nettsiden er ikke i seg selv en garanti for ansettelse, kandidattilgjengelighet, leveringstid eller et bestemt resultat. Omfang, pris, frister og forpliktelser for en konkret tjeneste avtales særskilt.",
    rights: "Denne informasjonen begrenser ikke ufravikelige rettigheter eller våre forpliktelser etter inngåtte avtaler. Kontakt oss hvis noe er uklart eller ikke fungerer som forventet.",
    feedback: "Gi oss tilbakemelding", support: "Teknisk hjelp", terms: "Vilkår",
  } : {
    heading: "In development. Improving with you.",
    intro: "Our website is in a beta version. We continually improve its features, content and design. Your feedback helps us understand your needs and make the service better.",
    details: "About the beta version and what to expect",
    operation: "During the beta period, errors, interruptions, delays or display issues may occur. Content, features and visual design may change. Illustrative images and examples do not necessarily depict a particular candidate, workplace or agreed service.",
    results: "Website information, candidate presentations and estimates do not in themselves guarantee employment, candidate availability, delivery times or a particular outcome. The scope, price, deadlines and commitments for a specific service are agreed separately.",
    rights: "This notice does not limit mandatory legal rights or our obligations under existing agreements. Please contact us if anything is unclear or does not work as expected.",
    feedback: "Share your feedback", support: "Technical help", terms: "Terms of service",
  };

  return (
    <section lang={no ? "nb" : "en"} aria-label={copy.heading} className="border-t border-[#C9A84C]/20 bg-[#132333] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3"><span className="rounded border border-[#C9A84C]/50 px-2 py-1 text-[10px] font-semibold tracking-widest text-[#C9A84C]">BETA</span><h2 className="text-base font-semibold text-white">{copy.heading}</h2></div>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/75">{copy.intro}</p>
        <details className="mt-4 max-w-4xl text-sm" open={LEGAL_POLICY_PATHS.has(normalizePathname(pathname)) || undefined}>
          <summary className="min-h-11 cursor-pointer py-3 font-medium text-[#C9A84C]">{copy.details}</summary>
          <div className="space-y-3 pb-2 leading-relaxed text-white/75"><p>{copy.operation}</p><p>{copy.results}</p><p>{copy.rights}</p></div>
        </details>
        <div className="mt-2 flex flex-wrap gap-x-7 gap-y-1 text-sm"><Link href="/feedback" className="inline-flex min-h-11 items-center font-medium text-[#C9A84C] hover:underline">{copy.feedback} →</Link><a href="mailto:support@arbeidmatch.no" className="inline-flex min-h-11 items-center text-white/75 hover:underline">{copy.support}: support@arbeidmatch.no</a><Link href="/terms" className="inline-flex min-h-11 items-center text-white/75 hover:underline">{copy.terms}</Link></div>
      </div>
    </section>
  );
}
