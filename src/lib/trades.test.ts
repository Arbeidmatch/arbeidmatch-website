import { describe, expect, it } from "vitest";
import { tradeFromTitle } from "./trades";

/** The eight titles that were open on 3 September 2026, exactly as they read. */
const LIVE = [
  "Concrete workers - Rindal, Norway",
  "Carpenter wood structures - Bergen, Norway",
  "Car Mechanic (Bilmekaniker) - Bergen & Haugesund, Norway",
  "Bricklayer in Trondheim",
  "Car mechanic",
  "Car mechanics (Norway - multiple locations)",
  "Precast Concrete Factory Worker",
  "Electricians with DSB Certification, Projects in Norway",
];

describe("tradeFromTitle", () => {
  it("names the trade on every advert we currently have", () => {
    expect(LIVE.map(tradeFromTitle)).toEqual([
      "Concrete worker",
      "Carpenter",
      "Car mechanic",
      "Bricklayer",
      "Car mechanic",
      "Car mechanic",
      "Concrete worker",
      "Electrician",
    ]);
  });

  it("reads a car mechanic as a car mechanic, not as a mechanic of something else", () => {
    // The order in the table exists for this: "bilmekaniker" contains
    // "mekaniker", and a generic machine-operator rule placed first would take
    // three of our eight adverts.
    expect(tradeFromTitle("Bilmekaniker til verksted i Bergen")).toBe("Car mechanic");
  });

  it("reads the Norwegian word as the same trade as the English one", () => {
    // Otherwise the same job in two languages makes two pages.
    expect(tradeFromTitle("Tømrer søkes til Bergen")).toBe("Carpenter");
    expect(tradeFromTitle("Murer, Trondheim")).toBe("Bricklayer");
    expect(tradeFromTitle("Sveiser til industri")).toBe("Welder");
  });

  it("says nothing rather than inventing a trade", () => {
    // A page named after a guess is a page nobody searches for, holding one
    // advert. Better to have no page.
    expect(tradeFromTitle("Two people needed for a project")).toBeNull();
    expect(tradeFromTitle("")).toBeNull();
    expect(tradeFromTitle(null)).toBeNull();
  });
});
