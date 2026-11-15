import Link from "next/link";

import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

/**
 * For staffing agencies on the site template (ORDER 295, stage 6b), with its
 * own copy: the promise in the dark band, how it works in three cards, what
 * we offer as a checked list in one card, and the one action.
 */

const OFFERS = [
  "Tilgang til pre-screenede EU/EEA-kandidater uten å bygge eget sourcing-team",
  "Dokumentasjonsstøtte og tydelige prosesser som kan tilpasses deres kvalitetssystem",
  "Skalerbar kapasitet i topper, dere beholder kundeforholdet",
  "Samarbeidsmodeller som avklarer roller, priser og forventninger på forhånd",
  "Målet vårt er forutsigbar leveranse innenfor norsk arbeidslovgivning",
] as const;

const CARDS: readonly { title: string; text: string; icon: IconName }[] = [
  {
    title: "Du har kunden, vi har kandidatene",
    text: "Du fortsetter å betjene dine eksisterende kunder. Vi leverer pre-screenede kandidater fra EU/EEA som matcher dine oppdrag.",
    icon: "users",
  },
  {
    title: "Ingen konkurranse, bare samarbeid",
    text: "Vi opererer ikke som et tradisjonelt bemanningsbyrå overfor dine kunder. Vår rolle er sourcing og pre-screening. Resten er ditt.",
    icon: "badge",
  },
  {
    title: "Utvid kapasiteten din",
    text: "Ta på deg flere oppdrag uten å øke din egen rekrutteringskapasitet. Vi skalerer sourcing etter ditt behov.",
    icon: "chart",
  },
];

export default function StaffingAgenciesPage() {
  return (
    <div className="ams page" lang="nb">
      <section className="dark band">
        <div className="w">
          <span className="eb">For bemanningsbyråer</span>
          <h1>Vi konkurrerer ikke med deg. Vi hjelper deg å vokse.</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            ArbeidMatch spesialiserer seg på sourcing og screening av EU/EEA-kandidater. Du beholder kundeforholdet. Vi
            leverer kandidatene.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">Samarbeid</span>
          <h2 className="h2">Hvordan det fungerer</h2>
          <div className="three">
            {CARDS.map((card) => (
              <div key={card.title} className="card">
                <span className="ri">
                  <Icon name={card.icon} />
                </span>
                <h3 className="h4">{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <div className="card sage" style={{ maxWidth: 760 }}>
            <h2 className="h3">Hva vi tilbyr deg</h2>
            <ul className="chk">
              {OFFERS.map((line) => (
                <li key={line}>
                  <Icon name="check" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="cta" style={{ marginTop: 16 }}>
              <Link className="btn gold" href={SITE_PATHS.contact}>
                Ta kontakt for et partnerskap
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
