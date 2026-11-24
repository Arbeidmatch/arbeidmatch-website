"use client";

import { useEffect, useState, type FormEvent } from "react";

import { COOKIE_SHEET_EVENT, saveChoice, storedChoice } from "@/components/site/cookieChoice";
import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

import { Done, Group, Hint, InputRow, LinkRow, NavRow, OptionRow, PrivacySwitch, SwitchRow } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";
import { useSiteNumbers } from "@/components/NumbersProvider";
import { replySentence } from "@/lib/numbers";

function CloseFoot({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn gold" onClick={onClick}>
      {label}
    </button>
  );
}

/** "Logg inn": the three doors in, in the order the page's audience needs them. */
export function LoginSheet({ lang, open, close }: SheetProps) {
  const rows =
    lang === "no"
      ? [
          { href: SITE_PATHS.minSide, icon: "building" as const, label: "Min side for kunder" },
          { href: SITE_PATHS.forsprangLogin, icon: "pin" as const, label: "Forsprang" },
          { href: SITE_PATHS.candidateLogin, icon: "user" as const, label: "Kandidat eller ansatt" },
        ]
      : [
          { href: SITE_PATHS.candidateLogin, icon: "user" as const, label: "Candidate or employee" },
          { href: SITE_PATHS.minSide, icon: "building" as const, label: "Min side for clients" },
          { href: SITE_PATHS.forsprangLogin, icon: "pin" as const, label: "Forsprang" },
        ];
  return (
    <SheetFrame
      open={open}
      lang={lang}
      title={lang === "no" ? "Logg inn" : "Log in"}
      sub={null}
      onBack={() => {}}
      onClose={close}
      footer={<CloseFoot label={lang === "no" ? "Lukk" : "Close"} onClick={close} />}
    >
      <Group>
        {rows.map((r) => (
          <LinkRow key={r.label} href={r.href} icon={r.icon} label={r.label} onNavigate={close} />
        ))}
      </Group>
    </SheetFrame>
  );
}

/** The phone menu: the four entries, the candidate pages, and the way in. */
export function MenuSheet({ lang, open, close, openSheet }: SheetProps) {
  const no = lang === "no";
  return (
    <SheetFrame
      open={open}
      lang={lang}
      title={no ? "Meny" : "Menu"}
      sub={null}
      onBack={() => {}}
      onClose={close}
      footer={<CloseFoot label={no ? "Lukk" : "Close"} onClick={close} />}
    >
      <Group>
        <LinkRow href={SITE_PATHS.home} icon="home" label={no ? "Forside" : "Home"} onNavigate={close} />
        <LinkRow href={SITE_PATHS.firms} icon="building" label="For bedrifter" onNavigate={close} />
        <LinkRow href={SITE_PATHS.forsprang} icon="pin" label="Forsprang" onNavigate={close} />
        <LinkRow href={SITE_PATHS.candidates} icon="user" label="For candidates" onNavigate={close} />
        <LinkRow href={SITE_PATHS.network} icon="users" label="Recruiter network" onNavigate={close} />
        <LinkRow href={SITE_PATHS.contact} icon="msg" label={no ? "Kontakt" : "Contact"} onNavigate={close} />
      </Group>
      <Group label="For candidates">
        <LinkRow href={SITE_PATHS.jobs} icon="brief" label="Open jobs" onNavigate={close} />
        <LinkRow href={SITE_PATHS.lifeInNorway} icon="file" label="Life in Norway" onNavigate={close} />
        <LinkRow href={SITE_PATHS.questions} icon="help" label="Questions" onNavigate={close} />
        <LinkRow href={SITE_PATHS.support} icon="msg" label="Support" onNavigate={close} />
      </Group>
      <Group>
        <NavRow icon="lock" label={no ? "Logg inn" : "Log in"} onClick={() => openSheet("login")} />
      </Group>
    </SheetFrame>
  );
}

/** Cookie choices, saved the moment a switch moves; the same record the cookie bar writes. */
export function CookiesSheet({ lang, open, close }: SheetProps) {
  const no = lang === "no";
  const [analytics, setAnalytics] = useState(false);
  useEffect(() => {
    const read = () => setAnalytics(Boolean(storedChoice()?.analytics));
    read();
    window.addEventListener(COOKIE_SHEET_EVENT, read);
    return () => window.removeEventListener(COOKIE_SHEET_EVENT, read);
  }, []);
  return (
    <SheetFrame
      open={open}
      lang={lang}
      title={no ? "Informasjonskapsler" : "Cookies"}
      sub={null}
      onBack={() => {}}
      onClose={close}
      footer={
        <>
          <CloseFoot label={no ? "Ferdig" : "Done"} onClick={close} />
          <p>
            {no ? "Valgene lagres med en gang. Mer i " : "Your choices are saved at once. More in the "}
            <a className="plink" href={SITE_PATHS.cookies} target="_blank" rel="noopener">
              {no ? "erklæringen om informasjonskapsler" : "cookie policy"}
            </a>
            .
          </p>
        </>
      }
    >
      <Group>
        <SwitchRow icon="lock" label={no ? "Nødvendig lagring" : "Necessary storage"} checked locked />
        <SwitchRow
          icon="chart"
          label={no ? "Besøksstatistikk" : "Visit statistics"}
          checked={analytics}
          onChange={(next) => {
            setAnalytics(next);
            saveChoice(next);
          }}
        />
      </Group>
    </SheetFrame>
  );
}

const NOTIFY_FEATURES = [
  { value: "Stillingsannonser for bedrifter", label: "Stillingsannonser" },
  { value: "RecOS for bemanningsbyråer", label: "RecOS for byråer" },
] as const;

/**
 * "Si ifra når det åpner", for the products not open yet. It writes to the
 * site's existing waiting list (/api/feature-waitlist), with the same consent
 * the list has always asked for and the privacy notice linked.
 */
export function NotifySheet({ open, close, preset }: SheetProps) {
  const initial = NOTIFY_FEATURES.find((f) => f.label === preset.what || f.value === preset.what) ?? NOTIFY_FEATURES[0];
  const [feature, setFeature] = useState<string>(initial.value);
  const [inSub, setInSub] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [readNotice, setReadNotice] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const label = NOTIFY_FEATURES.find((f) => f.value === feature)?.label ?? feature;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (status === "done") return close();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Skriv inn en gyldig e-postadresse.");
    if (!consent) return setError("Slå på at vi kan sende deg én e-post når tjenesten åpner.");
    if (!readNotice) return setError("Bekreft at du har lest personvernerklæringen.");
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), feature, consent: true, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Det gikk ikke å sende akkurat nå. Prøv igjen om litt.");
    }
  }

  return (
    <SheetFrame
      open={open}
      lang="no"
      title="Si ifra når det åpner"
      sub={
        inSub
          ? {
              title: "Tjeneste",
              content: (
                <Group>
                  {NOTIFY_FEATURES.map((f) => (
                    <OptionRow
                      key={f.value}
                      label={f.label}
                      chosen={feature === f.value}
                      onPick={() => {
                        setFeature(f.value);
                        setInSub(false);
                      }}
                    />
                  ))}
                </Group>
              ),
            }
          : null
      }
      onBack={() => setInSub(false)}
      onClose={close}
      footer={
        <>
          {error ? <p className="sh-err" role="alert">{error}</p> : null}
          <button type="button" className="btn gold" onClick={() => void submit()} disabled={status === "sending"}>
            {status === "done" ? "Lukk" : status === "sending" ? "Sender..." : "Si ifra"}
          </button>
          {status !== "done" ? (
            <p>
              Én e-post, når tjenesten åpner. Les hvordan vi behandler opplysningene i{" "}
              <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">
                personvernerklæringen
              </a>
              .
            </p>
          ) : null}
        </>
      }
    >
      {status === "done" ? (
        <Done title="Takk." text={`Vi sender deg én e-post når ${label} åpner.`} />
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Group>
            <NavRow icon="bell" label="Tjeneste" value={label} onClick={() => setInSub(true)} />
          </Group>
          <Group>
            <InputRow id="am-notify-email" icon="mail" label="E-post" type="email" inputMode="email" autoComplete="email" placeholder="navn@bedrift.no" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <SwitchRow label="Send meg én e-post når det åpner" checked={consent} onChange={setConsent} />
            <PrivacySwitch lang="no" checked={readNotice} onChange={setReadNotice} />
          </Group>
          <div className="hp" aria-hidden="true">
            <label>
              Nettside
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
        </form>
      )}
    </SheetFrame>
  );
}

/** A row that opens another sheet, with its line under it. */
function SheetChoice({ icon, label, line, onClick }: { icon: IconName; label: string; line?: string; onClick: () => void }) {
  return (
    <button type="button" className="row" onClick={onClick}>
      <span className="ri">
        <Icon name={icon} />
      </span>
      <span className="rl2">
        <b>{label}</b>
        {line ? <small>{line}</small> : null}
      </span>
      <Icon name="chev" />
    </button>
  );
}

/**
 * "Pris og vilkår" (ORDER 296), from the contact page. Clients ask for the
 * price and the terms by e-mail, so the site prints no price: the two ways to
 * ask are a message, with the subject already chosen, or a request, which is
 * answered with an offer.
 */
export function PricesSheet({ open, close, openSheet }: SheetProps) {
  // ORDER 302: the reply promise is RecOS's; with no value the choice shows its label alone.
  const reply = replySentence(useSiteNumbers(), "no");
  return (
    <SheetFrame open={open} lang="no" title="Pris og vilkår" sub={null} onBack={() => {}} onClose={close} footer={<CloseFoot label="Lukk" onClick={close} />}>
      <Group>
        <SheetChoice icon="msg" label="Skriv til oss" line={reply ?? undefined} onClick={() => openSheet("contact", { gjelder: "Pris og vilkår" })} />
        <SheetChoice icon="users" label="Send en forespørsel" line="Gratis. Dere får et tilbud med pris." onClick={() => openSheet("request")} />
      </Group>
      <Hint>Prisen følger rollen og står i tilbudet.</Hint>
    </SheetFrame>
  );
}
