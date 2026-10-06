"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * An address that is never a plain string in the served HTML.
 *
 * The two halves arrive as separate props and are only joined in the browser, after
 * hydration, so a scraper reading the page source finds no user@domain to harvest and no
 * mailto: href to follow. A person sees the address and gets a working link.
 *
 * Since 6 October 2026 (W1) the site shows no mailbox where a person wants help: those
 * places carry the "Contact support" button (components/support/SupportRequest). This
 * component is left for the address the law asks for, the imprint in the footer.
 */
export type ProtectedEmailProps = {
  username: string;
  domain: string;
  className?: string;
  children?: ReactNode;
  /** Shown instead of the address itself, for links that carry their own wording. */
  label?: ReactNode;
  loadingLabel?: string;
};

export function ProtectedEmail({
  username,
  domain,
  className,
  children,
  label,
  loadingLabel = "Loading contact...",
}: ProtectedEmailProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <span className={className} aria-busy="true" aria-live="polite">
        {children}
        {label ?? loadingLabel}
      </span>
    );
  }

  const email = `${username}@${domain}`;
  return (
    <a href={`mailto:${email}`} className={className}>
      {children}
      {label ?? email}
    </a>
  );
}
