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
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  // The pageview beacon is same-origin now (/api/track). ats.arbeidmatch.no was listed for
  // BeforeYouGo.tsx, removed with the orphan components (ORDER 295 stage 7); it stays until no browser call is left.
  "connect-src 'self' https://data.brreg.no https://challenges.cloudflare.com https://ats.arbeidmatch.no",
  "form-action 'self'",
].join("; ");

const projectMapPolicy = contentSecurityPolicy.replace("connect-src 'self'", "connect-src 'self' https://tiles.maps.eox.at https://cache.kartverket.no") + "; worker-src 'self' blob:";

const nextConfig: NextConfig = {
  // Keep the immersive document independent of the agency navigation and page scroll.
  async rewrites() {
    return [{ source: "/recos", destination: "/recos-experience/index.html" }];
  },
  async redirects() {
    return [
      // The profile page was renamed on 15 September 2026: candidates register, they do not
      // "request". The old address is already in Messenger replies, emails and Facebook posts.
      { source: "/candidate-request", destination: "/candidate-register", permanent: true },
      // Legal review, 25 September 2026: we recruit EU/EEA citizens only, so the page for
      // workers from outside the EU/EEA and its waitlist are gone. Old links land on the
      // candidate page, which states the rule. Stored rows were kept.
      { source: "/outside-eu-eea", destination: "/for-candidates", permanent: true },
      // HIS INSTRUCTION, 3 November 2026: every address a candidate receives is on
      // arbeidmatch.no, never on the ATS subdomain. The sign-in door is
      // arbeidmatch.no/sign-in (and /logg-inn); it forwards to the candidate login in
      // the ATS, query string included, so the ATS keeps the session and the codes.
      // Temporary (307) on purpose: a browser must not cache where the door leads.
      { source: "/sign-in", destination: "https://ats.arbeidmatch.no/candidate/login", permanent: false },
      { source: "/sign-in/:path*", destination: "https://ats.arbeidmatch.no/candidate/login/:path*", permanent: false },
      { source: "/logg-inn", destination: "https://ats.arbeidmatch.no/candidate/login", permanent: false },
      { source: "/logg-inn/:path*", destination: "https://ats.arbeidmatch.no/candidate/login/:path*", permanent: false },
      // ORDER 295, stage 4: the old project-alerts address answered 404; Forsprang lives at /prosjekter. Only the bare
      // address: the recommendation links under /prosjektvarsler/anbefalt/ stay pages of their own.
      { source: "/prosjektvarsler", destination: "/prosjekter", permanent: true },
      // ORDER 295, stage 5: the five /premium articles are the Life in Norway guides for candidates. Each old
      // address goes to its guide; /premium/success stays, it is where a payment returns.
      { source: "/premium", destination: "/for-candidates/life-in-norway", permanent: true },
      { source: "/premium/browse", destination: "/for-candidates/life-in-norway", permanent: true },
      { source: "/premium/article/:slug", destination: "/for-candidates/life-in-norway/:slug", permanent: true },
      // Pages that left the site and the sitemap go to the closest live page. The one blog article for firms keeps
      // its own address, out of the menu.
      { source: "/blog", destination: "/for-employers", permanent: true },
      { source: "/download", destination: "/", permanent: true },
      { source: "/partners", destination: "/about", permanent: true },
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
      {
        source: "/prosjekter/:path*",
        headers: [
          { key: "Content-Security-Policy", value: projectMapPolicy },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        source: "/recos",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-src https:", "frame-src 'self' https:") }],
      },
      {
        source: "/recos-experience/index.html",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-src https:", "frame-src 'self' https:") }],
      },
      {
        source: "/recos-experience/product-preview.html",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
