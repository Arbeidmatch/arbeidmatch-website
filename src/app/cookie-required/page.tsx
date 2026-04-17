"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const COOKIE_NAME = "site_cookie_consent";

function acceptPolicies() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=accepted; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export default function CookieRequiredPage() {
  const router = useRouter();

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <h1 className="text-3xl font-bold text-navy">We hope to see you soon</h1>
          <p className="mt-3 text-text-secondary">
            We understand your choice. You can return anytime and continue as soon as you accept our
            cookie and policy requirements.
          </p>
          <p className="mt-2 text-text-secondary">
            Please review our{" "}
            <Link href="/privacy" className="font-medium text-gold hover:text-gold-hover">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="font-medium text-gold hover:text-gold-hover">
              Terms
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={() => {
              acceptPolicies();
              router.push("/");
            }}
            className="mt-6 rounded-md bg-gold px-6 py-3 text-sm font-medium text-white hover:bg-gold-hover"
          >
            Accept and return to site
          </button>
        </div>
      </div>
    </section>
  );
}
