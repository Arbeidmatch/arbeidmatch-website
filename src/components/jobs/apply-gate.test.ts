import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ONE BOX, NOT TWO (REPAIR R30, 4 October 2026).
 *
 * HIS WORDS: "aici in loc de 2 casute sa fie numai una care sa le includa pe
 * amandoua". The dialog asked for the processing consent and the privacy
 * acknowledgement separately, and would not open either door until both were
 * ticked. One sentence now carries both facts.
 *
 * Read from the source: this package renders in node, with no DOM, so what can
 * be checked here is the component's text and its one piece of state. The look
 * was checked in the browser at 1440 and 390.
 */
const source = readFileSync("src/components/jobs/ApplyGateButton.tsx", "utf8");

describe("the Apply dialog's consent", () => {
  it("has exactly one checkbox", () => {
    expect(source.match(/type="checkbox"/g)?.length).toBe(1);
  });

  it("says both facts in the one sentence, with the notice still a link", () => {
    expect(source).toContain("I have read the");
    expect(source).toContain("and consent to ArbeidMatch processing my personal data to handle my application and find work for me.");
    expect(source).toContain('href="/privacy"');
  });

  it("asks for the one tick, not for two", () => {
    expect(source).toContain("Tick the box to continue.");
    expect(source).not.toContain("Tick both boxes");
  });

  /**
   * The doors open on that one tick. There is no longer a state in which a
   * person has done one half and not the other, so there is one flag.
   */
  it("opens both doors on the single tick and nothing else", () => {
    expect(source).toContain("const [accepted, setAccepted] = useState(false)");
    expect(source).not.toContain("setReadNotice");
    expect(source).not.toContain("consent && readNotice");
    expect(source.match(/aria-disabled=\{!accepted\}/g)?.length).toBe(2);
  });

  /**
   * NOTHING DOWNSTREAM LOSES A FLAG. The tick still travels as consent=1, and
   * the ATS records the processing consent, the privacy acceptance and their
   * versions from it (lib/candidate-registration-consent.ts). The second box
   * never travelled at all: it only gated this dialog.
   */
  it("still sends the consent the ATS reads", () => {
    const page = readFileSync("src/app/stilling/[slug]/page.tsx", "utf8");
    expect(page).toContain('consent: "1"');
  });
});
