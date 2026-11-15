import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

import { ForsprangCount, ForsprangMinimap } from "./ForsprangLive";

/**
 * The front page of the mockup approved on 15 November 2026 (ORDER 295): general,
 * with no job details, two doors (firms in Norwegian, candidates in English),
 * everything we offer with the Forsprang card and its live count, the two
 * products coming, and a short word about us.
 */
export default function SiteHome() {
  return (
    <div className="ams page">
      <section className="dark">
        <div className="w hero-g">
          <div>
            <span className="eb">Bemanning og rekruttering</span>
            <h1>
              Riktig kompetanse.<span>På rett plass.</span>
            </h1>
            <p className="lede">Vi kobler norske bedrifter med fagfolk fra EU/EØS.</p>
          </div>
          <Image
            className="ph"
            style={{ aspectRatio: "4 / 3", height: "auto" }}
            src="/images/home/carpenter-watermarked.webp"
            alt="Tømrer i arbeid"
            width={1200}
            height={900}
            sizes="(max-width: 760px) 100vw, 560px"
            priority
          />
        </div>
        <div className="w doors">
          <Link className="door" href={SITE_PATHS.firms}>
            <span className="eb">For bedrifter</span>
            <h2 className="h3">Trenger dere fagfolk?</h2>
            <p>Ekstra kapasitet til prosjektet eller en ny kollega.</p>
            <span className="go">
              Se hvordan vi jobber
              <Icon name="arrow" />
            </span>
          </Link>
          <Link className="door" href={SITE_PATHS.candidates} lang="en">
            <span className="eb">For candidates</span>
            <h2 className="h3">Looking for work in Norway?</h2>
            <p>For tradespeople from the EU and EEA. English is required, Norwegian is a plus.</p>
            <span className="go">
              See how it works
              <Icon name="arrow" />
            </span>
          </Link>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">Hva vi tilbyr</span>
          <h2 className="h2">Tjenester og produkter</h2>
          <div className="three">
            <Link className="card" href={SITE_PATHS.firms}>
              <span className="eb">Tjeneste</span>
              <h3 className="h4">Bemanning og rekruttering</h3>
              <p>Fagfolk til prosjektet, eller en fast ansatt til teamet.</p>
              <span className="more">
                For bedrifter
                <Icon name="arrow" />
              </span>
            </Link>
            <Link className="card night" href={SITE_PATHS.forsprang}>
              <ForsprangMinimap />
              <span className="eb">
                Produkt<i className="bt">Beta</i>
              </span>
              <h3 className="h4">Forsprang</h3>
              <p>Kart og varsler over bygg- og anleggsprosjekter i hele Norge.</p>
              <ForsprangCount />
              <span className="more">
                Kun med invitasjon
                <Icon name="arrow" />
              </span>
            </Link>
            <Link className="card" href={SITE_PATHS.flislegger}>
              <span className="eb">Fagavdeling</span>
              <h3 className="h4">Flislegging i Trondheim</h3>
              <p>Vi tar ansvar for hele flisprosjektet, fra første befaring til siste fuge.</p>
              <span className="more">
                Til flisleggerne
                <Icon name="arrow" />
              </span>
            </Link>
          </div>
          <div className="rows wide">
            <button type="button" className="prow" data-sheet="notify" data-sheet-set="what=Stillingsannonser">
              <span className="ri">
                <Icon name="msg" />
              </span>
              <span className="rl">
                <b>Stillingsannonser for bedrifter</b>
                <small>Annonser ledige stillinger hos oss.</small>
              </span>
              <span className="soon">Kommer</span>
            </button>
            <button type="button" className="prow" data-sheet="notify" data-sheet-set="what=RecOS for byråer">
              <span className="ri">
                <Icon name="brief" />
              </span>
              <span className="rl">
                <b>RecOS for bemanningsbyråer</b>
                <small>Systemet vi selv bruker til rekruttering og bemanning.</small>
              </span>
              <span className="soon">Venteliste</span>
            </button>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">Kort om oss</span>
          <h2 className="h2">Et bemanningsforetak med base i Trondheim</h2>
          <div className="facts3">
            <div className="fact h">
              <span className="ri">
                <Icon name="user" />
              </span>
              <div>
                <h3 className="h4">En personlig kontakt</h3>
                <p>Samme person følger dere gjennom hele prosessen.</p>
              </div>
            </div>
            <div className="fact h">
              <span className="ri">
                <Icon name="badge" />
              </span>
              <div>
                <h3 className="h4">Vurderte kandidater</h3>
                <p>Erfaring, ferdigheter og tilgjengelighet er gjennomgått før dere møter noen.</p>
              </div>
            </div>
            <div className="fact h">
              <span className="ri">
                <Icon name="pin" />
              </span>
              <div>
                <h3 className="h4">Hele Norge</h3>
                <p>Vi jobber med bedrifter over hele landet.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
