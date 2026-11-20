import { describe, expect, it } from "vitest";

import { HANDOVER_ACTION, TEXTS, errorText, langFrom, safeNext, signInStartHref } from "./candidateLoginRules";

/** ORDER 426: the candidate's sign-in on the site; RecOS opens the session behind it. */

describe("the sign-in's addresses", () => {
  it("posts the handover to RecOS's own door", () => {
    expect(HANDOVER_ACTION).toBe("https://ats.arbeidmatch.no/api/public/candidate-sign-in/handover");
  });

  it("starts Google and the fingerprint on RecOS, carrying the visit's next page and invitation only", () => {
    const href = new URL(signInStartHref("google", new URLSearchParams("next=/candidate/jobs&invite=AbCdEf0123456789xyz&email=x@example.invalid")));
    expect(href.origin + href.pathname).toBe("https://ats.arbeidmatch.no/candidate/sign-in/start");
    expect(href.searchParams.get("with")).toBe("google");
    expect(href.searchParams.get("next")).toBe("/candidate/jobs");
    expect(href.searchParams.get("invite")).toBe("AbCdEf0123456789xyz");
    expect(href.searchParams.has("email")).toBe(false);
    expect(new URL(signInStartHref("passkey", new URLSearchParams("next=https://evil.example"))).searchParams.has("next")).toBe(false);
  });

  it("lands only inside the portal", () => {
    expect(safeNext("/candidate/profile")).toBe("/candidate/profile");
    expect(safeNext("//evil.example")).toBe("");
    expect(safeNext("https://evil.example/candidate/")).toBe("");
    expect(safeNext(null)).toBe("");
  });
});

describe("the sign-in's words", () => {
  it("speaks English and Norwegian only, with every line in both", () => {
    expect(Object.keys(TEXTS).sort()).toEqual(["en", "no"]);
    expect(Object.keys(TEXTS.no).sort()).toEqual(Object.keys(TEXTS.en).sort());
    expect(langFrom("no")).toBe("no");
    expect(langFrom("nb")).toBe("no");
    expect(langFrom("ro")).toBe("en");
  });

  it("asks the citizenship question of his rule B", () => {
    expect(TEXTS.en.citizenshipQ).toMatch(/work permit/);
    expect(TEXTS.no.citizenshipQ).toMatch(/arbeidstillatelse/);
  });

  it("shows one line for each error RecOS sends back, and a plain one for the rest", () => {
    expect(errorText("", "en")).toBeNull();
    expect(errorText("handover_failed", "en")).toMatch(/new code/);
    expect(errorText("link_invalid", "no")).toMatch(/kode/);
    expect(errorText("anything", "en")).toBe("Something went wrong. Please try again.");
  });
});
