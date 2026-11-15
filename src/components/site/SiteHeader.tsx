"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/site/Icon";
import { useSheets } from "@/components/site/sheet/SheetHost";
import {
  CANDIDATE_TABS,
  SITE_PATHS,
  activeCandidateTab,
  hasOwnShell,
  isCandidatePath,
  pageAction,
  siteLang,
} from "@/components/site/siteNav";
import { portalHeader } from "@/lib/prosjekter/portalNav";

/**
 * The sticky header of every public page (ORDER 295, approved mockup of
 * 15 November 2026): four entries, "For candidates" opening a small list,
 * the way in and the page's one action on the right. On a phone the entries
 * give way to the menu sheet. Candidate pages carry the tab row under it.
 */

function current(pathname: string, href: string): boolean {
  const base = href.split(/[?#]/)[0] || "/";
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

function CandidateTabs({ pathname }: { pathname: string }) {
  const search = useSearchParams()?.toString() ?? "";
  const active = activeCandidateTab(pathname, search);
  return (
    <nav className="cnav" aria-label="For candidates">
      <div className="w">
        {CANDIDATE_TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={active === t.href ? "page" : undefined}>
            {t.short === t.label ? (
              t.label
            ) : (
              <>
                <span className="lg">{t.label}</span>
                <span className="sm">{t.short}</span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const { open } = useSheets();
  const [dd, setDd] = useState(false);
  const ddRef = useRef<HTMLSpanElement>(null);
  // A pointer that opened the list by hovering must not close it again with the click that follows.
  const hoverOpenedAt = useRef(0);

  useEffect(() => setDd(false), [pathname]);
  useEffect(() => {
    if (!dd) return;
    const onDown = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDd(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDd(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dd]);

  if (hasOwnShell(pathname)) return null;

  const lang = siteLang(pathname);
  const no = lang === "no";
  const action = pageAction(pathname);
  // A client's own project page and Min side keep the portal's two actions (portalNav.ts).
  const portal = pathname === "/prosjekter" ? null : portalHeader(pathname);
  const candidatesActive = CANDIDATE_TABS.some((t) => current(pathname, t.href)) || isCandidatePath(pathname);

  return (
    <div className="ams contents">
      <a href="#main" className="am-skip">
        {no ? "Gå til innholdet" : "Skip to content"}
      </a>
      <header className="s-h">
        <div className="w s-hrow">
          <Link href={SITE_PATHS.home} className="logo" aria-label="ArbeidMatch">
            <Image src="/brand/arbeidmatch-a-emblem.png" alt="" width={30} height={30} priority />
            ArbeidMatch<i>BETA</i>
          </Link>
          <nav className="s-nav" aria-label={no ? "Hovedmeny" : "Main menu"}>
            <Link href={SITE_PATHS.firms} aria-current={current(pathname, SITE_PATHS.firms) ? "page" : undefined}>
              For bedrifter
            </Link>
            <Link href={SITE_PATHS.forsprang} aria-current={current(pathname, SITE_PATHS.forsprang) ? "page" : undefined}>
              Forsprang
            </Link>
            <span className="dd" ref={ddRef} onMouseLeave={() => setDd(false)}>
              <button
                type="button"
                aria-expanded={dd}
                aria-haspopup="true"
                aria-controls="am-cand-menu"
                onClick={() => setDd((v) => (Date.now() - hoverOpenedAt.current < 600 ? true : !v))}
                onMouseEnter={() => {
                  if (!dd) hoverOpenedAt.current = Date.now();
                  setDd(true);
                }}
                style={candidatesActive ? { color: "var(--gold)" } : undefined}
              >
                For candidates
                <Icon name="down" />
              </button>
              <span className="ddp" id="am-cand-menu" hidden={!dd}>
                {CANDIDATE_TABS.map((t) => (
                  <Link key={t.href} href={t.href} onClick={() => setDd(false)}>
                    {t.label}
                  </Link>
                ))}
              </span>
            </span>
            <Link href={SITE_PATHS.contact} aria-current={current(pathname, SITE_PATHS.contact) ? "page" : undefined}>
              {no ? "Kontakt" : "Contact"}
            </Link>
          </nav>
          {portal ? (
            <>
              <Link href={portal.quiet.href} className="login">
                <Icon name="user" />
                {portal.quiet.label}
              </Link>
              <Link href={portal.gold.href} className="btn gold" style={{ height: 42 }} {...(portal.gold.href === "/request" ? { "data-rask-foresporsel": "" } : {})}>
                {portal.gold.label}
              </Link>
            </>
          ) : (
            <>
              <button type="button" className="login" onClick={() => open("login")}>
                <Icon name="user" />
                {no ? "Logg inn" : "Log in"}
              </button>
              {action?.kind === "link" ? (
                action.href.startsWith("#") ? (
                  <a href={action.href} className="btn gold" style={{ height: 42 }}>
                    {action.label}
                  </a>
                ) : (
                  <Link href={action.href} className="btn gold" style={{ height: 42 }} {...(action.rask ? { "data-rask-foresporsel": "" } : {})}>
                    {action.label}
                  </Link>
                )
              ) : action?.kind === "sheet" ? (
                <button type="button" className="btn gold" style={{ height: 42 }} data-sheet={action.sheet}>
                  {action.label}
                </button>
              ) : null}
            </>
          )}
          <button type="button" className="burger" aria-label={no ? "Meny" : "Menu"} onClick={() => open("menu")}>
            <Icon name="menu" />
          </button>
        </div>
      </header>
      {isCandidatePath(pathname) ? (
        <Suspense fallback={null}>
          <CandidateTabs pathname={pathname} />
        </Suspense>
      ) : null}
    </div>
  );
}
