"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/site/Icon";
import { useSheets } from "@/components/site/sheet/SheetHost";
import { SITE_PATHS } from "@/components/site/siteNav";
import { SupportButton } from "@/components/support/SupportRequest";

/**
 * Kontakt as a router (ORDER 295, stage 2): instead of one form for everyone
 * the page asks "Hva trenger du?" and sends each visitor straight to the right
 * place. Firms read Norwegian, candidates English. The links that came here
 * before still work: ?for=candidate opens the message sheet on the candidate's
 * side, ?support=1 opens the support request.
 */

function Chev() {
  return (
    <span data-ic="chev">
      <Icon name="chev" />
    </span>
  );
}

function Body({ icon, title, sub }: { icon: IconName; title: string; sub: string }) {
  return (
    <>
      <span className="ri">
        <Icon name={icon} />
      </span>
      <span className="rl">
        <b>{title}</b>
        <small>{sub}</small>
      </span>
    </>
  );
}

function SheetRow({ sheet, set, href, children }: { sheet: string; set?: string; href: string; children: ReactNode }) {
  return (
    <a className="prow" href={href} data-sheet={sheet} {...(set ? { "data-sheet-set": set } : {})}>
      {children}
      <Chev />
    </a>
  );
}

function PageRow({ href, children, lang }: { href: string; children: ReactNode; lang?: string }) {
  return (
    <Link className="prow" href={href} lang={lang}>
      {children}
      <Chev />
    </Link>
  );
}

export default function ContactRouter() {
  const sheets = useSheets();
  const [supportOnArrival, setSupportOnArrival] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("for") === "candidate") sheets.open("contact", { who: "candidate" });
    if (params.get("support") === "1") setSupportOnArrival(true);
  }, [sheets]);

  return (
    <div className="ams page" lang="nb">
      <section className="dark band">
        <div className="w">
          <span className="eb">Kontakt</span>
          <h1>Hva trenger du?</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            Velg det som passer, så kommer du rett til riktig sted. Vi svarer innen én virkedag.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="w cols2">
          <div>
            <span className="eb">For bedrifter</span>
            <div className="rows wide">
              <SheetRow sheet="request" href={SITE_PATHS.request}>
                <Body icon="users" title="Vi trenger folk" sub="Send en gratis forespørsel" />
              </SheetRow>
              <SheetRow sheet="contact" href={SITE_PATHS.contact}>
                <Body icon="msg" title="Vi har et spørsmål" sub="Om bemanning, rekruttering eller et oppdrag" />
              </SheetRow>
              <SheetRow sheet="request" href={SITE_PATHS.request}>
                <Body icon="building" title="Vi er et bemanningsbyrå" sub="Samarbeid om kandidater fra EU/EØS" />
              </SheetRow>
              <PageRow href={SITE_PATHS.forsprang}>
                <Body icon="pin" title="Vi vil se byggeprosjekter" sub="Forsprang: be om invitasjon" />
              </PageRow>
            </div>
          </div>
          <div lang="en">
            <span className="eb">For candidates</span>
            <div className="rows wide">
              <PageRow href={SITE_PATHS.jobs}>
                <Body icon="brief" title="I am looking for a job" sub="See the open jobs" />
              </PageRow>
              <PageRow href={SITE_PATHS.questions}>
                <Body icon="help" title="I have a question before I apply" sub="Pay, housing, travel, documents" />
              </PageRow>
              <PageRow href={SITE_PATHS.questions}>
                <Body icon="file" title="I applied. What happens now?" sub="How we handle applications" />
              </PageRow>
              <SupportButton lang="en" showIcon={false} className="prow">
                <Body icon="user" title="I need help with something else" sub="Candidate support" />
                <Chev />
              </SupportButton>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">Annet</span>
          <div className="rows wide two">
            <PageRow href={SITE_PATHS.network} lang="en">
              <Body icon="users" title="Recruiter network" sub="Request an invitation" />
            </PageRow>
            <SupportButton lang="nb" autoOpen={supportOnArrival} showIcon={false} className="prow">
              <Body icon="help" title="Kontakt support" sub="Hjelp med konto, innlogging og sider som ikke virker" />
              <Chev />
            </SupportButton>
            <PageRow href={SITE_PATHS.privacy}>
              <Body icon="lock" title="Personvern og dine rettigheter" sub="Innsyn, retting og sletting" />
            </PageRow>
            <div className="prow">
              <Body icon="pin" title="Besøksadresse" sub="Sverre Svendsens veg 38, 7056 Ranheim, Trondheim" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
