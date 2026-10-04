import { describe, expect, it } from "vitest";
import { roleWithoutCity } from "./job-title";

/**
 * THE CITY ONCE (REPAIR R27 addendum, 4 October 2026).
 *
 * A quick job's title already carries the city - "Flislegger - Trondheim" -
 * and the page appended " in Trondheim" on top of it, so the browser tab, the
 * search result and the Facebook link preview all read "Flislegger -
 * Trondheim in Trondheim | ArbeidMatch".
 */
describe("the role, with the city taken off", () => {
  it("drops a trailing city however it was joined on", () => {
    expect(roleWithoutCity("Flislegger - Trondheim", "Trondheim")).toBe("Flislegger");
    expect(roleWithoutCity("Flislegger, Trondheim", "Trondheim")).toBe("Flislegger");
    expect(roleWithoutCity("Flislegger Trondheim", "Trondheim")).toBe("Flislegger");
    expect(roleWithoutCity("Pusser (murpuss) - Trondheim", "Trondheim")).toBe("Pusser (murpuss)");
  });

  it("does not care how either was capitalised", () => {
    expect(roleWithoutCity("Flislegger - TRONDHEIM", "trondheim")).toBe("Flislegger");
  });

  it("leaves a title that does not end in the city alone", () => {
    expect(roleWithoutCity("Flislegger", "Trondheim")).toBe("Flislegger");
    expect(roleWithoutCity("Trondheim flislegger", "Trondheim")).toBe("Trondheim flislegger");
    // The city in the middle is part of the sentence, not a suffix.
    expect(roleWithoutCity("Flislegger Trondheim sentrum", "Trondheim")).toBe("Flislegger Trondheim sentrum");
  });

  /** A title stripped to nothing is worse than one that repeats itself. */
  it("keeps the whole title when the city is all there is", () => {
    expect(roleWithoutCity("Trondheim", "Trondheim")).toBe("Trondheim");
    expect(roleWithoutCity("- Trondheim", "Trondheim")).toBe("- Trondheim");
  });

  it("does nothing without both halves", () => {
    expect(roleWithoutCity("Flislegger - Trondheim", "")).toBe("Flislegger - Trondheim");
    expect(roleWithoutCity(null, "Trondheim")).toBe("");
    expect(roleWithoutCity("Flislegger - Trondheim", null)).toBe("Flislegger - Trondheim");
  });
});
