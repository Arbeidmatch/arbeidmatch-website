import { describe, expect, it } from "vitest";
import { hasRomanian, romanianIn } from "./no-romanian-on-the-page";

/**
 * HIS WORDS, 4 October 2026: "are texte in romana desi am stabilit reguli
 * clare". Three live job pages carried the screener questions in Romanian
 * under an English heading, because the public feed served those prompts as
 * the job's requirements.
 */
describe("Romanian on a page that must not have it", () => {
  it("catches the questions that were actually live", () => {
    expect(romanianIn("Esti cetatean UE/SEE?")?.kind).toBe("word");
    expect(hasRomanian("Cand poti incepe?")).toBe(true);
    expect(hasRomanian("Ai diploma de calificare ca pusser?")).toBe(true);
  });

  it("catches properly written Romanian by its letters", () => {
    expect(romanianIn("diplomă de calificare")?.kind).toBe("letter");
    expect(hasRomanian("Angajăm flislegger")).toBe(true);
    expect(hasRomanian("experiență relevantă")).toBe(true);
  });

  /**
   * The cost of a false positive is a page that refuses to publish, so the two
   * languages the page IS written in have to pass whole.
   */
  it("lets Norwegian through", () => {
    for (const text of [
      "Vi tar inn 2 flislegger - Trondheim.",
      "Fast ansettelse. Timelønn NOK 297 for fagarbeider med fagbrev.",
      "Søknad sendes her. Førerkort er en fordel, ikke et krav.",
      "Vi tilbyr bolig og arbeidsklær. Oppstart snarest.",
    ]) {
      expect(romanianIn(text), text).toBeNull();
    }
  });

  it("lets English through", () => {
    for (const text of [
      "We are taking on 2 flislegger - Trondheim.",
      "Permanent. NOK 297 an hour for a tradesman with a trade certificate.",
      "EU/EEA citizenship required. No visa sponsorship.",
      "We review your application and contact you about the next step.",
    ]) {
      expect(romanianIn(text), text).toBeNull();
    }
  });

  it("says nothing about nothing", () => {
    expect(romanianIn("")).toBeNull();
    expect(romanianIn(null)).toBeNull();
  });
});
