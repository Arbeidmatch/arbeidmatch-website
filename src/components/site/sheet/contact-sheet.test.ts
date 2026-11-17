import { describe, expect, it } from "vitest";

import { CONTACT_SUBJECTS, messageWithSubject } from "./ContactSheet";

describe("the contact message carries the chosen Gjelder (ORDER 296)", () => {
  it("offers the three subjects, price and terms first", () => {
    expect([...CONTACT_SUBJECTS]).toEqual(["Pris og vilkår", "Et oppdrag", "Noe annet"]);
  });

  it("puts the chosen subject in front of the message", () => {
    expect(messageWithSubject("Pris og vilkår", "Hva koster en tømrer?")).toBe("Gjelder: Pris og vilkår\n\nHva koster en tømrer?");
    expect(messageWithSubject("Et oppdrag", "Hei")).toMatch(/^Gjelder: Et oppdrag\n/);
  });

  it("leaves the message as typed when nothing, or something unknown, is chosen", () => {
    expect(messageWithSubject("", "Hei")).toBe("Hei");
    expect(messageWithSubject("<script>", "Hei")).toBe("Hei");
  });
});
