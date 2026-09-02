"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The panel that appears when somebody is leaving.
 *
 * Whoever leaves the page without giving us anything is lost for good, and does
 * not come back. This is one panel, once per session, and it does not ask a
 * generic question: it says back what the person was reading a minute ago, so
 * it is help rather than an advertisement.
 *
 * IT DOES NOT APPEAR AT ALL when there is nothing to say. Somebody who searched
 * nothing and opened nothing gets no panel, because a generic one is not help.
 *
 * WHY sessionStorage AND NOT A COOKIE. It holds one flag saying the panel has
 * been shown, for this tab, until the tab closes. Nothing is stored about the
 * person, nothing crosses to another site, nothing is read on a later visit, so
 * it is not a tracker and needs no consent banner. A cookie for the same job
 * would need one.
 *
 * DESKTOP AND PHONE ARE DIFFERENT SIGNALS. On a desktop the cursor leaving
 * upwards, towards the browser bar, is the moment before the tab is closed. A
 * phone has no cursor to leave, so it hangs on the back gesture instead, using
 * a pushed history entry the panel consumes.
 */

const SESSION_KEY = "am_before_you_go_shown";
const ATS_BASE = process.env.NEXT_PUBLIC_ATS_URL?.replace(/\/$/, "") || "https://ats.arbeidmatch.no";

export type BeforeYouGoContext =
  | { kind: "candidate"; trade: string; openCount: number; oneTakesSeveral: string | null }
  | { kind: "employer"; service: "recruitment" | "staffing" | "job_ad" };

export function BeforeYouGo({ trades }: { trades: Array<{ label: string; count: number; several: string | null }> }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<BeforeYouGoContext | null>(null);
  const armed = useRef(false);

  /**
   * What the visitor was actually doing, read off the page rather than guessed.
   *
   * The trade they typed into the search box first, then the industry chip they
   * pressed, then the service page they lingered on. If none of those happened,
   * there is nothing to say and the panel never arms.
   */
  const readContext = useCallback((): BeforeYouGoContext | null => {
    try {
      const typed = (document.querySelector<HTMLInputElement>("input[name='role']")?.value ?? "").trim().toLowerCase();
      const chip = (sessionStorage.getItem("am_last_industry") ?? "").trim().toLowerCase();
      const service = (sessionStorage.getItem("am_last_service") ?? "").trim().toLowerCase();

      if (service === "recruitment" || service === "staffing" || service === "job_ad") {
        return { kind: "employer", service };
      }

      const needle = typed || chip;
      if (!needle) return null;
      const match = trades.find((t) => t.label.toLowerCase().includes(needle) || needle.includes(t.label.toLowerCase()));
      if (!match) return null;
      return { kind: "candidate", trade: match.label, openCount: match.count, oneTakesSeveral: match.several };
    } catch {
      return null;
    }
  }, [trades]);

  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // A browser refusing session storage gets the panel once per page rather
      // than once per session, which is closer to the intent than never.
    }
    if (shown) return;

    const fire = () => {
      if (armed.current) return;
      const found = readContext();
      if (!found) return;
      armed.current = true;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Nothing to do: the panel still opens, it just may open again.
      }
      setContext(found);
      setOpen(true);
    };

    const onMouseOut = (event: MouseEvent) => {
      // Upwards, out of the document, towards the browser chrome. Leaving to
      // the side is switching windows, not closing.
      if (event.relatedTarget || event.clientY > 12) return;
      fire();
    };

    const isCoarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    if (isCoarse) {
      // A phone has no cursor. The back gesture is the equivalent moment, and
      // the pushed entry is what lets us hear it once.
      history.pushState({ am: "byg" }, "");
      const onPop = () => fire();
      addEventListener("popstate", onPop);
      return () => removeEventListener("popstate", onPop);
    }

    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [readContext]);

  if (!open || !context) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-gold/30 bg-white p-6 shadow-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Before you go</p>
        {context.kind === "candidate" ? (
          <CandidatePanel context={context} onClose={() => setOpen(false)} />
        ) : (
          <EmployerPanel context={context} onClose={() => setOpen(false)} />
        )}
      </div>
    </div>
  );
}

/**
 * The two values that say a person filled this in, and neither is visible.
 *
 * A field taken out of the layout, out of the accessibility tree and out of the
 * tab order, which only a robot fills in; and the moment the panel appeared, so
 * a submission in under two seconds can be questioned. Together they stop most
 * of what a public form receives while asking the honest visitor for nothing.
 */
function HiddenChecks() {
  const [renderedAt] = useState(() => String(Date.now()));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="company_website">Leave this field empty</label>
      <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      <input type="hidden" name="form_rendered_at" value={renderedAt} readOnly />
    </div>
  );
}

function CandidatePanel({ context, onClose }: { context: Extract<BeforeYouGoContext, { kind: "candidate" }>; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await fetch(`${ATS_BASE}/api/public/before-you-go`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "job_alert_signup",
          email: String(form.get("email") ?? ""),
          trade: context.trade,
          notify_consent: form.get("notify") === "on",
          data_consent: form.get("data") === "on",
          source: "before_you_go",
          // The two invisible layers. A field nobody can see, and how long the
          // panel was open before it was submitted. See the ATS's human-check.
          company_website: String(form.get("company_website") ?? ""),
          form_rendered_at: String(form.get("form_rendered_at") ?? ""),
        }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-3">
        <h2 className="text-xl font-bold text-navy">We have your address.</h2>
        <p className="mt-2 text-sm text-text-secondary">
          We write when something fits {context.trade.toLowerCase()}. Nothing else.
        </p>
        <button type="button" onClick={onClose} className="mt-4 text-sm font-semibold text-gold hover:underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative mt-3">
      <HiddenChecks />
      {/* The true number of open positions on the trade they searched for. A
          panel that says "jobs available!" is an advertisement; this is a fact. */}
      <h2 className="text-xl font-bold text-navy">
        {context.openCount} {context.trade.toLowerCase()} {context.openCount === 1 ? "job is" : "jobs are"} open right now
      </h2>
      {context.oneTakesSeveral ? (
        <p className="mt-2 text-sm text-text-secondary">
          One of them takes several people in {context.oneTakesSeveral}. Leave an email and we tell you when something
          fits your trade.
        </p>
      ) : (
        <p className="mt-2 text-sm text-text-secondary">
          Leave an email and we tell you when something fits your trade.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="name@email.no"
          className="flex-1 rounded border border-border px-3 py-2 text-sm text-navy outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-gold px-4 py-2 text-sm font-bold text-navy transition hover:bg-gold-hover disabled:opacity-60"
        >
          Keep me posted
        </button>
      </div>

      {/* Two boxes, not one. Being told about a job and letting us hold your
          details to look for work for you are two different permissions. */}
      <label className="mt-3 flex items-start gap-2 text-xs text-text-secondary">
        <input name="notify" type="checkbox" defaultChecked className="mt-0.5" />
        <span>Email me when a job fits my trade.</span>
      </label>
      <label className="mt-2 flex items-start gap-2 text-xs text-text-secondary">
        <input name="data" type="checkbox" required className="mt-0.5" />
        <span>
          I agree that ArbeidMatch keeps my details to look for work for me.{" "}
          <a href="/privacy" className="text-gold hover:underline">
            Privacy
          </a>
        </span>
      </label>

      <button type="button" onClick={onClose} className="mt-4 text-xs text-text-secondary hover:underline">
        No thanks, I am still looking
      </button>
    </form>
  );
}

function EmployerPanel({ context, onClose }: { context: Extract<BeforeYouGoContext, { kind: "employer" }>; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [service, setService] = useState(context.service);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await fetch(`${ATS_BASE}/api/public/before-you-go`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "employer_offer_request",
          service,
          company: String(form.get("company") ?? ""),
          email: String(form.get("email") ?? ""),
          source: "before_you_go",
          company_website: String(form.get("company_website") ?? ""),
          form_rendered_at: String(form.get("form_rendered_at") ?? ""),
        }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-3">
        <h2 className="text-xl font-bold text-navy">An offer is on its way.</h2>
        <p className="mt-2 text-sm text-text-secondary">
          We look the company up ourselves. Nothing is published and nothing is charged.
        </p>
        <button type="button" onClick={onClose} className="mt-4 text-sm font-semibold text-gold hover:underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative mt-3">
      <HiddenChecks />
      <h2 className="text-xl font-bold text-navy">Do you need people from the EU and EEA?</h2>
      <p className="mt-2 text-sm text-text-secondary">
        We bring in tradespeople with EU or EEA passports and their papers already in order. Tell us what your business
        needs and an offer comes back, not a sales call.
      </p>

      {/* Three things, and the first is a word rather than a form. Without the
          choice we would not know what offer to write. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(["recruitment", "staffing", "job_ad"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setService(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              service === option ? "border-gold bg-gold text-navy" : "border-border text-text-secondary hover:border-gold"
            }`}
          >
            {option === "recruitment" ? "Recruitment" : option === "staffing" ? "Staffing" : "Job ad"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="company"
          required
          placeholder="Company name"
          className="flex-1 rounded border border-border px-3 py-2 text-sm text-navy outline-none focus:border-gold"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="name@company.no"
          className="flex-1 rounded border border-border px-3 py-2 text-sm text-navy outline-none focus:border-gold"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-3 w-full rounded bg-gold px-4 py-2 text-sm font-bold text-navy transition hover:bg-gold-hover disabled:opacity-60"
      >
        Send me an offer
      </button>

      <p className="mt-3 text-xs text-text-secondary">
        We look the company up in Brønnøysund ourselves. Nothing is published and nothing is charged.
      </p>

      <button type="button" onClick={onClose} className="mt-3 text-xs text-text-secondary hover:underline">
        No thanks
      </button>
    </form>
  );
}
