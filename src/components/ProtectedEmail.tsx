"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * An address that is never a plain string in the served HTML.
 *
 * The two halves arrive as separate props and are only joined in the browser, after
 * hydration, so a scraper reading the page source finds no user@domain to harvest and no
 * mailto: href to follow. A person sees the address and gets a working link.
 *
 * The contact page solves the same problem one step harder: it keeps the address behind a
 * "Show email address" click, so even a scraper that runs JavaScript has nothing to take
 * unless it clicks. That is right for the one page whose whole purpose is the address.
 * This component is for the places where the address has to be readable at a glance, like
 * the footer and the company facts.
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
