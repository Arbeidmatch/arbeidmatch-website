"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { saveChoice, storedChoice } from "@/components/site/cookieChoice";
import { SITE_PATHS, siteLang } from "@/components/site/siteNav";
import { isWelcomeOpen, WELCOME_CLOSED_EVENT, WELCOME_OPEN_EVENT, welcomeLikelyPending } from "@/lib/welcomeOverlay";

/**
 * The cookie bar (ORDER 295): one slim bar in the page's language, the same
 * two choices and the same stored record as before. Changing the choice later
 * is the footer's "Informasjonskapsler" / "Cookies", which opens the sheet.
 */
export default function CookieConsent() {
  const no = siteLang(usePathname()) === "no";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (storedChoice()) return;

    // Never on top of the front page's "Welcome" picker: on a phone the banner
    // covered its buttons. Wait while it is open, show once it closes, and on a
    // first visit to the front page give it a moment to open first.
    let timer: number | undefined;
    const show = () => {
      window.clearTimeout(timer);
      if (!isWelcomeOpen() && !storedChoice()) setVisible(true);
    };
    const hide = () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
    window.addEventListener(WELCOME_OPEN_EVENT, hide);
    window.addEventListener(WELCOME_CLOSED_EVENT, show);
    if (!isWelcomeOpen()) timer = window.setTimeout(show, welcomeLikelyPending() ? 2500 : 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(WELCOME_OPEN_EVENT, hide);
      window.removeEventListener(WELCOME_CLOSED_EVENT, show);
    };
  }, []);

  if (!visible) return null;

  const choose = (analytics: boolean) => {
    saveChoice(analytics);
    setVisible(false);
  };

  return (
    <div className="ams">
      <div className="ck" role="region" aria-label={no ? "Informasjonskapsler" : "Cookies"} lang={no ? "nb" : "en"}>
        <p>
          {no
            ? "Vi lagrer bare det som trengs for at siden skal virke. Vil du også tillate vår egen besøksstatistikk? "
            : "We store only what the site needs to work. Do you also allow our own visit statistics? "}
          <a href={SITE_PATHS.cookies}>{no ? "Les mer" : "Read more"}</a>
        </p>
        <button type="button" className="btn line" onClick={() => choose(false)}>
          {no ? "Kun nødvendige" : "Necessary only"}
        </button>
        <button type="button" className="btn gold" onClick={() => choose(true)}>
          {no ? "Tillat" : "Allow"}
        </button>
      </div>
    </div>
  );
}
