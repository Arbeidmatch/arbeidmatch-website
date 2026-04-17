"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const COOKIE_NAME = "site_cookie_consent";

function readConsentCookie(): "accepted" | "declined" | null {
  if (typeof document === "undefined") return null;
  try {
    const cookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
    if (!cookie) return null;
    const value = cookie.split("=")[1];
    if (value === "accepted" || value === "declined") return value;
  } catch {
    return null;
  }
  return null;
}

export default function CookieConsentGate() {
  const pathname = usePathname();
  const consent = readConsentCookie();
  const redirectPath = pathname || "/";
  if (consent) return null;
  if (pathname === "/cookie-required") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/70 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-white p-6 shadow-[0_12px_40px_rgba(13,27,42,0.22)]">
        <h2 className="text-xl font-bold text-navy">Cookie consent</h2>
        <p className="mt-2 text-sm text-text-secondary">
          We use cookies to keep the site secure, improve performance, and provide a better experience.
          Please accept our policies to continue using the website.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          You can review our{" "}
          <Link href="/privacy" className="font-medium text-gold hover:text-gold-hover">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-medium text-gold hover:text-gold-hover">
            Terms
          </Link>
          .
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <form method="post" action="/api/cookie-consent">
            <input type="hidden" name="action" value="accepted" />
            <input type="hidden" name="redirect" value={redirectPath} />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
            >
              Accept policies
            </button>
          </form>
          <form method="post" action="/api/cookie-consent">
            <input type="hidden" name="action" value="declined" />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-navy px-5 py-2.5 text-sm font-medium text-navy hover:bg-surface"
            >
              Decline for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
