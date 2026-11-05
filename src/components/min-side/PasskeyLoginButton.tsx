"use client";

import { useState, useSyncExternalStore } from "react";

import { passkeysSupported, signInWithPasskey } from "@/lib/min-side/passkey-browser";

/**
 * "Logg inn med passkey" (ORDER 228): a client who added a passkey on Min side
 * signs in with it, without an e-mail. Success sets the same session as the
 * login link (the route does it) and opens Min side. A browser without
 * passkeys is not shown the button.
 */

const noop = () => () => undefined;

export default function PasskeyLoginButton({ className, errorClassName }: { className: string; errorClassName?: string }) {
  const supported = useSyncExternalStore(noop, passkeysSupported, () => false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!supported) return null;

  const go = async () => {
    setBusy(true);
    setError(null);
    const r = await signInWithPasskey();
    if (r.ok) {
      window.location.assign(r.value);
      return;
    }
    setBusy(false);
    if (!r.cancelled) setError(r.error);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button type="button" className={className} disabled={busy} onClick={go}>
        {busy ? "Logger inn ..." : "Logg inn med passkey"}
      </button>
      {error ? (
        <span role="alert" className={errorClassName}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
