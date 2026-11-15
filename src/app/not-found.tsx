import Link from "next/link";

import { SITE_PATHS } from "@/components/site/siteNav";

/** The 404 page on the site's template, with its own h1 (ORDER 295, stage 6). */
export default function NotFound() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">404</span>
          <h1>Page not found</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            {"The page you're looking for doesn't exist or has been moved."}
          </p>
        </div>
      </section>
      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <h2 className="h3">Where to next</h2>
          <div className="cta" style={{ margin: 0 }}>
            <Link className="btn gold" href={SITE_PATHS.home}>
              Go home
            </Link>
            <Link className="btn ghost" href={SITE_PATHS.contact}>
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
