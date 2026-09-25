import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "frame-src https://challenges.cloudflare.com",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  // The pageview beacon is same-origin now (/api/track). ats.arbeidmatch.no stays listed only
  // because src/components/home/BeforeYouGo.tsx still posts there from the browser.
  "connect-src 'self' https://data.brreg.no https://challenges.cloudflare.com https://ats.arbeidmatch.no",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The profile page was renamed on 15 September 2026: candidates register, they do not
      // "request". The old address is already in Messenger replies, emails and Facebook posts.
      { source: "/candidate-request", destination: "/candidate-register", permanent: true },
      // Legal review, 25 September 2026: we recruit EU/EEA citizens only, so the page for
      // workers from outside the EU/EEA and its waitlist are gone. Old links land on the
      // candidate page, which states the rule. Stored rows were kept.
      { source: "/outside-eu-eea", destination: "/for-candidates", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
