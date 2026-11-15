import Link from "next/link";
import type { ReactNode } from "react";

import { Accordion } from "@/components/site/Accordion";
import { Icon } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

/**
 * The industry and city pages (bemanning-*, bemanningsbyrå-*) on the site's
 * template (ORDER 295, stage 6b). Each page keeps its own copy and passes it
 * here; this lays it out as the mockup's pages are laid out: a dark band with
 * the heading, the introduction, the roles, three cards, the questions, the
 * related pages and a closing band with the page's two actions.
 */

export type SeoAction = { label: string; href: string };

export type SeoLandingProps = {
  eyebrow: string;
  title: string;
  intro: readonly ReactNode[];
  /** A plain list of roles in one card ("Typiske roller i regionen"). */
  roleList?: { heading: string; items: readonly string[] };
  /** Roles that each carry a line of their own. */
  roleCards?: { heading: string; items: readonly (readonly [string, string])[] };
  cards: { heading?: string; items: readonly (readonly [string, string])[] };
  faq?: { heading: string; items: readonly { q: string; a: string }[] };
  seeAlso: readonly { href: string; label: string }[];
  closing?: { heading: string; body?: string };
  /** The first action opens the request pop-up; the second is a plain link. */
  primary: string;
  secondary: SeoAction;
};

function Grid({ items, heading }: { items: readonly (readonly [string, string])[]; heading?: string }) {
  return (
    <div className="three" style={heading ? undefined : { marginTop: 0 }}>
      {items.map(([t, b]) => (
        <div key={t} className="card">
          {heading ? <h3 className="h4">{t}</h3> : <h2 className="h4">{t}</h2>}
          <p>{b}</p>
        </div>
      ))}
    </div>
  );
}

export default function SeoLanding(p: SeoLandingProps) {
  return (
    <div className="ams page" lang="nb">
      <section className="dark band">
        <div className="w">
          <span className="eb">{p.eyebrow}</span>
          <h1>{p.title}</h1>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="seo-intro">
            {p.intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {p.roleList ? (
            <div className="card" style={{ marginTop: 40, maxWidth: 760 }}>
              <h2 className="h4">{p.roleList.heading}</h2>
              <ul className="chk">
                {p.roleList.items.map((r) => (
                  <li key={r}>
                    <Icon name="check" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {p.roleCards ? (
        <section className="sec tight">
          <div className="w">
            <h2 className="h2">{p.roleCards.heading}</h2>
            <Grid items={p.roleCards.items} heading={p.roleCards.heading} />
          </div>
        </section>
      ) : null}

      <section className="sec tight">
        <div className="w">
          {p.cards.heading ? <h2 className="h2">{p.cards.heading}</h2> : null}
          <Grid items={p.cards.items} heading={p.cards.heading} />
        </div>
      </section>

      {p.faq ? (
        <section className="sec tight">
          <div className="w" style={{ maxWidth: 880 }}>
            <h2 className="h2">{p.faq.heading}</h2>
            <Accordion numbered={false} items={p.faq.items.map((f) => ({ title: f.q, body: <p>{f.a}</p> }))} />
          </div>
        </section>
      ) : null}

      <section className="sec tight">
        <div className="w">
          <h2 className="seo-h">Se også</h2>
          <div className="pills" style={{ marginTop: 16 }}>
            {p.seeAlso.map((s) => (
              <Link key={s.href} className="pill" href={s.href}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <div>
            <h2 className="h3">{p.closing?.heading ?? "Klar for neste steg?"}</h2>
            {p.closing?.body ? <p>{p.closing.body}</p> : null}
          </div>
          <div className="close-acts">
            <Link className="btn gold" href={SITE_PATHS.request} data-rask-foresporsel>
              {p.primary}
            </Link>
            <Link className="btn ghost" href={p.secondary.href}>
              {p.secondary.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
