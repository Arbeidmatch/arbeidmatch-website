"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  MARKETING_CONSENT_TEXT,
  PRIVACY_CONSENT_TEXT,
  REQUIRED_CONSENT_TEXTS,
  WORK_PROFILE_CONSENT_TEXT,
} from "@/lib/cv/consent";
import { hashConsentTextClient, sessionId } from "@/lib/cv/draft";
import type { CvDocument } from "@/lib/cv/schema";

type Stage = "consent" | "code";

interface Props {
  doc: CvDocument;
  policyVersion: string;
  onVerified: (downloadToken: string) => void;
  onDecline: () => void;
  onClose: () => void;
}

const RESEND_SECONDS = 60;

/**
 * When the site key is present the server also has its secret and will reject a request
 * without a token, so the widget has to be rendered and solved before Send code works.
 */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const needsTurnstile = Boolean(TURNSTILE_SITE_KEY);

export function ConsentModal({ doc, policyVersion, onVerified, onDecline, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("consent");
  const [privacy, setPrivacy] = useState(false);
  const [workProfile, setWorkProfile] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [email, setEmail] = useState(doc.personal.email);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  const onTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const canSend =
    privacy && workProfile && email.includes("@") && !busy && (!needsTurnstile || Boolean(turnstileToken));

  async function sendCode() {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      const policyTextSha256 = await hashConsentTextClient(REQUIRED_CONSENT_TEXTS);
      const response = await fetch("/api/cv/consent/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consentPrivacy: privacy,
          consentWorkProfile: workProfile,
          policyVersion,
          policyTextSha256,
          ...(turnstileToken ? { captchaToken: turnstileToken } : {}),
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        setError(result.error ?? "Could not send the code. Please try again.");
        // A Turnstile token is single use, so a retry needs a fresh one.
        setTurnstileToken(null);
        setTurnstileKey((value) => value + 1);
        return;
      }
      setStage("code");
      setCooldown(RESEND_SECONDS);
      // The token is spent. Resending needs the widget to hand over a new one.
      setTurnstileToken(null);
      setTurnstileKey((value) => value + 1);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/cv/consent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, cvDocument: doc, consentMarketing: marketing }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        downloadToken?: string;
      };
      if (!response.ok || !result.success || !result.downloadToken) {
        setError(result.error ?? "That code is not valid.");
        return;
      }
      onVerified(result.downloadToken);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function decline() {
    void fetch("/api/cv/consent/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId(), step: stage }),
    }).catch(() => undefined);
    onDecline();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0D1B2A]/70 p-0 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-consent-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-white p-5 outline-none sm:rounded-lg sm:p-6"
      >
        {stage === "consent" ? (
          <>
            <h2 id="cv-consent-title" className="text-xl font-bold text-[#0D1B2A]">
              Before you download
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#55616D]">
              Your CV has stayed in your browser until now. To download it we need your
              confirmation, and we confirm it with a code sent to your email.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer gap-3 rounded border border-[#E2E5EA] p-3 focus-within:ring-2 focus-within:ring-[#C9A84C]">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(event) => setPrivacy(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#C9A84C]"
                />
                <span className="text-[14px] leading-relaxed text-[#0D1B2A]">
                  {PRIVACY_CONSENT_TEXT}{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                  >
                    Privacy Policy
                  </a>
                  {" and "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                  >
                    Terms of Use
                  </a>
                  .
                </span>
              </label>

              <label className="flex cursor-pointer gap-3 rounded border border-[#E2E5EA] p-3 focus-within:ring-2 focus-within:ring-[#C9A84C]">
                <input
                  type="checkbox"
                  checked={workProfile}
                  onChange={(event) => setWorkProfile(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#C9A84C]"
                />
                <span className="text-[14px] leading-relaxed text-[#0D1B2A]">
                  {WORK_PROFILE_CONSENT_TEXT}
                </span>
              </label>

              <label className="flex cursor-pointer gap-3 rounded border border-[#E2E5EA] p-3 focus-within:ring-2 focus-within:ring-[#C9A84C]">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(event) => setMarketing(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#C9A84C]"
                />
                <span className="text-[14px] leading-relaxed text-[#55616D]">
                  {MARKETING_CONSENT_TEXT}
                </span>
              </label>
            </div>

            <div className="mt-4">
              <label htmlFor="cv-consent-email" className="mb-1 block text-sm font-semibold text-[#0D1B2A]">
                Email address
              </label>
              <input
                id="cv-consent-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded border border-[#E2E5EA] px-3 py-2.5 text-[15px] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40"
                placeholder="you@example.com"
              />
            </div>

            {needsTurnstile ? (
              <div className="mt-4">
                <Turnstile
                  key={turnstileKey}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={onTurnstileSuccess}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-3 text-[14px] font-medium text-[#B03A2E]">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={sendCode}
                disabled={!canSend}
                className="rounded bg-[#C9A84C] px-5 py-3 font-bold text-[#0D1B2A] transition-colors hover:bg-[#B8913A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send code"}
              </button>
              <button
                type="button"
                onClick={decline}
                className="rounded border border-[#E2E5EA] px-5 py-3 font-semibold text-[#55616D] transition-colors hover:border-[#B03A2E] hover:text-[#B03A2E] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]"
              >
                I do not agree
              </button>
            </div>
            <p className="mt-3 text-[13px] leading-snug text-[#8A929C]">
              If you do not agree, everything you typed is deleted from this browser and you
              will need to start the CV again.
            </p>
          </>
        ) : (
          <>
            <h2 id="cv-consent-title" className="text-xl font-bold text-[#0D1B2A]">
              Enter your code
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#55616D]">
              We sent a 6 digit code to {email}. It is valid for 10 minutes.
            </p>

            <label htmlFor="cv-consent-code" className="mt-4 mb-1 block text-sm font-semibold text-[#0D1B2A]">
              Verification code
            </label>
            <input
              id="cv-consent-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="w-full rounded border border-[#E2E5EA] px-3 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40"
              placeholder="000000"
            />

            {needsTurnstile ? (
              <div className="mt-4">
                <Turnstile
                  key={turnstileKey}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={onTurnstileSuccess}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-3 text-[14px] font-medium text-[#B03A2E]">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={verifyCode}
                disabled={code.length !== 6 || busy}
                className="rounded bg-[#C9A84C] px-5 py-3 font-bold text-[#0D1B2A] transition-colors hover:bg-[#B8913A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Checking..." : "Confirm and download"}
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={cooldown > 0 || busy || (needsTurnstile && !turnstileToken)}
                className="rounded border border-[#E2E5EA] px-5 py-3 font-semibold text-[#55616D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>

            <button
              type="button"
              onClick={decline}
              className="mt-4 text-[13px] font-semibold text-[#8A929C] underline focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]"
            >
              Cancel and delete what I typed
            </button>
          </>
        )}
      </div>
    </div>
  );
}
