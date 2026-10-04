import { describe, expect, it } from "vitest";
import { splitJobAdvertLanguages } from "./job-advert-languages";

/**
 * His decision, 4 October 2026: the job page carries Norwegian and English,
 * the way finn.no does it. Two blocks, both always visible, no switcher, and
 * never a worker language - that belongs to the Facebook post alone.
 */

const both = `<p>Norsk</p><p>Vi tar inn 2 flislegger - Trondheim.</p><p>English</p><p>We are taking on 2 flislegger - Trondheim.</p>`;

describe("splitting an advert into its two halves", () => {
  it("finds both, keeps their order, and drops the heading words themselves", () => {
    const split = splitJobAdvertLanguages(both);

    expect(split?.no).toBe("<p>Vi tar inn 2 flislegger - Trondheim.</p>");
    expect(split?.en).toBe("<p>We are taking on 2 flislegger - Trondheim.</p>");
    // The page writes its own labels; the markers must not reach the reader twice.
    expect(split?.no).not.toContain("Norsk");
    expect(split?.en).not.toContain("English");
  });

  it("reads the marker in whichever tag the sanitiser left it in", () => {
    const asHeadings = both.replace("<p>Norsk</p>", "<h2>Norsk</h2>").replace("<p>English</p>", "<h3> English </h3>");
    expect(splitJobAdvertLanguages(asHeadings)?.en).toContain("We are taking on");
  });

  /**
   * Most adverts on this board are imported postings in one language and will
   * never carry markers. They must render exactly as they did before rather
   * than acquire an empty English panel.
   */
  it("answers null for an advert that is not written this way", () => {
    expect(splitJobAdvertLanguages("<p>Vi tar inn 2 flislegger.</p>")).toBeNull();
    expect(splitJobAdvertLanguages("<p>Norsk</p><p>Vi tar inn.</p>")).toBeNull();
    expect(splitJobAdvertLanguages("")).toBeNull();
    expect(splitJobAdvertLanguages(null)).toBeNull();
  });

  /** A sentence that opens with the word is not a marker. */
  it("does not split on the word used as prose", () => {
    expect(splitJobAdvertLanguages("<p>Norsk arbeidsspraak kreves.</p><p>English is an advantage.</p>")).toBeNull();
  });

  /** An empty panel under a heading reads as a page that failed to load. */
  it("answers null rather than show an empty half", () => {
    expect(splitJobAdvertLanguages("<p>Norsk</p><p>English</p><p>Only English here.</p>")).toBeNull();
  });

  /** Wrong order is not the shape we write, so it is not guessed at. */
  it("answers null when English comes first", () => {
    expect(splitJobAdvertLanguages("<p>English</p><p>We are taking on.</p><p>Norsk</p><p>Vi tar inn.</p>")).toBeNull();
  });
});
