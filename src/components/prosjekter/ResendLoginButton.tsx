"use client";

import { useState } from "react";

/**
 * "Send ny lenke" on the page an expired login link lands on (PROJ-REST A, 17
 * October 2026). Nothing is typed: the ATS mails a new link to the address the
 * old one was sent to (for a Min side button, the subscription's own address),
 * and the answer is the same whoever presses it.
 */
export default function ResendLoginButton({ token, className }: { token: string; className?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setState("busy");
    try {
      const res = await fetch(`/api/prosjekter/login/${encodeURIComponent(token)}`, { method: "POST" });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setState("sent");
        setMessage("Hvis lenken var gyldig, har vi sendt en ny til den samme e-postadressen. Den virker i 30 minutter.");
      } else {
        setState("error");
        setMessage(payload.error ?? "Noe gikk galt. Prøv igjen om litt.");
      }
    } catch {
      setState("error");
      setMessage("Noe gikk galt. Prøv igjen om litt.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button type="button" className={className} onClick={() => void send()} disabled={state === "busy" || state === "sent"} style={{ minHeight: 44 }}>
        Send ny lenke
      </button>
      {message ? (
        <p role="status" style={{ margin: 0, maxWidth: 420, fontSize: 14 }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
