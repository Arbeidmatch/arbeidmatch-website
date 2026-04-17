"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const COOKIE_NAME = "site_cookie_consent";

function readConsentCookie(): "accepted" | "declined" | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const value = cookie.split("=")[1];
  if (value === "accepted" || value === "declined") return value;
  return null;
}

function writeConsentCookie(value: "accepted" | "declined") {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export default function CookieConsentGate() {
  const router = useRouter();
  const pathname = usePathname();
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(() => readConsentCookie());
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
          <button
            type="button"
            onClick={() => {
              writeConsentCookie("accepted");
              setConsent("accepted");
            }}
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
          >
            Accept policies
          </button>
          <button
            type="button"
            onClick={() => {
              writeConsentCookie("declined");
              setConsent("declined");
              router.push("/cookie-required");
            }}
            className="rounded-md border border-navy px-5 py-2.5 text-sm font-medium text-navy hover:bg-surface"
          >
            Decline for now
          </button>
        </div>
      </div>
    </div>
  );
}
