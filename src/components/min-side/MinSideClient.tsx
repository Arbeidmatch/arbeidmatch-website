"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type TouchEvent } from "react";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Contact as ContactIcon,
  CreditCard,
  FileSignature,
  FileText,
  KeyRound,
  LogOut,
  MessageSquare,
  Phone,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import MinSidePasskeys, { usePasskeysSupported } from "@/components/min-side/MinSidePasskeys";

import { FIELD, MUTED, PRIMARY, SECONDARY } from "@/components/prosjekter/ui";
import { SupportButton } from "@/components/support/SupportRequest";
import { MinSideWhatsNew } from "./MinSideWhatsNew";
import { MinSideCityQuestion, MinSideContactCard } from "./MinSideCityQuestion";
import MinSideHiring, { ConfirmForm, HiringStop, ProjectsTeaser, useProjectsTrial, type Fetched } from "./MinSideHiring";
import { MinSideAppPrompt } from "./MinSideAppPrompt";
import MinSideAlerts from "./MinSideAlerts";
import MinSideKeyDialog from "./MinSideKeyDialog";
import { FakturaRows, FirmaRows, KontaktRows } from "./MinSideFirm";
import { BODY, CARD, DANGER, GREY, GROUP, GROUP_HEAD, LARGE_TITLE, NAVY, NEW_BADGE, PAGE_BG, PILL, PILL_GREEN, ROW, ROW_BUTTON, SMALL } from "./ios";
import { alertSettingsFrom } from "@/lib/min-side/alert-settings";
import { VISIT_POPUP_KEY } from "@/lib/min-side/app-prompt";
import { decideKeyDialog, keyPromptAsked, withoutKeyPrompt } from "@/lib/min-side/key-prompt";
import { INITIAL_LIST, isNew, varslerHash, varslerRoute, type ListState, type VarslerRoute } from "@/lib/min-side/project-list";
import {
  PLAN_CONFIRMATION,
  SECTIONS,
  SECTION_GROUPS,
  hiringIntentFromSearch,
  firmFromSearch,
  hiringSubtitle,
  showsProjectsTeaser,
  visibleSections,
  alertsWords,
  cityQuestionRequest,
  dayNo,
  intentFromSearch,
  projectPrefill,
  staffingPrefill,
  kronerNo,
  profileFrom,
  sectionFromHash,
  sectionHint,
  telHref,
  unreadMessages,
  type Contact,
  type Profile,
  type SectionKey,
  type StaffingPrefill,
} from "@/lib/min-side/profile";

/**
 * "Min side": a client's own page (the owner's decision of 30 September 2026,
 * a client has a profile like a candidate, with the details we hold).
 *
 * ONE THING AT A TIME. His word the same day: "sa nu fie amestecate toate ...
 * sa fie bine impartite ca sa nu creeze confuzie". So the page is sections, and
 * only the chosen one is on screen.
 *
 * ORDER 273 (12 November 2026) gave it the iOS / iPadOS Settings look, his
 * words: "dar setarile vreau sa fie mai dinamice ca in meniul unui mobil ios",
 * "putem face tot min side in directia asta? da". On a computer (1024px and
 * up) two panes on #F2F2F7: the grouped list on the left with the firm on top,
 * the open section on the right with a large title. On a phone the grouped
 * list is the home and each row pushes its screen from the right, with
 * "‹ Min side" and a swipe back. Prosjektvarsler comes first and is what opens
 * when the address names no section. No site menu ("iar la minside ei nu
 * trebuie sa vada meniul de la site"); the company's name only in the logo and
 * the footer ("nu repeta arbeidmatch de multe ori pe o singura pagina").
 *
 * The address carries where the person is (#varsler, #varsler/<id>,
 * #varsler/innstillinger, #firma, #hjem), so Back and a reload work.
 */

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

/** The trust line of the footer. "Godkjent bemanningsforetak": Arbeidstilsynet's register reads Godkjent for org.nr 935 667 089 (checked 13 October 2026). */
const FOOTER_LINE = "ArbeidMatch Norge AS · Godkjent bemanningsforetak · Org.nr 935 667 089";

/** Each row's 28px rounded icon and its colour, as in the iOS Settings list. */
const ICONS: Record<SectionKey, { icon: LucideIcon; bg: string }> = {
  varsler: { icon: Bell, bg: "#1B2B44" },
  ansetter: { icon: Building2, bg: "#2F6FB0" },
  tilbud: { icon: FileText, bg: "#7A5AB5" },
  kandidater: { icon: Users, bg: "#2E9E6B" },
  timelister: { icon: Clock, bg: "#D9822B" },
  meldinger: { icon: MessageSquare, bg: "#3A8FD9" },
  fakturaer: { icon: Receipt, bg: "#5A6B80" },
  firma: { icon: Briefcase, bg: "#4A5A70" },
  fakturaopplysninger: { icon: CreditCard, bg: "#3F8A8A" },
  kontakter: { icon: ContactIcon, bg: "#8A6D3B" },
  dokumenter: { icon: FileSignature, bg: "#6B6B70" },
  innlogging: { icon: KeyRound, bg: "#4B5563" },
};

const LG = "(min-width: 1024px)";

function Field({ id, label, children, error }: { id: string; label: string; children: ReactNode; error?: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-sm text-[#FF9B9B]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** One section on screen: the large title, the one line that says what it is, its one action, and what it holds. */
function Screen({ section, action, lead, about, children }: { section: SectionKey; action?: ReactNode; lead?: ReactNode; about?: ReactNode; children: ReactNode }) {
  const meta = SECTIONS.find((s) => s.key === section)!;
  return (
    <section id={`ms-panel-${section}`} aria-labelledby={`ms-title-${section}`} className="flex min-w-0 flex-col gap-5">
      {lead}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`ms-title-${section}`} className={`${LARGE_TITLE} ${NAVY}`}>
            {meta.label}
          </h2>
          <p className={`mt-1 ${BODY} ${GREY}`}>{about ?? meta.about}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A plain list of things on a white card: a title, a grey line, and its one link. */
function ListCard({ empty, items }: { empty: string; items: { key: string; title: ReactNode; line?: ReactNode; link?: { href: string; label: string } | null }[] }) {
  if (!items.length) return <p className={`${CARD} p-5 ${BODY} ${GREY}`}>{empty}</p>;
  return (
    <ul className={GROUP}>
      {items.map((it) => (
        <li key={it.key} className={`${ROW} flex-wrap justify-between py-3`}>
          <div className="min-w-0 flex-1">
            <p className={`break-words font-semibold ${BODY} ${NAVY}`}>{it.title}</p>
            {it.line ? <p className={`${SMALL} ${GREY}`}>{it.line}</p> : null}
          </div>
          {it.link ? (
            <a href={it.link.href} className={`${PILL} md:min-h-[2rem]`}>
              {it.link.label}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type Saved = { ok: true } | { ok: false; message: string; field: string | null };

const initials = (name: string) =>
  name
    .replace(/\b(AS|ASA|ANS|DA|ENK|SA)\b/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("nb") ?? "")
    .join("") || "?";

export default function MinSideClient({ token }: { token: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  // The address after "#": the one place that says where the person is.
  const [hash, setHash] = useState("");
  // Where the page opens when the address names no section: Prosjektvarsler, unless the first load says otherwise.
  const [fallback, setFallback] = useState<SectionKey>("varsler");
  const [editContact, setEditContact] = useState<Contact | "new" | null>(null);
  const [askRemove, setAskRemove] = useState<Contact | null>(null);
  // ORDER 100/101: the staffing request, open with what it starts from (the subscription, or one project).
  const [planPrefill, setPlanPrefill] = useState<StaffingPrefill | "alerts" | null>(null);
  const [answering, setAnswering] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  // ORDER 157: last_viewed_at as it stood before this visit said it was seen (undefined until then).
  const [hiringSince, setHiringSince] = useState<string | null | undefined>(undefined);
  const [hiringFocus, setHiringFocus] = useState(false);
  const [hiringAgencyTab, setHiringAgencyTab] = useState(false);
  const [hiringFirm, setHiringFirm] = useState<string | null>(null);
  const [askClose, setAskClose] = useState(false);
  // ORDER 273: the project list's state, kept above the detail so "Alle prosjekter" comes back to it.
  const [list, setList] = useState<ListState>(INITIAL_LIST);
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [scrollBack, setScrollBack] = useState<number | null>(null);
  const savedScroll = useRef(0);
  const [keyDialog, setKeyDialog] = useState(false);
  // One popup per visit: once the key dialog was shown, the app prompt waits for another visit.
  const [keyShown, setKeyShown] = useState(false);
  const [keyCount, setKeyCount] = useState<number | null>(null);
  const supported = usePasskeysSupported();
  // Whether the address chose a section itself: then the first load does not move to the hiring terms.
  const addressChose = useRef(false);
  const firstLoad = useRef(true);
  const viewedSent = useRef(false);
  const readSent = useRef(false);
  const keyAsked = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/min-side/${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(res.status === 404 ? "Lenken er ikke gyldig lenger. Logg inn på nytt, så sender vi en ny." : (payload.error ?? "Siden kunne ikke hentes akkurat nå. Prøv igjen om litt."));
        return;
      }
      const parsed = profileFrom(payload);
      if (!parsed) {
        setError("Siden kunne ikke hentes akkurat nå. Prøv igjen om litt.");
        return;
      }
      setError(null);
      setProfile(parsed);
      if (firstLoad.current) {
        firstLoad.current = false;
        // ORDER 157: hiring alerts with terms not yet accepted open their section on the first load.
        if (parsed.hiring && !parsed.hiring.terms.accepted && !addressChose.current) setFallback("ansetter");
        // ORDER 236: our e-mail only said a message is waiting, so a new one is what opens first.
        else if (unreadMessages(parsed) > 0 && !addressChose.current) setFallback("meldinger");
      }
    } catch {
      setError("Siden kunne ikke hentes akkurat nå. Prøv igjen om litt.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Go somewhere on the page: a new entry in the history (Back returns), or in place of the current one. */
  const navigate = useCallback((next: string, mode: "push" | "replace" = "push") => {
    const { pathname, search } = window.location;
    const url = `${pathname}${search}${next}`;
    if (mode === "push") window.history.pushState(window.history.state, "", url);
    else window.history.replaceState(window.history.state, "", url);
    setHash(next);
  }, []);

  // The address remembers the section, so a reload or a link from us opens the same one.
  useEffect(() => {
    const start = window.location.hash;
    if (sectionFromHash(start) || start === "#hjem") addressChose.current = true;
    // ORDER 273: ?nokkel=1 from the login link is read once and taken out of the address.
    keyAsked.current = keyPromptAsked(window.location.search);
    if (keyAsked.current) window.history.replaceState(window.history.state, "", `${window.location.pathname}${withoutKeyPrompt(window.location.search)}${start}`);
    // ORDER 157: "Prøv prosjektvarsler" in the weekly letter (?hiring=projects) opens the hiring section at the projects card.
    const hiringIntent = hiringIntentFromSearch(window.location.search);
    // ORDER 244: ?firm=<orgnr> (a letter's firm button, or a shared address) opens that firm's card; the address keeps it while open.
    const firm = firmFromSearch(window.location.search);
    let first = start;
    if (hiringIntent || firm) {
      // ORDER 220: ?hiring=agency (the weekly letter's second button) opens the tab "Via bemanningsbyrå".
      if (hiringIntent === "agency") setHiringAgencyTab(true);
      else if (hiringIntent === "projects") setHiringFocus(true);
      if (firm) setHiringFirm(firm);
      addressChose.current = true;
      first = "#ansetter";
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${firm ? `?firm=${firm}` : ""}#ansetter`);
    }
    // ORDER 100: a link from the weekly letter opens the staffing request (?plan=1) or the alerts (?alerts=1).
    const intent = intentFromSearch(window.location.search);
    if (intent) {
      addressChose.current = true;
      first = "#varsler";
      if (intent === "plan") setPlanPrefill("alerts");
      // Said once: a reload does not open the form again.
      window.history.replaceState(window.history.state, "", `${window.location.pathname}#varsler`);
    }
    setHash(first);
    // The browser's back and forward, and a link to another section, move the page too.
    const onMove = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onMove);
    window.addEventListener("popstate", onMove);
    return () => {
      window.removeEventListener("hashchange", onMove);
      window.removeEventListener("popstate", onMove);
    };
  }, []);

  const send = async (body: Record<string, unknown>): Promise<Saved> => {
    try {
      const res = await fetch(`/api/min-side/${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string; field?: string | null };
      // ORDER 171: a refusal may carry its words as `message` rather than `error`, and say ok: false.
      if (!res.ok || payload.ok === false) return { ok: false, message: payload.error ?? payload.message ?? "Noe gikk galt. Prøv igjen.", field: payload.field ?? null };
      await load();
      return { ok: true };
    } catch {
      return { ok: false, message: "Noe gikk galt. Prøv igjen.", field: null };
    }
  };

  /** A POST whose answer the page needs back (the lead card, the settings); the page is not reloaded. */
  const sendData = useCallback(
    async (body: Record<string, unknown>): Promise<Fetched> => {
      try {
        const res = await fetch(`/api/min-side/${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        const payload = (await res.json().catch(() => ({}))) as { error?: string; data?: unknown };
        if (!res.ok) return { ok: false, message: payload.error ?? "Noe gikk galt. Prøv igjen.", status: res.status };
        return { ok: true, data: payload.data ?? null };
      } catch {
        return { ok: false, message: "Noe gikk galt. Prøv igjen.", status: 0 };
      }
    },
    [token],
  );

  const hiring = profile?.hiring ?? null;
  const phoneHome = hash === "#hjem";
  const chosen: SectionKey = sectionFromHash(hash) ?? fallback;
  // A section the person cannot have (an old link to the hiring section) shows the firm.
  const section: SectionKey = chosen === "ansetter" && !hiring ? "firma" : chosen;
  const route: VarslerRoute = useMemo(() => varslerRoute(hash) ?? { view: "list" }, [hash]);
  // Whether the open project or settings level was pushed from the page below it in this visit: then going up is Back.
  const pushedProject = useRef(false);
  const pushedLevel = useRef(false);
  const goVarsler = useCallback(
    (next: VarslerRoute) => {
      if (next.view === "project") {
        setLastOpened(next.id);
        if (route.view === "list") {
          // Leaving the list: keep where it was scrolled.
          savedScroll.current = window.scrollY;
          pushedProject.current = true;
          navigate(varslerHash(next), "push");
        } else {
          // Forrige / Neste replace the entry, so Back goes to the list and not through every project.
          navigate(varslerHash(next), "replace");
        }
        return;
      }
      if (next.view === "list") {
        if (route.view === "project") setScrollBack(savedScroll.current);
        const back = route.view === "project" ? pushedProject : route.view === "settings" && !pushedLevel.current ? pushedProject : null;
        if (back?.current) {
          back.current = false;
          window.history.back();
          return;
        }
        navigate("#varsler", "replace");
        return;
      }
      // Settings: from the list, or one level down, is a new screen; one level up is Back when it was pushed.
      if (route.view === "list") {
        pushedProject.current = true;
        navigate(varslerHash(next), "push");
      } else if (route.view === "settings" && route.level && !next.level && pushedLevel.current) {
        pushedLevel.current = false;
        window.history.back();
      } else if (route.view === "settings" && !route.level && next.level) {
        pushedLevel.current = true;
        navigate(varslerHash(next), "push");
      } else navigate(varslerHash(next), "replace");
    },
    [navigate, route],
  );
  // Back from a project with the browser's own button: the list comes back at its scroll too.
  const prevView = useRef(route.view);
  useEffect(() => {
    if (prevView.current === "project" && route.view === "list" && scrollBack === null) setScrollBack(savedScroll.current);
    prevView.current = route.view;
  }, [route.view, scrollBack]);

  // ORDER 236: opening Meldinger marks what is there as read, once per visit.
  const unread = profile ? unreadMessages(profile) : 0;
  useEffect(() => {
    if (section !== "meldinger" || unread === 0 || readSent.current) return;
    readSent.current = true;
    void fetch(`/api/min-side/${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "message_read", all: true }) }).catch(() => undefined);
  }, [section, unread, token]);
  const trial = useProjectsTrial(hiring?.projects ?? null, send);

  // ORDER 157: the first time the hiring list is on screen after the terms, keep the old last_viewed_at for
  // "Bare nye siden sist", then tell the ATS it was seen. Once per visit.
  useEffect(() => {
    if (section !== "ansetter" || !hiring?.terms.accepted || viewedSent.current) return;
    viewedSent.current = true;
    setHiringSince(hiring.last_viewed_at);
    void sendData({ action: "hiring_viewed" });
  }, [section, hiring, sendData]);

  // ORDER 273: the key dialog, once, after a login from the e-mail on an access with no key. It claims the visit
  // before the install prompt can (app-prompt.ts ranks them), so only one window opens.
  useEffect(() => {
    if (!profile || !keyAsked.current) return;
    keyAsked.current = false;
    let shown: string | null = null;
    try {
      shown = window.sessionStorage.getItem(VISIT_POPUP_KEY);
    } catch {
      /* private window */
    }
    const open = decideKeyDialog({
      asked: true,
      hasPasskey: profile.security?.has_passkey ?? null,
      supported,
      dismissedUntil: profile.security?.prompt_dismissed_until ?? null,
      now: Date.now(),
      shownThisVisit: shown,
    });
    if (!open) return;
    try {
      window.sessionStorage.setItem(VISIT_POPUP_KEY, "key_dialog");
    } catch {
      /* it shows once all the same */
    }
    setKeyShown(true);
    setKeyDialog(true);
  }, [profile, supported]);

  const c = profile?.company ?? null;
  const words = alertsWords(profile?.alerts ?? null, profile?.free_alerts?.months ?? null);
  const [startingAlerts, setStartingAlerts] = useState(false);
  const startFreeAlerts = async () => {
    setStartingAlerts(true);
    const done = await send({ action: "start_free_alerts" });
    setStartingAlerts(false);
    if (!done.ok) setNotice(done.message);
  };
  const plan = profile?.alerts?.plan ?? null;
  const answerCityQuestion = async (answer: "yes" | "no") => {
    setAnswering(true);
    setQuestionError(null);
    const r = await send(cityQuestionRequest(answer));
    setAnswering(false);
    if (!r.ok) setQuestionError(r.message);
  };
  const prefill = planPrefill === "alerts" ? staffingPrefill(profile?.alerts ?? null) : planPrefill;

  // ORDER 273: one setting per change; the ATS answers the settings as they now stand, and the page keeps them.
  const saveSettings = async (part: Record<string, unknown>) => {
    const r = await sendData({ action: "alert_settings", ...part });
    if (!r.ok) return { ok: false as const, message: r.message };
    const settings = alertSettingsFrom((r.data as { settings?: unknown } | null)?.settings);
    if (settings) setProfile((p) => (p && p.alerts ? { ...p, alerts: { ...p.alerts, settings } } : p));
    return { ok: true as const };
  };

  const choose = (key: SectionKey) => {
    setNotice(null);
    navigate(`#${key}`, window.matchMedia(LG).matches ? "replace" : "push");
  };
  const backHome = () => navigate("#hjem", "push");
  // A swipe from the left edge on a phone goes back, as on an iPhone.
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = t && t.clientX < 28 ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    const t = e.changedTouches[0];
    if (!from || !t || window.matchMedia(LG).matches) return;
    if (t.clientX - from.x > 80 && Math.abs(t.clientY - from.y) < 60) window.history.back();
  };

  const logout = async () => {
    await fetch("/api/min-side/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/min-side");
  };

  const newCount = profile?.alerts ? profile.alerts.projects.filter((p) => isNew(p, profile.alerts?.last_sent_at ?? null)).length : 0;
  const ringTel = profile?.contact_person?.phone ? telHref(profile.contact_person.phone) : null;
  const sections = profile ? visibleSections(profile) : [];
  const hint = (key: SectionKey) => (profile ? (key === "innlogging" && keyCount !== null ? (keyCount ? "Passkey aktivert" : "Passkey ikke aktivert") : sectionHint(key, profile)) : "");

  const rail = (rows: typeof sections) =>
    rows.map((x) => {
      const on = x.key === section && !phoneHome;
      const meta = ICONS[x.key];
      const Icon = meta.icon;
      return (
        <button
          key={x.key}
          type="button"
          aria-current={on ? "page" : undefined}
          onClick={() => choose(x.key)}
          className={`${ROW_BUTTON} ${on ? "lg:bg-[#EAF0F8]" : ""}`}
          data-section={x.key}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]" style={{ background: meta.bg }} aria-hidden>
            <Icon className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className={`shrink-0 whitespace-nowrap ${BODY} ${NAVY} ${on ? "font-semibold" : ""}`}>{x.label}</span>
          {x.key === "varsler" && newCount > 0 ? (
            <span className="flex min-w-0 flex-1 justify-end">
              <span className={NEW_BADGE}>{newCount} nye</span>
            </span>
          ) : (
            <span className={`min-w-0 flex-1 truncate text-right ${SMALL} ${GREY}`}>{hint(x.key)}</span>
          )}
          <ChevronRight className="h-5 w-5 shrink-0 text-[#C7C7CC]" aria-hidden />
        </button>
      );
    });

  const header = (
    <header className="border-b border-[#E5E5EA] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[3.5rem] max-w-[1280px] items-center justify-between gap-3 px-4 md:px-6">
        <Link href={`/min-side/${encodeURIComponent(token)}`} className="flex min-h-[3rem] min-w-0 items-center gap-2.5" onClick={() => navigate("#varsler", "push")}>
          <Image src="/brand/arbeidmatch-a-emblem.png" alt="ArbeidMatch" width={32} height={32} className="shrink-0 object-contain" priority />
          <span className={`whitespace-nowrap text-[1.0625rem] font-bold ${NAVY}`}>Min side</span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          {ringTel ? (
            <a href={ringTel} className={`${PILL} px-3 md:px-4`} aria-label="Ring oss">
              <Phone className="h-5 w-5 md:h-4 md:w-4" aria-hidden />
              <span className="hidden md:inline">Ring oss</span>
            </a>
          ) : null}
          <button type="button" className={`${PILL} px-3 md:px-4`} onClick={() => void logout()} aria-label="Logg ut">
            <LogOut className="h-5 w-5 md:h-4 md:w-4" aria-hidden />
            <span className="hidden md:inline">Logg ut</span>
          </button>
          {profile ? (
            <button type="button" className={`${PILL_GREEN} hidden sm:inline-flex`} aria-haspopup="dialog" onClick={() => setPlanPrefill("alerts")}>
              Planlegg bemanning
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );

  const footer = (
    <footer className="border-t border-[#E5E5EA] bg-[#F2F2F7]">
      <div className={`mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6 ${SMALL} ${GREY}`}>
        <p>{FOOTER_LINE}</p>
        <p className="flex items-center gap-3">
          <SupportButton lang="nb" showIcon={false} className="inline-flex min-h-[3rem] items-center underline-offset-4 hover:underline md:min-h-[2rem]">
            Skriv til oss
          </SupportButton>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="inline-flex min-h-[3rem] items-center underline-offset-4 hover:underline md:min-h-[2rem]">
            Personvern
          </Link>
        </p>
      </div>
    </footer>
  );

  const subscription = profile?.alerts ? (
    <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4`}>
      <div className="min-w-0 flex-1 basis-[240px]">
        <p className={`font-semibold ${BODY} ${NAVY}`}>{words.title}</p>
        <p className={`${SMALL} ${GREY}`}>{words.text}</p>
      </div>
      {plan?.offer_url ? (
        <a href={plan.offer_url} className={PILL}>
          {plan.status === "ended" || plan.freeOnly ? "Se avtalen" : plan.cancelled ? "Angre oppsigelsen" : "Abonnementet"}
        </a>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={`${PAGE_BG} ${NAVY} -mb-[40px] flex min-h-screen flex-col`} lang="nb">
      {header}
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-5 px-4 pb-16 pt-5 md:px-6 lg:pt-8">
        {loading && !profile ? <p className={`${BODY} ${GREY}`}>Henter siden ...</p> : null}
        {error ? (
          <div className={`${CARD} flex flex-col gap-4 p-6 ${BODY}`}>
            <p>{error}</p>
            <p>
              <Link href="#logg-inn" className={PILL} aria-haspopup="dialog">
                Logg inn på nytt
              </Link>
            </p>
          </div>
        ) : null}

        {profile && c ? (
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            {/* The grouped list: the left pane on a computer, the home screen on a phone. */}
            <div className={`flex min-w-0 flex-col gap-6 ${phoneHome ? "" : "hidden lg:flex"}`}>
              <nav aria-label="Deler av Min side" className="flex flex-col gap-6">
                <div className={`${CARD} flex items-center gap-3 p-4`}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1B2B44] text-[1.0625rem] font-bold text-white" aria-hidden>
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0">
                    <p className={`overflow-hidden text-ellipsis whitespace-nowrap font-semibold ${BODY} ${NAVY}`} title={c.name}>
                      {c.name}
                    </p>
                    <p className={`truncate ${SMALL} ${GREY}`}>{profile.me.email}</p>
                  </div>
                </div>
                <button type="button" className={`${PILL_GREEN} w-full sm:hidden`} aria-haspopup="dialog" onClick={() => setPlanPrefill("alerts")}>
                  Planlegg bemanning
                </button>
                {SECTION_GROUPS.map((g) => {
                  const inGroup = sections.filter((x) => x.group === g.key);
                  const common = inGroup.filter((x) => !x.rare);
                  return (
                    <div key={g.key} className="flex flex-col">
                      <p className={GROUP_HEAD}>{g.label}</p>
                      {/* A computer lists them all; a phone keeps the rarely used ones under "Mer". */}
                      <div className={`${GROUP} hidden lg:block`}>{rail(inGroup)}</div>
                      <div className={`${GROUP} lg:hidden`}>{rail(common)}</div>
                    </div>
                  );
                })}
                <div className="flex flex-col lg:hidden">
                  <p className={GROUP_HEAD}>Mer</p>
                  <div className={GROUP}>{rail(sections.filter((x) => x.rare))}</div>
                </div>
              </nav>
              <MinSideContactCard person={profile.contact_person} />
            </div>

            <div className={`flex min-w-0 flex-col gap-4 ${phoneHome ? "hidden lg:flex" : ""}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {/* The phone's way back to the list, at the top of every screen except a project's own. */}
              {!(section === "varsler" && route.view !== "list") ? (
                <button type="button" onClick={backHome} className={`inline-flex min-h-[3.25rem] items-center gap-1 self-start font-semibold lg:hidden ${BODY} ${NAVY}`}>
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                  Min side
                </button>
              ) : null}
              {/* ORDER 101: What's new is a small notice above the section, never a window over the list. */}
              {profile.whats_new.length ? (
                <MinSideWhatsNew
                  entries={profile.whats_new}
                  onTick={async (id, tried) => {
                    await send({ action: "whats_new", id, tried });
                  }}
                />
              ) : null}
              {notice ? (
                <div className={`${CARD} border-l-[3px] border-l-[#2E9E6B] p-4 ${BODY}`} role="status">
                  {notice}
                </div>
              ) : null}

              {section === "firma" ? (
                <Screen section="firma">
                  <FirmaRows company={c} send={send} sendData={sendData} />
                </Screen>
              ) : null}

              {section === "fakturaopplysninger" ? (
                <Screen section="fakturaopplysninger">
                  <FakturaRows company={c} send={send} />
                </Screen>
              ) : null}

              {section === "kontakter" ? (
                <Screen
                  section="kontakter"
                  action={
                    <button type="button" className={PILL} aria-haspopup="dialog" onClick={() => setEditContact("new")}>
                      Legg til
                    </button>
                  }
                >
                  <KontaktRows contacts={profile.contacts} send={send} onRemove={setAskRemove} />
                </Screen>
              ) : null}

              {section === "innlogging" ? (
                <Screen section="innlogging">
                  {/* ORDER 228, moved here by ORDER 273: a passkey of this device instead of the e-mail link. */}
                  <MinSidePasskeys token={token} onCount={setKeyCount} />
                  {/* ORDER 157: the person asks us to close their login; the firm's papers stay. */}
                  <div className={GROUP}>
                    <button type="button" className={`${ROW_BUTTON} justify-center font-semibold ${BODY} ${DANGER}`} aria-haspopup="dialog" onClick={() => setAskClose(true)}>
                      Lukk kontoen
                    </button>
                  </div>
                </Screen>
              ) : null}

              {section === "varsler" ? (
                showsProjectsTeaser(profile) && profile.hiring?.projects ? (
                  // ORDER 157: no project alerts, but hiring alerts: the real list as a teaser instead of the empty state.
                  <Screen section="varsler">
                    <ProjectsTeaser projects={profile.hiring.projects} trades={profile.hiring.subscription.trades} trial={trial} />
                  </Screen>
                ) : profile.alerts?.projects_url ? (
                  <>
                    {route.view === "list" ? <MinSideCityQuestion question={profile.alerts.city_question} busy={answering} error={questionError} onAnswer={(a) => void answerCityQuestion(a)} /> : null}
                    <MinSideAlerts
                      token={token}
                      alerts={profile.alerts}
                      route={route}
                      go={goVarsler}
                      list={list}
                      setList={setList}
                      lastOpened={lastOpened}
                      scrollBack={scrollBack}
                      onScrolledBack={() => setScrollBack(null)}
                      onPlan={(p) => setPlanPrefill(projectPrefill(p, profile.alerts))}
                      saveSettings={saveSettings}
                      stopAlerts={() => send({ action: "alert_stop" })}
                      onStopped={() => {
                        setNotice("Prosjektvarslene er stoppet.");
                        navigate("#varsler", "replace");
                      }}
                      footer={subscription}
                    />
                  </>
                ) : (
                  <Screen section="varsler" about={words.text}>
                    <div className={`${CARD} flex flex-col gap-3 p-5`}>
                      <p className={`font-semibold ${BODY} ${NAVY}`}>{words.title}</p>
                      <p className="flex flex-wrap gap-2">
                        {!profile.alerts && profile.free_alerts ? (
                          <button type="button" className={PILL} disabled={startingAlerts} onClick={startFreeAlerts}>
                            {startingAlerts ? "Slår på ..." : "Slå på gratis varsler"}
                          </button>
                        ) : null}
                        <Link href="/prosjekter" className={PILL}>
                          Se prosjektkartet
                        </Link>
                        {plan?.offer_url ? (
                          <a href={plan.offer_url} className={PILL}>
                            {plan.status === "ended" || plan.freeOnly ? "Se avtalen" : plan.cancelled ? "Angre oppsigelsen" : "Abonnementet"}
                          </a>
                        ) : null}
                      </p>
                    </div>
                  </Screen>
                )
              ) : null}

              {section === "tilbud" ? (
                <Screen section="tilbud">
                  <ListCard
                    empty="Dere har ingen tilbud fra oss."
                    items={profile.offers.map((o) => ({
                      key: o.number,
                      title: (
                        <>
                          {o.title} <span className="tabular-nums">{o.number}</span>
                        </>
                      ),
                      line: [o.state, o.sent_at ? `sendt ${dayNo(o.sent_at)}` : null].filter(Boolean).join(" · "),
                      link: o.url ? { href: o.url, label: o.open ? "Åpne og svar" : "Åpne" } : null,
                    }))}
                  />
                </Screen>
              ) : null}

              {section === "meldinger" ? (
                <Screen section="meldinger">
                  {profile.messages.length === 0 ? <p className={`${CARD} p-5 ${BODY} ${GREY}`}>Du har ingen meldinger fra oss ennå.</p> : null}
                  <ul className="flex flex-col gap-3">
                    {profile.messages.map((m) => (
                      <li key={m.id} id={`melding-${m.id}`} className={`${CARD} flex flex-col gap-2 p-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className={`min-w-0 break-words font-semibold ${BODY} ${NAVY}`}>{m.subject}</p>
                          {!m.read_at ? <span className="rounded-full bg-[#F3E9CF] px-2 py-0.5 text-[0.8125rem] font-bold text-[#1B2B44]">Ny</span> : null}
                        </div>
                        <p className={`${SMALL} ${GREY}`}>{dayNo(m.created_at)}</p>
                        {m.text ? <p className={`whitespace-pre-line break-words ${BODY} ${NAVY}`}>{m.text}</p> : null}
                        {m.links.length ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {m.links.map((l) => (
                              <a key={l.href} href={l.href} className={PILL}>
                                {l.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Screen>
              ) : null}

              {section === "kandidater" ? (
                <Screen section="kandidater">
                  <ListCard
                    empty="Ingen kandidater er presentert for deg ennå."
                    items={profile.candidates.map((k, i) => ({
                      key: `${k.title}-${i}`,
                      title: k.title,
                      line: [k.state, k.sent_at ? `sendt ${dayNo(k.sent_at)}` : null].filter(Boolean).join(" · "),
                      link: k.url ? { href: k.url, label: "Se kandidatene" } : null,
                    }))}
                  />
                </Screen>
              ) : null}

              {section === "timelister" ? (
                <Screen section="timelister">
                  <p className={GROUP_HEAD}>Venter på din signatur</p>
                  <ListCard
                    empty="Ingen timelister venter på deg."
                    items={profile.timesheets.waiting.map((t, i) => ({
                      key: `${t.title}-${i}`,
                      title: t.title,
                      line: ["Venter på signatur", t.sent_at ? `sendt ${dayNo(t.sent_at)}` : null].filter(Boolean).join(" · "),
                      link: t.url ? { href: t.url, label: "Åpne og signer" } : null,
                    }))}
                  />
                  <p className={GROUP_HEAD}>Signert</p>
                  <ListCard
                    empty="Du har ikke signert noen timelister ennå."
                    items={profile.timesheets.signed.map((d, i) => ({
                      key: `${d.title}-${i}`,
                      title: d.title,
                      line: d.signed_at ? `Signert ${dayNo(d.signed_at)}` : "Signert",
                      link: d.pdf_url ? { href: d.pdf_url, label: "Last ned PDF" } : null,
                    }))}
                  />
                </Screen>
              ) : null}

              {section === "fakturaer" ? (
                <Screen section="fakturaer">
                  {!profile.invoices.allowed ? (
                    <p className={`${CARD} p-5 ${BODY} ${GREY}`}>Fakturaene vises for den som logger inn med firmaets faktura-e-post eller firmaets egen e-postadresse.</p>
                  ) : (
                    <ListCard
                      empty="Vi har ikke sendt dere noen fakturaer ennå."
                      items={profile.invoices.rows.map((inv) => ({
                        key: String(inv.id),
                        title: (
                          <>
                            Faktura <span className="tabular-nums">{inv.number || inv.id}</span> · <span className="tabular-nums">{kronerNo(inv.amount)}</span>
                          </>
                        ),
                        line: (
                          <>
                            <span className={inv.state_key === "overdue" ? "font-semibold text-[#C4231A]" : inv.state_key === "open" ? `font-semibold ${NAVY}` : ""}>{inv.state}</span>
                            {inv.date ? ` · datert ${dayNo(inv.date)}` : ""}
                            {inv.due && (inv.state_key === "open" || inv.state_key === "overdue") ? ` · forfall ${dayNo(inv.due)}` : ""}
                          </>
                        ),
                        link: profile.invoices.pdf_requires_sign_in ? null : { href: `/api/min-side/${encodeURIComponent(token)}/invoice/${inv.id}`, label: "Last ned PDF" },
                      }))}
                    />
                  )}
                  {profile.invoices.allowed ? (
                    <p className={`px-4 ${SMALL} ${GREY}`}>
                      Beløpene er med merverdiavgift.{profile.invoices.pdf_requires_sign_in && profile.invoices.rows.length ? " Trenger dere en kopi av en faktura, ta kontakt med oss." : ""}
                    </p>
                  ) : null}
                </Screen>
              ) : null}

              {section === "ansetter" && hiring ? (
                <Screen
                  section="ansetter"
                  about={hiringSubtitle(hiring) || undefined}
                  action={hiring.terms.accepted ? <HiringStop send={send} onStopped={() => setNotice("Varslene om bedrifter som ansetter er stoppet.")} /> : undefined}
                >
                  <MinSideHiring
                    token={token}
                    hiring={hiring}
                    since={hiringSince === undefined ? hiring.last_viewed_at : hiringSince}
                    send={send}
                    sendData={sendData}
                    trial={trial}
                    focusProjects={hiringFocus}
                    openAgencyTab={hiringAgencyTab}
                    openFirm={hiringFirm}
                    onAskPeople={() => setPlanPrefill({ trade: hiring.subscription.trades.slice(0, 3).join(", "), place: hiring.subscription.counties.slice(0, 3).join(", ") })}
                  />
                </Screen>
              ) : null}

              {section === "dokumenter" ? (
                <Screen section="dokumenter">
                  <ListCard
                    empty="Dere har ingen signerte dokumenter hos oss ennå."
                    items={profile.documents.map((d, i) => ({
                      key: `${d.title}-${i}`,
                      title: d.title,
                      line: d.signed_at ? `Signert ${dayNo(d.signed_at)}` : "Signert",
                      link: d.pdf_url ? { href: d.pdf_url, label: "Last ned PDF" } : null,
                    }))}
                  />
                </Screen>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {footer}

      {editContact ? (
        <PortalModal title={editContact === "new" ? "Legg til kontaktperson" : "Endre dine opplysninger"} size="narrow" onClose={() => setEditContact(null)}>
          <ContactForm
            contact={editContact === "new" ? null : editContact}
            onCancel={() => setEditContact(null)}
            onSave={async (details) => {
              const r = await send(editContact === "new" ? { action: "contact", details } : { action: "contact", id: editContact.id, details });
              if (r.ok) {
                setNotice(editContact === "new" ? "Kontaktpersonen er lagt til." : "Opplysningene er lagret.");
                setEditContact(null);
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}

      {/* ORDER 100, and "Planlegg bemanning" everywhere in Min side since ORDER 273: one form, prefilled by where it was pressed. */}
      {prefill && profile ? (
        <PortalModal title="Planlegg bemanning med oss" onClose={() => setPlanPrefill(null)}>
          <StaffingForm
            prefill={prefill}
            onCancel={() => setPlanPrefill(null)}
            onSend={async (request) => {
              const r = await send({ action: "staffing_request", ...request });
              if (r.ok) {
                setPlanPrefill(null);
                setNotice(PLAN_CONFIRMATION);
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}

      {trial.dialog}

      {keyDialog ? (
        <MinSideKeyDialog
          token={token}
          onLater={() => void sendData({ action: "passkey_prompt_dismiss" })}
          onDone={(saved) => {
            setKeyDialog(false);
            if (saved) setKeyCount((n) => Math.max(1, n ?? 0));
            // Afterwards straight to the projects, or the project the link was for.
            if (varslerRoute(window.location.hash)?.view !== "project") navigate("#varsler", "replace");
          }}
        />
      ) : null}

      {/* ORDER 272: the Forsprang app, offered once per visit on a phone that has not got it; never over the key dialog. */}
      {profile && !keyDialog && !keyShown ? <MinSideAppPrompt app={profile.app} onLater={() => void send({ action: "app_prompt_later" })} /> : null}

      {askClose ? (
        <PortalModal title="Lukk kontoen" size="narrow" onClose={() => setAskClose(false)}>
          <ConfirmForm
            text="Bare innloggingen deres lukkes. Firmaets dokumenter, timelister, tilbud og fakturaer blir liggende hos oss."
            label="Send"
            onCancel={() => setAskClose(false)}
            onConfirm={async () => {
              const r = await send({ action: "close_account" });
              if (r.ok) {
                setAskClose(false);
                setNotice("Vi har fått forespørselen og lukker innloggingen når den er behandlet.");
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}

      {askRemove ? (
        <PortalModal title="Be om fjerning" size="narrow" onClose={() => setAskRemove(null)}>
          <RemoveForm
            name={askRemove.full_name}
            onCancel={() => setAskRemove(null)}
            onConfirm={async () => {
              const r = await send({ action: "remove_contact", id: askRemove.id });
              if (r.ok) {
                setAskRemove(null);
                setNotice("Vi har fått beskjed og fjerner kontaktpersonen.");
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}
    </div>
  );
}

function Buttons({ busy, label, onCancel }: { busy: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      <button type="submit" className={PRIMARY} disabled={busy}>
        {busy ? "Lagrer ..." : label}
      </button>
      <button type="button" className={SECONDARY} disabled={busy} onClick={onCancel}>
        Avbryt
      </button>
    </div>
  );
}

type Failed = { message: string; field: string | null } | null;

function FormError({ failed }: { failed: Failed }) {
  return failed && !failed.field ? (
    <p role="alert" className="text-sm text-[#FF9B9B]">
      {failed.message}
    </p>
  ) : null;
}

function ContactForm({ contact, onSave, onCancel }: { contact: Contact | null; onSave: (details: Record<string, string>) => Promise<Saved>; onCancel: () => void }) {
  const [v, setV] = useState({ full_name: contact?.full_name ?? "", role: contact?.role ?? "", phone: contact?.phone ?? "", email: "" });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Failed>(null);
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    const r = await onSave(contact ? { full_name: v.full_name, role: v.role, phone: v.phone } : v);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="ms-k-name" label="Navn" error={errorFor("full_name")}>
        <input id="ms-k-name" data-autofocus className={FIELD} value={v.full_name} maxLength={120} autoComplete="name" onChange={(e) => setV({ ...v, full_name: e.target.value })} required />
      </Field>
      <Field id="ms-k-role" label="Rolle">
        <input id="ms-k-role" className={FIELD} value={v.role} maxLength={80} autoComplete="organization-title" onChange={(e) => setV({ ...v, role: e.target.value })} />
      </Field>
      {contact ? (
        <p className={`text-sm ${MUTED}`}>E-postadressen {contact.email} er den dere logger inn med. Ta kontakt med oss for å endre den.</p>
      ) : (
        <Field id="ms-k-email" label="E-post" error={errorFor("email")}>
          <input id="ms-k-email" className={FIELD} type="email" value={v.email} maxLength={254} autoComplete="email" onChange={(e) => setV({ ...v, email: e.target.value })} required />
        </Field>
      )}
      <Field id="ms-k-phone" label="Telefon" error={errorFor("phone")}>
        <input id="ms-k-phone" className={FIELD} type="tel" value={v.phone} maxLength={24} autoComplete="tel" onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </Field>
      <FormError failed={failed} />
      <Buttons busy={busy} label={contact ? "Lagre" : "Legg til"} onCancel={onCancel} />
    </form>
  );
}

function RemoveForm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => Promise<Saved>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    const r = await onConfirm();
    if (!r.ok) setFailed(r.message);
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-white">
        Vi får beskjed om at {name} ikke lenger skal stå som kontaktperson, og fjerner oppføringen. Dokumenter som er signert, blir stående.
      </p>
      {failed ? (
        <p role="alert" className="text-sm text-[#FF9B9B]">
          {failed}
        </p>
      ) : null}
      <Buttons busy={busy} label="Send forespørselen" onCancel={onCancel} />
    </form>
  );
}

const DURATIONS = ["Under 1 måned", "1-3 måneder", "3-6 måneder", "Mer enn 6 måneder", "Vet ikke ennå"];

/** Today in Norway, YYYY-MM-DD, for the earliest date the form offers. */
function osloToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * "Planlegg bemanning med oss" (ORDER 100, 13 October 2026): trade, how many,
 * from when, for how long, where, and a note. The trade and the place open
 * with the alerts' own choices, or the project's. The ATS checks every field
 * and files it as a client request.
 */
function StaffingForm({ prefill, onSend, onCancel }: { prefill: StaffingPrefill; onSend: (request: Record<string, string>) => Promise<Saved>; onCancel: () => void }) {
  const [v, setV] = useState({ trade: prefill.trade, count: "", from: "", duration: "", place: prefill.place, note: prefill.note ?? "" });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Failed>(null);
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    const r = await onSend(v);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <Field id="ms-p-trade" label="Fag" error={errorFor("trade")}>
          <input id="ms-p-trade" data-autofocus className={FIELD} value={v.trade} maxLength={120} placeholder="For eksempel tømrer" onChange={(e) => setV({ ...v, trade: e.target.value })} required />
        </Field>
        <Field id="ms-p-count" label="Antall" error={errorFor("count")}>
          <input id="ms-p-count" className={FIELD} type="number" inputMode="numeric" min={1} max={500} step={1} value={v.count} onChange={(e) => setV({ ...v, count: e.target.value })} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ms-p-from" label="Fra dato" error={errorFor("from")}>
          <input id="ms-p-from" className={FIELD} type="date" min={osloToday()} value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} />
        </Field>
        <Field id="ms-p-duration" label="Varighet">
          <select id="ms-p-duration" className={FIELD} value={v.duration} onChange={(e) => setV({ ...v, duration: e.target.value })}>
            <option value="">Velg</option>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="ms-p-place" label="Sted">
        <input id="ms-p-place" className={FIELD} value={v.place} maxLength={120} placeholder="By eller fylke" onChange={(e) => setV({ ...v, place: e.target.value })} />
      </Field>
      <Field id="ms-p-note" label="Merknad (valgfritt)">
        <textarea id="ms-p-note" className={`${FIELD} min-h-[96px] py-2`} value={v.note} maxLength={1000} onChange={(e) => setV({ ...v, note: e.target.value })} />
      </Field>
      <FormError failed={failed} />
      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" className={PILL_GREEN} disabled={busy}>
          {busy ? "Sender ..." : "Send forespørselen"}
        </button>
        <button type="button" className={SECONDARY} disabled={busy} onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  );
}
