"use client";

import Link from "next/link";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS, type SiteLang } from "@/components/site/siteNav";

/**
 * The row kinds of a sheet, as in the mockup's settings-style pop-ups: groups
 * of rows on a white card, a navigation row that slides in a sub-panel, text
 * input, text area, stepper, switch, segmented choice and plain link rows.
 * Every sheet of the site is built from these, so they look and behave alike.
 */

function RowIcon({ icon, alt }: { icon?: IconName; alt?: boolean }) {
  if (!icon) return null;
  return (
    <span className={alt ? "ri alt" : "ri"}>
      <Icon name={icon} />
    </span>
  );
}

export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div>
      {label ? <div className="gl">{label}</div> : null}
      <div className="grp">{children}</div>
    </div>
  );
}

/** A row that leads somewhere: another page, or a log-in outside the site. */
export function LinkRow({ href, icon, label, onNavigate, newTab }: { href: string; icon?: IconName; label: string; onNavigate?: () => void; newTab?: boolean }) {
  const inner = (
    <>
      <RowIcon icon={icon} />
      <span className="rl">{label}</span>
      <span className="rv" />
      <Icon name="chev" />
    </>
  );
  if (/^https?:/.test(href) || href.startsWith("#") || newTab) {
    return (
      <a className="row" href={href} onClick={onNavigate} {...(newTab ? { target: "_blank", rel: "noopener" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <Link className="row" href={href} onClick={onNavigate}>
      {inner}
    </Link>
  );
}

/** A row that does something in place: opens a sub-panel or another sheet. */
export function NavRow({ icon, label, value, onClick, alt }: { icon?: IconName; label: string; value?: string; onClick: () => void; alt?: boolean }) {
  return (
    <button type="button" className="row" onClick={onClick}>
      <RowIcon icon={icon} alt={alt} />
      <span className="rl">{label}</span>
      <span className="rv">{value ?? ""}</span>
      <Icon name="chev" />
    </button>
  );
}

/** One choice in a sub-panel's list; the chosen one carries the check. */
export function OptionRow({ label, chosen, onPick }: { label: string; chosen: boolean; onPick: () => void }) {
  return (
    <button type="button" className="row opt" onClick={onPick} aria-pressed={chosen}>
      <span className="rl">{label}</span>
      {chosen ? <Icon name="check" /> : <span />}
    </button>
  );
}

export function InputRow({ id, icon, label, ...input }: { id: string; icon?: IconName; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="row" htmlFor={id}>
      <RowIcon icon={icon} />
      <span className="rl">{label}</span>
      <input id={id} autoComplete="off" {...input} />
    </label>
  );
}

export function AreaRow({ id, label, ...area }: { id: string; label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="row area" htmlFor={id}>
      <span className="rl">{label}</span>
      <textarea id={id} {...area} />
    </label>
  );
}

export function SwitchRow({ icon, label, checked, onChange, locked }: { icon?: IconName; label: string; checked: boolean; onChange?: (next: boolean) => void; locked?: boolean }) {
  return (
    <button type="button" className="row" role="switch" aria-checked={checked} disabled={locked} onClick={() => onChange?.(!checked)}>
      <RowIcon icon={icon} />
      <span className="rl">{label}</span>
      <span className="sw" />
    </button>
  );
}

/**
 * The privacy tick of every sheet that collects anything about a person. The
 * words "privacy notice" / "personvernerklæringen" are the link, opening the
 * privacy page in a new tab so what was typed is not lost (ORDER 295, DO NOT).
 */
export function PrivacySwitch({ lang, checked, onChange }: { lang: SiteLang; checked: boolean; onChange: (next: boolean) => void }) {
  const label = lang === "no" ? "Jeg har lest personvernerklæringen" : "I have read the privacy notice";
  return (
    <div className="row">
      <span className="rl plwrap">
        {lang === "no" ? "Jeg har lest " : "I have read the "}
        <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">
          {lang === "no" ? "personvernerklæringen" : "privacy notice"}
        </a>
      </span>
      <button type="button" className="swb" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}>
        <span className="sw" />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StepperRow({ icon, label, value, min = 1, max = 99, onChange }: { icon?: IconName; label: string; value: number; min?: number; max?: number; onChange: (n: number) => void }) {
  return (
    <div className="row">
      <RowIcon icon={icon} />
      <span className="rl">{label}</span>
      <span className="stepper">
        <button type="button" aria-label={`${label}: -1`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          <Icon name="minus" />
        </button>
        <b aria-live="polite">{value}</b>
        <button type="button" aria-label={`${label}: +1`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
          <Icon name="plus" />
        </button>
      </span>
    </div>
  );
}

/** The sentence under a list in a sub-panel. */
export function Hint({ children }: { children: ReactNode }) {
  return <p className="hint">{children}</p>;
}

/** The confirmation that replaces a sheet's rows once it is sent. */
export function Done({ title, text }: { title: string; text: string }) {
  return (
    <div className="done sh-p" style={{ position: "static", transform: "none" }} role="status">
      <span className="disc">
        <Icon name="check" />
      </span>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}
