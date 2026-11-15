"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import PayAndConditions from "@/components/rask-foresporsel/PayAndConditions";
import { contactProblem, townName } from "@/components/rask-foresporsel/ContactStep";
import {
  COUNTIES,
  ELSEWHERE_IN_COUNTY,
  EMPTY_ANSWERS,
  OTHER_ROLE,
  PICK_DATE,
  ROLES_BY_TRADE,
  TRADES,
  WHEN_OPTIONS,
  chosenRoles,
  placeLine,
  tradeOf,
  whenLine,
  type RaskAnswers,
} from "@/components/rask-foresporsel/data";
import { buildRaskPayload, otpContext } from "@/components/rask-foresporsel/payload";
import { todayIso } from "@/components/rask-foresporsel/WhenStep";
import { Icon } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";
import { formatOrgNumber } from "@/lib/orgNumber";
import {
  ANSWER_MODE_STORAGE_KEY,
  checkPayConditions,
  fetchPayFloors,
  formatKroner,
  payFieldErrors,
  selectPayFloor,
  toggleBenefit,
  type PayFloorRow,
  type TradeKey,
} from "@/lib/pay-conditions";

import { COMPANY_KIND_LABEL_NB, companyKind } from "./companyKind";
import { ConsentSwitch, Done, Group, Hint, InputRow, LinkRow, NavRow, OptionRow, StepperRow } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";

/**
 * "Be om kandidater" (ORDER 295, stage 2): the request as one sheet, in the
 * mockup's pattern. The company comes first, found in the register by name or
 * org.nr., and the register says whether it is a staffing agency or a firm
 * hiring for itself. Then the trade, several roles each with its own number of
 * people (a role not in the list is typed by hand), the start, the place, pay
 * and conditions, the work e-mail and the two confirmations.
 *
 * What it sends, and how, is the quick request of ORDER 224 unchanged: the
 * code to the e-mail through /api/request-otp, the check through
 * /api/verify-request-otp, the save through /api/save-employer-request with
 * sourceVariant "rask". The detailed request (every trade question) stays at
 * /request, one row away, as the popup's "Kandidat på detaljer" always was.
 */

const STORE = "am-request-sheet-v1";

/** The trades in the order the sheet lists them: health care last (the owner, 14 November 2026). */
export const SHEET_TRADES = [...TRADES.filter((t) => t.key !== "helse"), ...TRADES.filter((t) => t.key === "helse")];

type Answers = RaskAnswers & { roleCounts: Record<string, number> };
type Sub = "company" | "trade" | "roles" | "when" | "county" | "town" | "pay" | null;
type Phase = "rows" | "code" | "done";

const EMPTY: Answers = { ...EMPTY_ANSWERS, answerMode: "rolle", roleCounts: {} };

function readStore(): Answers {
  try {
    const raw = window.sessionStorage.getItem(STORE);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Answers>;
    return { ...EMPTY, ...parsed, answerMode: "rolle", roleCounts: { ...(parsed.roleCounts ?? {}) } };
  } catch {
    return EMPTY;
  }
}

function clearStore() {
  try {
    window.sessionStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
}

/** How many people in all: the sum of every role's number. */
export function totalPeople(a: Pick<Answers, "roleCounts"> & RaskAnswers): number {
  return chosenRoles(a).reduce((sum, r) => sum + Math.max(1, a.roleCounts[r] ?? 1), 0);
}

/** The roles with their numbers, e.g. "2 murer, 1 tømrer"; "CNC-operatør" keeps its capitals. */
export function rolesLine(a: Pick<Answers, "roleCounts"> & RaskAnswers): string {
  return chosenRoles(a)
    .map((r) => `${Math.max(1, a.roleCounts[r] ?? 1)} ${/^\p{Lu}\p{Ll}/u.test(r) ? r.charAt(0).toLowerCase() + r.slice(1) : r}`)
    .join(", ");
}

/** What is still missing, in the order the rows stand; null when the request can go. */
export function requestProblem(a: Answers, floor: number | null): string | null {
  if (!a.company) return "Velg firmaet fra Brønnøysundregistrene.";
  if (!a.trade) return "Velg bransje.";
  if (chosenRoles(a).length === 0) return "Legg til minst én rolle.";
  if (!whenLine(a) || (a.when === PICK_DATE && a.date < todayIso())) return "Velg når dere trenger folk.";
  if (!a.county || !a.town) return "Velg hvor arbeidet er.";
  const fieldErrors = payFieldErrors({ from: a.payFrom, to: a.payTo, floor });
  const pay = checkPayConditions({
    answerMode: "rolle",
    equalTreatmentConfirmed: a.equalTreatment,
    payFrom: a.payFrom,
    payTo: a.payTo.trim() ? a.payTo : a.payFrom,
    payFloorAtSubmit: floor,
  });
  if (pay || fieldErrors.from || fieldErrors.to) return pay ?? "Sjekk lønn og vilkår.";
  return contactProblem(a);
}

type Company = NonNullable<RaskAnswers["company"]> & { industryCode?: string };

/** The company in the main panel: the row that opens the register search, and once chosen what the register says. */
function CompanyMain({ a, onOpen }: { a: Answers; onOpen: () => void }) {
  const chosen = a.company as Company | null;
  const kind = companyKind(chosen);
  return (
    <Group>
      <NavRow icon="brief" label="Bedrift" value={chosen ? chosen.name : "Søk i registeret"} onClick={onOpen} />
      {chosen && kind !== "manual" ? (
        <div className="row info">
          <span className="ri alt">
            <Icon name="check" />
          </span>
          <span className="rl2">
            <b>{COMPANY_KIND_LABEL_NB[kind]}</b>
            <small>
              Org.nr. {formatOrgNumber(chosen.orgNumber)}
              {chosen.city ? ` · ${townName(chosen.city)}` : ""}
            </small>
          </span>
          <span className="src">Brønnøysund</span>
        </div>
      ) : null}
    </Group>
  );
}

/**
 * The register search, in the company's sub-panel: by name, or by number when
 * it is nine digits. Not found offers the same ways on as the popup always did
 * (his rule R133, 8 October 2026: never a free-text employer).
 */
function CompanySearch({ a, update, onPicked, onForeign }: { a: Answers; update: (p: Partial<Answers>) => void; onPicked: () => void; onForeign: () => void }) {
  const [hits, setHits] = useState<Company[] | null>(null);
  const [lookup, setLookup] = useState<"idle" | "loading" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const query = a.companyQuery;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      setLookup("idle");
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLookup("loading");
      try {
        const res = await fetch(`/api/brreg/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = (await res.json().catch(() => ({}))) as { companies?: Company[] };
        if (!res.ok && !Array.isArray(body.companies)) throw new Error("brreg");
        setHits(Array.isArray(body.companies) ? body.companies.filter((c) => c.name && c.orgNumber) : []);
        setLookup(res.ok ? "idle" : "error");
      } catch {
        if (!ctrl.signal.aborted) {
          setHits([]);
          setLookup("error");
        }
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const notFound = hits !== null && hits.length === 0 && query.trim().length >= 2 && lookup === "idle";
  return (
    <>
      <Group>
        <InputRow
          ref={inputRef}
          id="am-req-company"
          icon="search"
          label="Søk"
          placeholder="Firmanavn eller org.nr."
          autoComplete="organization"
          maxLength={100}
          value={query}
          onChange={(e) => update({ companyQuery: e.target.value })}
          aria-controls="am-req-hits"
        />
      </Group>
      {hits && hits.length ? (
        <Group>
          <div id="am-req-hits" aria-label="Treff i Brønnøysundregistrene">
            {hits.map((c) => (
              <button
                key={c.orgNumber}
                type="button"
                className="row opt"
                onClick={() => {
                  update({ company: c });
                  onPicked();
                }}
              >
                <span className="rl2">
                  <b>{c.name}</b>
                  <small>
                    Org.nr. {formatOrgNumber(c.orgNumber)}
                    {c.city ? ` · ${townName(c.city)}` : ""}
                  </small>
                </span>
                <Icon name="chev" />
              </button>
            ))}
          </div>
        </Group>
      ) : null}
      {lookup === "loading" ? <Hint>Søker i Brønnøysundregistrene ...</Hint> : null}
      {lookup === "error" ? <Hint>Søket svarer ikke akkurat nå. Prøv igjen om litt.</Hint> : null}
      {notFound ? (
        <Group label="Ingen treff. Hva passer?">
          <NavRow
            icon="search"
            label="Søk på org.nr."
            onClick={() => {
              update({ companyQuery: "" });
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          />
          <NavRow icon="building" label="Utenlandsk firma" onClick={onForeign} />
          <LinkRow href={SITE_PATHS.candidates} icon="user" label="Jeg er jobbsøker" />
        </Group>
      ) : null}
      <Hint>
        {notFound
          ? "Vi tar bare imot forespørsler fra firma i Brønnøysundregistrene."
          : "Vi henter navn, org.nr. og næring fra Brønnøysundregistrene, så forespørselen havner riktig."}
      </Hint>
    </>
  );
}

/** Adding a role: the trade's list, filtered as the visitor types, or the role typed by hand. */
function RolesPanel({ a, update, onAdded }: { a: Answers; update: (p: Partial<Answers>) => void; onAdded: () => void }) {
  const [q, setQ] = useState("");
  const listed = a.trade ? ROLES_BY_TRADE[a.trade as TradeKey] : [];
  const term = q.trim().toLowerCase();
  const shown = listed.filter((r) => !a.roles.includes(r) && (!term || r.toLowerCase().includes(term)));
  const typed = q.trim().replace(/\s+/g, " ").slice(0, 80);
  const canType = typed.length >= 2 && !listed.some((r) => r.toLowerCase() === typed.toLowerCase());

  return (
    <>
      <Group>
        <InputRow id="am-req-role" icon="search" label="Rolle" placeholder="Søk, eller skriv en annen rolle" maxLength={80} value={q} onChange={(e) => setQ(e.target.value)} />
      </Group>
      {shown.length || canType ? (
        <Group>
          {shown.map((r) => (
            <OptionRow
              key={r}
              label={r}
              chosen={false}
              onPick={() => {
                update({ roles: [...a.roles, r], roleCounts: { ...a.roleCounts, [r]: a.roleCounts[r] ?? 1 } });
                onAdded();
              }}
            />
          ))}
          {canType ? (
            <OptionRow
              label={`${OTHER_ROLE}: «${typed}»`}
              chosen={false}
              onPick={() => {
                const counts = { ...a.roleCounts };
                if (a.otherRoleChosen && a.otherRole.trim()) delete counts[a.otherRole.trim()];
                update({ otherRoleChosen: true, otherRole: typed, roleCounts: { ...counts, [typed]: 1 } });
                onAdded();
              }}
            />
          ) : null}
        </Group>
      ) : null}
      <Hint>Finner dere ikke rollen? Skriv den inn. Vi finner fagfolk også utenfor listen.</Hint>
    </>
  );
}

export function RequestSheet({ open, close, preset, openSheet }: SheetProps) {
  const router = useRouter();
  const [a, setA] = useState<Answers>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [sub, setSub] = useState<Sub>(null);
  const [phase, setPhase] = useState<Phase>("rows");
  const [floors, setFloors] = useState<PayFloorRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  const update = useCallback((patch: Partial<Answers>) => setA((s) => ({ ...s, ...patch })), []);

  // The answers kept from an earlier opening, then what the button that opened the sheet chose.
  useEffect(() => {
    const stored = readStore();
    const trade = SHEET_TRADES.find((t) => t.key === preset.trade)?.key;
    let next = stored;
    if (trade && trade !== stored.trade) next = { ...next, trade, roles: [], otherRoleChosen: false, otherRole: "", roleCounts: {} };
    const role = preset.role && next.trade ? ROLES_BY_TRADE[next.trade as TradeKey].find((r) => r === preset.role) : undefined;
    if (role && !next.roles.includes(role)) next = { ...next, roles: [...next.roles, role], roleCounts: { ...next.roleCounts, [role]: 1 } };
    setA(next);
    setHydrated(true);
  }, [preset.trade, preset.role]);

  useEffect(() => {
    if (!hydrated || phase === "done") return;
    try {
      window.sessionStorage.setItem(STORE, JSON.stringify(a));
    } catch {
      /* private mode: the answers live as long as the sheet */
    }
  }, [a, hydrated, phase]);

  // The floor RecOS holds for the trade; any failure is no floor.
  useEffect(() => {
    if (!a.trade) {
      setFloors([]);
      return;
    }
    let cancelled = false;
    void fetchPayFloors(a.trade).then((rows) => {
      if (!cancelled) setFloors(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [a.trade]);

  const roles = chosenRoles(a);
  const floor = selectPayFloor(floors, roles);

  // Fra starts at the floor, until the client changes it himself (as the popup does).
  useEffect(() => {
    if (!hydrated || a.payFromTouched) return;
    const next = floor !== null ? formatKroner(floor) : "";
    if (a.payFrom !== next) update({ payFrom: next });
  }, [floor, hydrated, a.payFromTouched, a.payFrom, update]);

  /** The request as the route takes it: the total as the number, each role's number in the summary. */
  const payloadAnswers = useMemo<RaskAnswers>(() => ({ ...a, answerMode: "rolle", count: String(totalPeople(a)) }), [a]);
  const payload = (token: string) => {
    const body = buildRaskPayload(payloadAnswers, token, floor);
    const pay = a.payFrom.trim() ? `${a.payFrom.trim()}${a.payTo.trim() && a.payTo.trim() !== a.payFrom.trim() ? `-${a.payTo.trim()}` : ""} kr/t` : "";
    const summary = [rolesLine(a), placeLine(a), whenLine(a).toLowerCase(), pay].filter(Boolean).join(", ");
    return { ...body, job_summary: summary.slice(0, 1000) };
  };

  const sendCode = async () => {
    const email = a.email.trim().toLowerCase();
    const response = await fetch("/api/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, flow: "new_company", gdprConsent: true, ...otpContext(payloadAnswers) }),
    });
    const data = (await response.json().catch(() => null)) as { success?: boolean; verificationId?: string; error?: string } | null;
    if (!response.ok || !data?.success || !data.verificationId) throw new Error(data?.error || "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    setVerificationId(data.verificationId);
  };

  const problem = requestProblem(a, floor);

  /** A role's number; down to nought takes the role away. */
  const setRoleCount = (role: string, n: number) => {
    if (n > 0) return update({ roleCounts: { ...a.roleCounts, [role]: n } });
    const counts = { ...a.roleCounts };
    delete counts[role];
    if (a.otherRoleChosen && a.otherRole.trim() === role) update({ otherRoleChosen: false, otherRole: "", roleCounts: counts });
    else update({ roles: a.roles.filter((x) => x !== role), roleCounts: counts });
  };

  const onSend = async () => {
    if (busy) return;
    if (problem) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendCode();
      setCode("");
      setNotice(null);
      setPhase("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await sendCode();
      setNotice(`Vi har sendt en ny kode til ${a.email.trim().toLowerCase()}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (busy) return;
    if (code.length !== 6) {
      setError("Skriv inn den 6-sifrede koden fra e-posten.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const email = a.email.trim().toLowerCase();
      const verify = await fetch("/api/verify-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, flow: "new_company", verificationId: verificationId || undefined }),
      });
      const verified = (await verify.json().catch(() => null)) as { success?: boolean; token?: string; error?: string } | null;
      if (!verify.ok || !verified?.success || !verified.token) {
        setError(verified?.error || "Vi kunne ikke bekrefte koden. Prøv igjen.");
        return;
      }
      const token = verified.token;
      const save = await fetch("/api/save-employer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(token)),
      });
      const saved = (await save.json().catch(() => null)) as { success?: boolean; referenceId?: string; error?: string; code?: string } | null;
      if (!save.ok || saved?.success !== true) {
        setError(saved?.code === "pay_conditions" && saved.error ? saved.error : "Forespørselen kunne ikke sendes. Prøv igjen.");
        return;
      }
      // The ticket is spent, as the detailed wizard spends it after its own save.
      await fetch(`/api/verify-token?token=${encodeURIComponent(token)}`, { method: "DELETE" }).catch(() => null);
      setReference(typeof saved.referenceId === "string" ? saved.referenceId : "");
      clearStore();
      setPhase("done");
    } catch {
      setError("Vi kunne ikke bekrefte koden akkurat nå. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  /** "Kandidat på detaljer": the detailed request at /request, exactly as the popup sends it there. */
  const toDetailed = () => {
    try {
      window.sessionStorage.setItem(ANSWER_MODE_STORAGE_KEY, "detaljer");
    } catch {
      /* the address carries it too */
    }
    close();
    router.push(`${SITE_PATHS.request}?svar=detaljer`);
  };

  const trade = tradeOf(a.trade);
  const county = COUNTIES.find((c) => c.name === a.county) ?? null;
  const min = todayIso();

  let subPanel: { title: string; content: ReactNode } | null = null;
  if (sub === "company") {
    subPanel = {
      title: "Bedrift",
      content: <CompanySearch a={a} update={update} onPicked={() => setSub(null)} onForeign={() => openSheet("contact", { origin: "foreign" })} />,
    };
  } else if (sub === "trade") {
    subPanel = {
      title: "Bransje",
      content: (
        <Group>
          {SHEET_TRADES.map((t) => (
            <OptionRow
              key={t.key}
              label={t.label}
              chosen={a.trade === t.key}
              onPick={() => {
                const changed = t.key !== a.trade;
                if (changed) update({ trade: t.key, roles: [], otherRoleChosen: false, otherRole: "", roleCounts: {} });
                setSub(changed || !roles.length ? "roles" : null);
              }}
            />
          ))}
        </Group>
      ),
    };
  } else if (sub === "roles") {
    subPanel = { title: "Legg til rolle", content: <RolesPanel a={a} update={update} onAdded={() => setSub(null)} /> };
  } else if (sub === "when") {
    subPanel = {
      title: "Oppstart",
      content: (
        <>
          <Group>
            {WHEN_OPTIONS.map((w) => (
              <OptionRow
                key={w}
                label={w}
                chosen={a.when === w}
                onPick={() => {
                  update({ when: w });
                  setSub(null);
                }}
              />
            ))}
            <OptionRow label={PICK_DATE} chosen={a.when === PICK_DATE} onPick={() => update({ when: PICK_DATE })} />
            {a.when === PICK_DATE ? (
              <InputRow id="am-req-date" icon="cal" label="Startdato" type="date" min={min} value={a.date} onChange={(e) => update({ date: e.target.value })} />
            ) : null}
          </Group>
          {a.when === PICK_DATE && a.date && a.date < min ? <Hint>Velg en dato fra i dag.</Hint> : null}
        </>
      ),
    };
  } else if (sub === "county") {
    subPanel = {
      title: "Fylke",
      content: (
        <Group>
          {COUNTIES.map((c) => (
            <OptionRow
              key={c.name}
              label={c.name}
              chosen={a.county === c.name}
              onPick={() => {
                update({ county: c.name, town: c.name === a.county ? a.town : c.towns.length === 1 ? c.towns[0]! : "" });
                setSub(c.towns.length === 1 ? null : "town");
              }}
            />
          ))}
        </Group>
      ),
    };
  } else if (sub === "town" && county) {
    subPanel = {
      title: county.name,
      content: (
        <Group>
          {[...county.towns, ELSEWHERE_IN_COUNTY].map((t) => (
            <OptionRow
              key={t}
              label={t}
              chosen={a.town === t}
              onPick={() => {
                update({ town: t });
                setSub(null);
              }}
            />
          ))}
        </Group>
      ),
    };
  } else if (sub === "pay") {
    const fieldErrors = payFieldErrors({ from: a.payFrom, to: a.payTo, floor });
    const pay = checkPayConditions({
      answerMode: "rolle",
      equalTreatmentConfirmed: a.equalTreatment,
      payFrom: a.payFrom,
      payTo: a.payTo.trim() ? a.payTo : a.payFrom,
      payFloorAtSubmit: floor,
    });
    const blocked = Boolean(pay || fieldErrors.from || fieldErrors.to);
    subPanel = {
      title: "Lønn og vilkår",
      content: (
        <div className="sh-plain">
          <PayAndConditions
            idPrefix="am-req"
            floor={floor}
            equalTreatment={a.equalTreatment}
            onEqualTreatment={(v) => update({ equalTreatment: v })}
            payFrom={a.payFrom}
            payTo={a.payTo}
            onPayFrom={(v) => update({ payFrom: v, payFromTouched: true })}
            onPayTo={(v) => update({ payTo: v })}
            benefits={a.benefits}
            onToggleBenefit={(b) => update({ benefits: toggleBenefit(a.benefits, b) })}
            showConfirmError={tried}
            rangeError={tried && a.equalTreatment ? pay : null}
          />
          <button type="button" className="btn gold" onClick={() => (blocked ? setTried(true) : setSub(null))}>
            Ferdig
          </button>
        </div>
      ),
    };
  }

  const payValue = a.equalTreatment ? (a.payFrom.trim() ? `${a.payFrom.trim()}${a.payTo.trim() && a.payTo.trim() !== a.payFrom.trim() ? `-${a.payTo.trim()}` : ""} kr/t` : "Bekreftet") : "Velg";
  const title = phase === "code" ? "Skriv inn koden" : phase === "done" ? "Mottatt" : "Be om kandidater";

  let footer: ReactNode;
  if (phase === "done") {
    footer = (
      <button type="button" className="btn gold" onClick={close}>
        Lukk
      </button>
    );
  } else if (phase === "code") {
    footer = (
      <>
        {error ? (
          <p className="sh-err" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="btn gold" onClick={() => void onVerify()} disabled={busy}>
          {busy ? "Sender ..." : "Bekreft"}
        </button>
        <p>Koden er gyldig i 10 minutter.</p>
      </>
    );
  } else {
    footer = (
      <>
        {tried && problem ? (
          <p className="sh-err" role="alert">
            {problem}
          </p>
        ) : error ? (
          <p className="sh-err" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="btn gold" onClick={() => void onSend()} disabled={busy}>
          {busy ? "Sender ..." : "Send forespørsel"}
        </button>
        <p>Gratis forespørsel. Vi sender en kode til e-posten for å bekrefte den, og svarer innen én virkedag.</p>
      </>
    );
  }

  return (
    <SheetFrame open={open} lang="no" title={title} sub={phase === "rows" ? subPanel : null} onBack={() => setSub(sub === "town" ? "county" : null)} onClose={close} footer={footer}>
      {phase === "done" ? (
        <Done title="Mottatt" text={`Vi svarer på e-post så snart vi har kandidater${reference ? ` (referanse ${reference})` : ""}.`} />
      ) : phase === "code" ? (
        <>
          <Hint>
            Vi har sendt en kode på 6 siffer til <b>{a.email.trim().toLowerCase()}</b>.
          </Hint>
          <Group>
            <InputRow
              id="am-req-code"
              icon="lock"
              label="Kode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <NavRow icon="mail" label="Send ny kode" onClick={() => void onResend()} />
            <NavRow
              icon="back"
              label="Endre forespørselen"
              onClick={() => {
                setError(null);
                setPhase("rows");
              }}
            />
          </Group>
          {notice ? <Hint>{notice}</Hint> : null}
        </>
      ) : (
        <>
          <CompanyMain a={a} onOpen={() => setSub("company")} />
          <Group label="Behovet">
            <NavRow icon="building" label="Bransje" value={trade?.label ?? "Velg"} onClick={() => setSub("trade")} />
            {roles.map((r) => (
              <StepperRow key={r} icon="wrench" label={r} value={Math.max(1, a.roleCounts[r] ?? 1)} min={0} max={50} onChange={(n) => setRoleCount(r, n)} />
            ))}
            <NavRow icon="plus" alt label="Legg til rolle" value={roles.length ? "" : trade ? "Velg" : "Velg bransje først"} onClick={() => setSub(a.trade ? "roles" : "trade")} />
            <NavRow icon="cal" label="Oppstart" value={whenLine(a) || "Velg"} onClick={() => setSub("when")} />
            <NavRow icon="pin" label="Sted" value={placeLine(a) || "Velg"} onClick={() => setSub("county")} />
            <NavRow icon="chart" label="Lønn og vilkår" value={payValue} onClick={() => setSub("pay")} />
          </Group>
          <Group label="Kontakt">
            <InputRow
              id="am-req-email"
              icon="mail"
              label="Jobb-e-post"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={200}
              placeholder="navn@bedrift.no"
              value={a.email}
              onChange={(e) => update({ email: e.target.value })}
            />
            <ConsentSwitch label="Fullmakt og personvernerklæringen" checked={a.privacyAccepted} onChange={(v) => update({ privacyAccepted: v })}>
              Jeg har fullmakt til å sende forespørselen for bedriften, og har lest{" "}
              <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">
                personvernerklæringen
              </a>
            </ConsentSwitch>
            <ConsentSwitch label="Vilkårene" checked={a.termsAccepted} onChange={(v) => update({ termsAccepted: v })}>
              Jeg godtar{" "}
              <a className="plink" href={SITE_PATHS.terms} target="_blank" rel="noopener">
                vilkårene
              </a>
            </ConsentSwitch>
          </Group>
          <Group label="Vil dere svare på alt med en gang?">
            <NavRow icon="file" label="Kandidat på detaljer" value="Tar lengre tid" onClick={toDetailed} />
          </Group>
        </>
      )}
    </SheetFrame>
  );
}
