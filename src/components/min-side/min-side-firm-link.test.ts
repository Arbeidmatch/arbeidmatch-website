import { describe, expect, it } from "vitest";

import { firmFromSearch, withFirmParam } from "@/lib/min-side/profile";

/**
 * ORDER 244 ADDED 1: one click on a firm, from a list or a letter's button,
 * opens its card, and the card has its own address (?firm=<orgnr>) so it can
 * be shared and reopened. Invented org numbers.
 */
describe("the firm card's own address", () => {
  it("reads a nine-digit firm only", () => {
    expect(firmFromSearch("?firm=912345678")).toBe("912345678");
    expect(firmFromSearch("?hiring=agency&firm=912345678")).toBe("912345678");
    expect(firmFromSearch("?firm=12345")).toBeNull();
    expect(firmFromSearch("?firm=91234567x")).toBeNull();
    expect(firmFromSearch("")).toBeNull();
  });

  it("sets the firm while a card is open and takes it off when it closes, keeping the rest", () => {
    expect(withFirmParam("https://www.arbeidmatch.no/min-side/k#ansetter", "912345678")).toBe("/min-side/k?firm=912345678#ansetter");
    expect(withFirmParam("https://www.arbeidmatch.no/min-side/k?firm=912345678#ansetter", null)).toBe("/min-side/k#ansetter");
    expect(withFirmParam("https://www.arbeidmatch.no/min-side/k?x=1&firm=1#ansetter", "912345678")).toBe("/min-side/k?x=1&firm=912345678#ansetter");
  });
});
