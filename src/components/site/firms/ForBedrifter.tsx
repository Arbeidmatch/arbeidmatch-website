import Image from "next/image";
import Link from "next/link";

import { Accordion } from "@/components/site/Accordion";
import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

/**
 * For bedrifter, as in the mockup approved on 15 November 2026 (ORDER 295,
 * stage 2): what we offer firms in Norwegian, on one short page. Every button
 * that asks for people opens the request sheet over the page, with the trade
 * it names already chosen; the link under it still goes to /request when
 * scripts do not run.
 */

const STEPS = [
  { title: "Kandidatsøk", body: "Målrettet søk i EU- og EØS-land etter kandidater som svarer til de konkrete kravene deres. Vi bruker egne nettverk, ikke bare jobbportaler." },
  { title: "Forhåndsscreening", body: "Strukturerte intervjuer, dokumentkontroll og vurdering av faglig relevans før en kandidat blir presentert." },
  { title: "Kandidatpresentasjon", body: "En strukturert presentasjon av de utvalgte kandidatene, med relevant erfaring, sertifiseringer og referanser." },
  { title: "Kontrakt og etterlevelse", body: "Ved bemanning står vi som formell arbeidsgiver og håndterer arbeidskontrakter, lønn og etterlevelse av norsk arbeidsrett og tariffavtaler." },
  { title: "Hjelp med oppstart", body: "Vi koordinerer logistikk før ankomst, dokumentasjon og praktisk oppstart, så kandidaten er klar fra første dag." },
  { title: "Oppfølging", body: "Ukentlig kontakt med både kunde og kandidat etter plasseringen, for å oppdage og løse problemer tidlig." },
] as const;

/** The trades on the page; health care is only in the sheet's list, last (the owner, 14 November 2026). */
const TRADE_PILLS = [
  { label: "Bygg og anlegg", set: "trade=bygg" },
  { label: "Industri", set: "trade=industri" },
  { label: "Sveis og spesialteknikere", set: "trade=industri;role=Sveiser" },
  { label: "Logistikk", set: "trade=logistikk" },
  { label: "Renhold", set: "trade=renhold" },
  { label: "Horeca", set: "trade=horeca" },
  { label: "Annet fag", set: "trade=annet" },
] as const;

function RowIcon({ name }: { name: IconName }) {
  return (
    <span className="ri">
      <Icon name={name} />
    </span>
  );
}

function Chev() {
  return (
    <span data-ic="chev">
      <Icon name="chev" />
    </span>
  );
}

export default function ForBedrifter() {
  return (
    <div className="ams page" lang="nb">
      <section className="dark band">
        <div className="w band-g">
          <div>
            <span className="eb">For bedrifter</span>
            <h1>Kvalifisert arbeidskraft fra EU/EØS</h1>
            <p className="lede">Til bygg og anlegg, logistikk og industri. Raskt, lovlig og med full oppfølging.</p>
          </div>
          <Image
            className="ph"
            style={{ objectPosition: "center top" }}
            src="/images/home/concrete.webp"
            alt="Fagarbeider på byggeplass"
            width={800}
            height={600}
            sizes="(max-width: 760px) 100vw, 480px"
            priority
          />
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">To veier</span>
          <h2 className="h2">Leie inn eller ansette selv</h2>
          <div className="two">
            <div className="card">
              <span className="eb">Bemanning</span>
              <h3>Vi er arbeidsgiveren.</h3>
              <p>Fleksibel arbeidskraft når dere trenger det. Dere kan konsentrere dere om prosjektet.</p>
            </div>
            <div className="card sage">
              <span className="eb">Rekruttering</span>
              <h3>Dere ansetter selv.</h3>
              <p>Vi styrer søk, screening, intervjuer og presentasjon. Dere tar den endelige beslutningen.</p>
            </div>
          </div>
          <div className="rows wide">
            <a className="prow" href={SITE_PATHS.request} data-sheet="request">
              <RowIcon name="users" />
              <span className="rl">
                <b>For bemanningsbyråer</b>
                <small>Dere har kunden. Vi finner kandidatene.</small>
              </span>
              <Chev />
            </a>
            <div className="prow">
              <RowIcon name="msg" />
              <span className="rl">
                <b>Stillingsannonsering</b>
                <small>Annonser ledige stillinger i våre kanaler i EU/EØS.</small>
              </span>
              <span className="soon">Kommer snart</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w split">
          <div>
            <span className="eb">Slik jobber vi</span>
            <h2 className="h2">Seks steg fra forespørsel til oppfølging</h2>
          </div>
          <Accordion items={STEPS.map((s) => ({ title: s.title, body: <p>{s.body}</p> }))} />
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <div className="note">
            <span className="eb">Innleie</span>
            <h3>Gjort ordentlig, fra første dag</h3>
            <p>
              Før noen begynner hos dere, avklarer vi grunnlaget for innleien og avtaler det skriftlig. Kontrakten, lønnsvilkårene og timene samles på oppdraget, så dokumentasjonen er klar hvis
              Arbeidstilsynet spør.
            </p>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w cols2">
          <div>
            <span className="eb">Bransjer</span>
            <h2 className="h2">Hvor trenger dere folk?</h2>
            <p className="sub">Listen er ikke komplett. Si hva dere trenger, så finner vi fagfolkene.</p>
            <div className="pills">
              {TRADE_PILLS.map((p) => (
                <a key={p.label} className="pill" href={SITE_PATHS.request} data-sheet="request" data-sheet-set={p.set}>
                  {p.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <span className="eb">Digitale verktøy</span>
            <h2 className="h2">Følg med selv</h2>
            <div className="rows wide">
              <a className="prow" href={SITE_PATHS.minSide} data-sheet="login">
                <RowIcon name="lock" />
                <span className="rl">
                  <b>
                    Min side<i className="bt">Beta</i>
                  </b>
                  <small>Kandidater, timer og fakturaer på ett sted.</small>
                </span>
                <Chev />
              </a>
              <Link className="prow" href={SITE_PATHS.forsprang}>
                <RowIcon name="pin" />
                <span className="rl">
                  <b>
                    Forsprang<i className="bt">Beta</i>
                  </b>
                  <small>Se hvor Norge bygger, og planlegg bemanningen i tide.</small>
                </span>
                <Chev />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
