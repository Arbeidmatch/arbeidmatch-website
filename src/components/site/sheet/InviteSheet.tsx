"use client";

import { useState, type FormEvent } from "react";

import { SITE_PATHS } from "@/components/site/siteNav";

import { AreaRow, Done, Group, InputRow, NavRow, OptionRow, PrivacySwitch } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";
import { useSiteNumbers } from "@/components/NumbersProvider";
import { num } from "@/lib/numbers";

/**
 * "Request invitation" for the Recruiter Network, as in the approved mockup
 * (ORDER 295, stage 6). It sends to the live endpoint with the live form's
 * fields and checks: full name, e-mail, a motivation of at least 30
 * characters, the optional experience summary, the privacy notice and the
 * honeypot. The partner type the mockup asks for ("I am") has no field of its
 * own on the endpoint, so a chosen type opens the experience summary.
 */

export const PARTNER_TRACKS = ["The Influencer", "The Recruiter", "The Learner"] as const;

/** The experience summary as sent: the partner type, when one is chosen, then what the person wrote. */
export function inviteSummary(track: string, summary: string): string | undefined {
  const parts = [track ? `Partner type: ${track}` : "", summary.trim()].filter(Boolean);
  return parts.length ? parts.join("\n") : undefined;
}

export function InviteSheet({ open, close, preset }: SheetProps) {
  // ORDER 302: the answer time is RecOS's; with no value the thanks ends at the review.
  const inviteDays = num(useSiteNumbers(), "reply_days_invite");
  const [track, setTrack] = useState<string>(PARTNER_TRACKS.find((t) => t === preset.track) ?? "");
  const [inSub, setInSub] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [motivation, setMotivation] = useState("");
  const [summary, setSummary] = useState("");
  const [readNotice, setReadNotice] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (status === "done") return close();
    if (website.trim()) return;
    if (!name.trim()) return setError("Please write your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please write a valid email address.");
    if (motivation.trim().length < 30) return setError("Please write at least 30 characters in the motivation field.");
    if (!readNotice) return setError("Please confirm that you have read the privacy notice to continue.");
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/recruiter-network/request-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          motivation: motivation.trim(),
          experience_summary: inviteSummary(track, summary),
          gdpr_consent: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please try again or contact support.");
    }
  }

  return (
    <SheetFrame
      open={open}
      lang="en"
      title="Request invitation"
      sub={
        inSub
          ? {
              title: "I am",
              content: (
                <Group>
                  {PARTNER_TRACKS.map((t) => (
                    <OptionRow
                      key={t}
                      label={t}
                      chosen={track === t}
                      onPick={() => {
                        setTrack(t);
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
          {error ? (
            <p className="sh-err" role="alert">
              {error}{" "}
              <a className="plink" href={`${SITE_PATHS.contact}?support=1`}>
                Contact support
              </a>
            </p>
          ) : null}
          <button type="button" className="btn gold" onClick={() => void submit()} disabled={status === "sending"}>
            {status === "done" ? "Close" : status === "sending" ? "Sending..." : "Request invitation"}
          </button>
          {status !== "done" ? <p>We read every request and reply when there is a fit.</p> : null}
        </>
      }
    >
      {status === "done" ? (
        <Done title="Thank you." text={inviteDays == null ? "We will review your request." : `We will review your request and respond within ${inviteDays} days.`} />
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Group>
            <InputRow id="am-invite-name" icon="user" label="Full name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            <InputRow id="am-invite-email" icon="mail" label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <NavRow icon="users" label="I am" value={track || "Choose"} onClick={() => setInSub(true)} />
          </Group>
          <Group>
            <AreaRow
              id="am-invite-why"
              label="Your recruitment experience and why you want to join"
              placeholder="Your background in recruitment or HR, markets you cover, and what you hope to bring to the network."
              rows={4}
              minLength={30}
              required
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
            />
            <AreaRow
              id="am-invite-experience"
              label="Experience summary (optional)"
              placeholder="Years of experience, industries, key placements"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Group>
          <Group>
            <PrivacySwitch lang="en" checked={readNotice} onChange={setReadNotice} />
          </Group>
          <div className="hp" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
        </form>
      )}
    </SheetFrame>
  );
}
