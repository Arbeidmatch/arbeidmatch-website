import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { certificatesForTrade, EMPTY_NEEDS, EXPERIENCE_CHOICES, LANGUAGE_CHOICES, LICENCE_CHOICES, needsBody, needsFromRaw } from "@/lib/min-side/candidate-needs";

/** ORDER 506: "Hva trenger kandidatene?", the optional second step of the request for people on Min side. */

const client = readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8");
const form = client.slice(client.indexOf("function StaffingForm"), client.indexOf("function StaffingForm") + 6000);

describe("Hva trenger kandidatene? (ORDER 506)", () => {
  it("the first step goes on with Neste, the second sends with Send or goes back", () => {
    expect(form).toContain("onSubmit={next}");
    expect(form).toContain("onSubmit={submit}");
    expect(form).toMatch(/>\s*Neste\s*</);
    expect(form).toMatch(/>\s*Tilbake\s*</);
    expect(form).toContain('{busy ? "Sender ..." : "Send"}');
    expect(form).toContain("Hva trenger kandidatene?");
  });

  it("the second step has six controls at most: five chip rows and one free line", () => {
    const step2 = form.slice(form.indexOf("if (step === 2)"), form.indexOf("<FormError", form.indexOf("if (step === 2)")));
    expect(step2.match(/<NeedChips /g)).toHaveLength(5);
    expect(step2.match(/<input /g)).toHaveLength(1);
    expect(step2).not.toContain("required");
    expect(step2).not.toMatch(/<textarea|<select/);
  });

  it("the body sent carries the needs as short strings, and nothing chosen sends empty values", () => {
    expect(form).toContain("onSend({ ...v, ...needsBody(");
    expect(needsBody({ experience: "3-5", certificates: ["Fagbrev", "HMS-kort"], norwegian: "professional", english: "elementary", licence: "B", requirements: "Massivtre" })).toEqual({
      experience: "3-5",
      certificates: "Fagbrev, HMS-kort",
      norwegian: "professional",
      english: "elementary",
      licence: "B",
      requirements: "Massivtre",
    });
    expect(Object.values(needsBody(EMPTY_NEEDS)).every((v) => v === "")).toBe(true);
  });

  it("the route passes the needs on to the ATS, cut short, and ignores anything else", () => {
    const route = readFileSync(path.join(__dirname, "../../app/api/min-side/[token]/route.ts"), "utf8");
    expect(route).toContain("...needsFromRaw(raw)");
    const out = needsFromRaw({ experience: "3-5", certificates: "x".repeat(900), norwegian: 7, licence: "B", requirements: "y".repeat(400), other: "z" });
    expect(out).toEqual({ experience: "3-5", certificates: "x".repeat(500), norwegian: "", english: "", licence: "B", requirements: "y".repeat(200) });
  });

  it("offers the trade's own certificates first, then the common ones, five at most", () => {
    expect(certificatesForTrade("Elektriker")).toEqual(["FSE-kurs", "Fagbrev", "HMS-kort", "Arbeid i høyden", "Varme arbeider"]);
    expect(certificatesForTrade("Sveiser")[0]).toBe("Sveisesertifikat");
    expect(certificatesForTrade("Maskinfører")[0]).toBe("Maskinførerbevis");
    expect(certificatesForTrade("Tømrer")).toEqual(["Fagbrev", "HMS-kort", "Arbeid i høyden", "Varme arbeider"]);
    expect(certificatesForTrade("Rørlegger")).toEqual(["Varme arbeider", "Fagbrev", "HMS-kort", "Arbeid i høyden"]);
  });

  it("uses the keys the ATS accepts", () => {
    expect(EXPERIENCE_CHOICES.map((c) => c.key)).toEqual(["0-2", "3-5", "5+"]);
    expect(LANGUAGE_CHOICES.map((c) => c.key)).toEqual(["not_required", "elementary", "professional", "full_professional"]);
    expect(LICENCE_CHOICES.map((c) => c.key)).toEqual(["none", "B", "BE", "C/CE"]);
  });
});
