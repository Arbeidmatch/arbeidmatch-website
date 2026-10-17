import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AccessForm, { INVITE_THANKS } from "./AccessForm";
import { DIALOG_META, dialogForLink } from "@/lib/prosjekter/dialogs";
import { portalHeader } from "@/lib/prosjekter/portalNav";

/**
 * The owner's decision of 17 October 2026: the access call-to-action asks for
 * an invitation, opens the form straight away with no plans or prices, and the
 * browser refuses nothing but malformed input. The ATS decides and flags.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (rel: string) => readFileSync(path.resolve(here, rel), "utf8");
const ORIGIN = "https://www.arbeidmatch.no";
const PLAN_WORDS = /plan|pris|price|kr\s?\d|abonnement|prøveperiode|regional|tilgang/i;

describe("Be om invitasjon", () => {
  it("is the header's gold call-to-action and opens the invitation dialog", () => {
    const h = portalHeader("/prosjekter");
    expect(h?.gold.label).toBe("Be om invitasjon");
    expect(h && dialogForLink(h.gold.href, "/prosjekter", ORIGIN)).toBe("tilgang");
    expect(DIALOG_META.tilgang.title).toBe("Be om invitasjon");
    expect(DIALOG_META.tilgang.title).not.toMatch(PLAN_WORDS);
  });

  it("opens the form directly: firm, name, role, e-mail and phone, no plan or price", () => {
    const html = renderToStaticMarkup(<AccessForm onClose={() => {}} />);
    for (const id of ["pa-company", "pa-name", "pa-role", "pa-email", "pa-phone"]) expect(html).toContain(`id="${id}"`);
    expect(html).toContain("Firmanavn eller org.nr.");
    const visible = html.replace(/<[^>]+>/g, " ");
    expect(visible).not.toMatch(PLAN_WORDS);
    expect(visible).not.toContain("Endre plan");
  });

  it("asks for counties and trades in the step that sends, without plan words", () => {
    const form = source("./AccessForm.tsx");
    expect(form).toContain("<legend className={styles.lab}>Områder</legend>");
    expect(form).toContain("<legend className={styles.lab}>Fag</legend>");
    expect(form).not.toMatch(/AccessPlans|requested_plan|requested_frequency|ACCESS_PLAN_NAMES|abonnement|Prøveperiode/);
    expect(existsSync(path.resolve(here, "./AccessPlans.tsx"))).toBe(false);
  });

  it("names every call-to-action an invitation", () => {
    for (const f of ["./AccessBand.tsx", "./ProjectPortal.tsx", "./LoginForm.tsx", "./PortalSteps.tsx"]) {
      const s = source(f);
      expect(s).toContain("Be om invitasjon");
      expect(s).not.toMatch(/>\s*(Få tilgang|Be om tilgang)\s*</);
    }
  });

  it("refuses no agency in the browser: no NACE, staffing or area block in the form", () => {
    const code = source("./AccessForm.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/\bnace\b|næring|naering|bemanning|byrå|\bagenc|staffingArea|STAFFING_AREA/i);
  });

  it("thanks the visitor in the owner's words once the code is confirmed", () => {
    expect(INVITE_THANKS).toBe("Takk. Vi vurderer forespørselen og sender deg en invitasjon hvis den blir godkjent.");
    const form = source("./AccessForm.tsx");
    expect(form).toContain("<p>{INVITE_THANKS}</p>");
    expect(form).not.toContain("Venter på aktivering");
  });
});
