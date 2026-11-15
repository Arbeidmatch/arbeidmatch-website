"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { INVITE_THANKS } from "@/components/prosjekter/AccessForm";
import { Icon } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";
import { formatOrgNumber } from "@/lib/orgNumber";
import { checkAccessCode, checkAccessRequest, type AccessField } from "@/lib/prosjekter/access";
import { domainChoices, regionChoices } from "@/lib/prosjekter/format";

import { Done, Group, Hint, InputRow, NavRow, OptionRow } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";

/**
 * "Be om invitasjon" to Forsprang as a sheet (ORDER 295, stage 4). The same
 * request as AccessForm, presented in the site's rows: the company picked from
 * the register by name or number, name, role, e-mail and an optional phone,
 * the counties and trades to follow, the same honeypot and render time, the
 * same consent sentence with the terms and the privacy notice as links, and the
 * six-digit code step when the ATS asks for one. It posts to the same routes
 * and is checked by the same checkAccessRequest; nothing about who may ask, or
 * what happens to the request, changes.
 *
 * Opened by the lock row of the county panel with `fylke=<county code>`, so a
 * county clicked on the map is already chosen.
 */

type Company = { name: string; orgNumber: string; city?: string };
type Sub = "company" | "regions" | "domains" | null;

const COUNTY_GROUPS: { label: string; codes: string[] }[] = [
  { label: "Øst", codes: ["NO081", "NO084", "NO083", "NO085", "NO093", "NO020"] },
  { label: "Sør", codes: ["NO094", "NO092"] },
  { label: "Vest", codes: ["NO0A1", "NO0A2", "NO0A3"] },
  { label: "Midt", codes: ["NO060"] },
  { label: "Nord", codes: ["NO071", "NO072", "NO073"] },
];

// The register writes towns in capitals ("MO I RANA"); read as "Mo i Rana".
const town = (v: string) =>
  v
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && w === "i" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function regionSummary(regions: string[]): string {
  const all = regionChoices();
  const chosen = all.filter((r) => regions.includes(r.code));
  if (chosen.length === 0 || chosen.length === all.length) return "Hele Norge";
  if (chosen.length <= 2) return chosen.map((r) => r.label).join(", ");
  return `${chosen[0]!.label} og ${chosen.length - 1} til`;
}

function CompanySearch({ query, setQuery, onPick }: { query: string; setQuery: (q: string) => void; onPick: (c: Company) => void }) {
  const [hits, setHits] = useState<Company[] | null>(null);
  const [searching, setSearching] = useState(false);

  // The register, asked as the visitor types: by name, or by number when it is nine digits.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/brreg/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = (await res.json().catch(() => ({}))) as { companies?: Company[] };
        setHits(Array.isArray(body.companies) ? body.companies.filter((c) => c.name && c.orgNumber) : []);
      } catch {
        if (!ctrl.signal.aborted) setHits([]);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  return (
    <>
      <Group>
        <InputRow
          id="am-acc-company"
          icon="search"
          label="Søk"
          placeholder="Firmanavn eller org.nr."
          autoComplete="organization"
          maxLength={160}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-controls="am-acc-hits"
        />
      </Group>
      {hits && hits.length ? (
        <Group>
          <div id="am-acc-hits" aria-label="Treff i Enhetsregisteret">
            {hits.map((c) => (
              <button key={c.orgNumber} type="button" className="row opt" onClick={() => onPick(c)}>
                <span className="rl2">
                  <b>{c.name}</b>
                  <small>
                    Org.nr. {formatOrgNumber(c.orgNumber)}
                    {c.city ? ` · ${town(c.city)}` : ""}
                  </small>
                </span>
                <Icon name="chev" />
              </button>
            ))}
          </div>
        </Group>
      ) : null}
      {searching ? (
        <Hint>Søker i Enhetsregisteret ...</Hint>
      ) : hits && hits.length === 0 && query.trim().length >= 2 ? (
        <Hint>Ingen treff i Enhetsregisteret. Prøv org.nr.</Hint>
      ) : (
        <Hint>Vi henter navn og org.nr. fra Enhetsregisteret.</Hint>
      )}
    </>
  );
}

export function AccessSheet({ open, close, preset }: SheetProps) {
  const presetCounty = regionChoices().some((r) => r.code === preset.fylke) ? preset.fylke! : null;
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regions, setRegions] = useState<string[]>(presetCounty ? [presetCounty] : []);
  const [domains, setDomains] = useState<string[]>([]);
  const [honey, setHoney] = useState("");
  const [sub, setSub] = useState<Sub>(null);
  const [invalid, setInvalid] = useState<AccessField | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeStep, setCodeStep] = useState<{ requestId: string } | null>(null);
  const [code, setCode] = useState("");
  const [codeNote, setCodeNote] = useState("");
  const [done, setDone] = useState(false);
  const renderedAt = useRef(0);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  const fail = (field: AccessField | null, message: string) => {
    setInvalid(field);
    setError(message);
  };

  const check = () =>
    checkAccessRequest({
      company: company?.name ?? "",
      orgnr: company?.orgNumber ?? "",
      contact_name: name,
      contact_role: role,
      email,
      phone,
      regions,
      domains,
      website_confirmed: true,
    });

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (done) return close();
    if (codeStep) return verify();
    const checked = check();
    if (!checked.ok) return fail(checked.field, checked.error);
    fail(null, "");
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...checked.value, formRenderedAt: String(renderedAt.current), website: honey }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; needsCode?: boolean; requestId?: string; error?: string; field?: AccessField };
      if (!res.ok || payload.ok !== true) return fail(payload.field ?? null, payload.error ?? "Forespørselen kunne ikke sendes. Prøv igjen om litt.");
      if (payload.needsCode && payload.requestId) {
        setCodeStep({ requestId: payload.requestId });
        setCode("");
        setCodeNote("");
        return;
      }
      setDone(true);
    } catch {
      fail(null, "Forespørselen kunne ikke sendes. Prøv igjen om litt.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!codeStep) return;
    setCodeNote("");
    const c = checkAccessCode(code);
    if (!c.ok) return fail(null, c.error);
    fail(null, "");
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/access/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: codeStep.requestId, code: c.code }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || payload.ok !== true) return fail(null, payload.error ?? "Koden kunne ikke sjekkes. Prøv igjen.");
      setDone(true);
    } catch {
      fail(null, "Koden kunne ikke sjekkes. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!codeStep) return;
    fail(null, "");
    setCodeNote("");
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/access/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: codeStep.requestId }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || payload.ok !== true) fail(null, payload.error ?? "Koden kunne ikke sendes. Prøv igjen om litt.");
      else setCodeNote(`Vi har sendt en ny kode til ${email.trim().toLowerCase()}.`);
    } catch {
      fail(null, "Koden kunne ikke sendes. Prøv igjen om litt.");
    } finally {
      setBusy(false);
    }
  }

  const bad = (f: AccessField) => (invalid === f ? { "aria-invalid": true as const, "aria-describedby": "am-acc-err" } : {});
  const allCodes = regionChoices().map((r) => r.code);
  const has = (codes: string[]) => codes.length > 0 && codes.every((c) => regions.includes(c));
  const setGroup = (codes: string[], on: boolean) =>
    setRegions((old) => (on ? [...old, ...codes.filter((c) => !old.includes(c))] : old.filter((c) => !codes.includes(c))));
  const tradeLabel = domains.length === 0 ? "Alle fag" : domains.length === 1 ? (domainChoices().find((d) => d.key === domains[0])?.label ?? "1 fag") : `${domains.length} fag`;

  const subPanel =
    sub === "company"
      ? {
          title: "Firma",
          content: (
            <CompanySearch
              query={query}
              setQuery={setQuery}
              onPick={(c) => {
                setCompany(c);
                if (invalid === "company") fail(null, "");
                setSub(null);
              }}
            />
          ),
        }
      : sub === "regions"
        ? {
            title: "Fylker",
            content: (
              <>
                <Group>
                  <OptionRow label="Hele Norge" chosen={regions.length === 0 || has(allCodes)} onPick={() => setRegions([])} />
                  {COUNTY_GROUPS.map((g) => (
                    <OptionRow key={g.label} label={g.label} chosen={has(g.codes) && !has(allCodes)} onPick={() => setGroup(g.codes, !has(g.codes))} />
                  ))}
                </Group>
                <Group label="Eller velg fylker">
                  {regionChoices().map((r) => (
                    <OptionRow key={r.code} label={r.label} chosen={regions.includes(r.code)} onPick={() => setRegions((old) => toggle(old, r.code))} />
                  ))}
                </Group>
              </>
            ),
          }
        : sub === "domains"
          ? {
              title: "Fag",
              content: (
                <Group>
                  <OptionRow label="Alle fag" chosen={domains.length === 0} onPick={() => setDomains([])} />
                  {domainChoices().map((d) => (
                    <OptionRow key={d.key} label={d.label} chosen={domains.includes(d.key)} onPick={() => setDomains((old) => toggle(old, d.key))} />
                  ))}
                </Group>
              ),
            }
          : null;

  const label = done ? "Lukk" : busy ? (codeStep ? "Sjekker ..." : "Sender ...") : codeStep ? "Bekreft" : "Be om invitasjon";

  return (
    <SheetFrame
      open={open}
      lang="no"
      title="Be om invitasjon"
      sub={subPanel}
      onBack={() => setSub(null)}
      onClose={close}
      footer={
        <>
          {error ? (
            <p className="sh-err" id="am-acc-err" role="alert">
              {error}
            </p>
          ) : null}
          <button type="button" className="btn gold" onClick={() => void submit()} disabled={busy}>
            {label}
          </button>
          {done || codeStep ? null : <p>Forsprang er basert på invitasjon. Vi vurderer hver forespørsel.</p>}
        </>
      }
    >
      {done ? (
        <Done title="Takk." text={INVITE_THANKS} />
      ) : codeStep ? (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Hint>
            Vi har sendt en kode på 6 siffer til <b>{email.trim().toLowerCase()}</b>. Skriv den inn her for å bekrefte e-postadressen. Koden virker i 10
            minutter.
          </Hint>
          <Group>
            <InputRow
              id="am-acc-code"
              icon="lock"
              label="Kode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
              required
            />
          </Group>
          {codeNote ? <Hint>{codeNote}</Hint> : null}
          <Group>
            <NavRow icon="mail" label="Send ny kode" onClick={() => void resend()} />
            <NavRow
              icon="back"
              label="Endre e-post"
              onClick={() => {
                setCodeStep(null);
                fail(null, "");
              }}
            />
          </Group>
        </form>
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Group>
            <NavRow icon="brief" label="Firma" value={company ? company.name : "Søk i registeret"} onClick={() => setSub("company")} />
            {company ? (
              <div className="row info">
                <span className="ri alt">
                  <Icon name="check" />
                </span>
                <span className="rl2">
                  <b>{company.name}</b>
                  <small>
                    Org.nr. {formatOrgNumber(company.orgNumber)}
                    {company.city ? ` · ${town(company.city)}` : ""}
                  </small>
                </span>
                <span className="src">Brønnøysund</span>
              </div>
            ) : null}
          </Group>
          <Group>
            <InputRow id="am-acc-name" icon="user" label="Navn" autoComplete="name" placeholder="Fullt navn" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} required {...bad("contact_name")} />
            <InputRow
              id="am-acc-role"
              icon="badge"
              label="Rolle"
              autoComplete="organization-title"
              placeholder="F.eks. daglig leder"
              maxLength={80}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              {...bad("contact_role")}
            />
            <InputRow
              id="am-acc-email"
              icon="mail"
              label="E-post"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="navn@bedrift.no"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              {...bad("email")}
            />
            <InputRow id="am-acc-phone" icon="phone" label="Telefon" type="tel" autoComplete="tel" placeholder="Valgfritt" maxLength={24} value={phone} onChange={(e) => setPhone(e.target.value)} {...bad("phone")} />
          </Group>
          <Group label="Hva vil dere følge?">
            <NavRow icon="pin" label="Fylke" value={regionSummary(regions)} onClick={() => setSub("regions")} />
            <NavRow icon="wrench" label="Fag" value={tradeLabel} onClick={() => setSub("domains")} />
          </Group>
          {/* Sending is the acceptance (his decision, 16 October 2026); the privacy notice is read, not accepted. */}
          <Hint>
            Ved å sende bekrefter du at kontaktinformasjonen din står på firmaets nettside, og godtar{" "}
            <a className="plink" href="/terms?lang=no" target="_blank" rel="noopener">
              vilkårene
            </a>{" "}
            og ansvarsfraskrivelsen nedenfor. Les hvordan vi behandler personopplysningene dine i{" "}
            <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">
              personvernerklæringen
            </a>
            .
          </Hint>
          <Hint>
            <b>Ansvarsfraskrivelse.</b> Forsprang er i beta. Opplysningene om prosjektene kan være ufullstendige eller forsinket og erstatter ikke
            konkurransegrunnlaget. ArbeidMatch er ikke ansvarlig for beslutninger tatt på grunnlag av dem.
          </Hint>
          <div className="hp" aria-hidden="true">
            <label>
              Nettsted
              <input tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
            </label>
          </div>
        </form>
      )}
    </SheetFrame>
  );
}
