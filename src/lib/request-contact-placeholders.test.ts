import { describe, expect, it } from "vitest";

import { contactIsComplete, knownContactFromToken, realContactValue } from "@/lib/request-contact-placeholders";

describe("realContactValue", () => {
  it("drops the placeholders old tokens were created with", () => {
    for (const p of ["To be completed", "Employer Request", "Partner Contact", "Partner company", "N/A", "000000", "+47 000000", ""]) {
      expect(realContactValue(p)).toBe("");
    }
  });

  it("keeps real answers", () => {
    expect(realContactValue(" Bygg AS ")).toBe("Bygg AS");
    expect(realContactValue("+47 400 00 000")).toBe("+47 400 00 000");
  });
});

describe("knownContactFromToken", () => {
  it("knows nothing from a pre-fix new-company token", () => {
    const contact = knownContactFromToken({ company: "To be completed", full_name: "Employer Request", phone: "000000" });
    expect(contact).toEqual({ companyName: "", firstName: "", lastName: "", phoneDigits: "" });
    expect(contactIsComplete(contact)).toBe(false);
  });

  it("keeps a partner's company name but still asks for name and phone", () => {
    const contact = knownContactFromToken({ company: "Bygg AS", full_name: "Partner Contact", phone: "N/A", partnerCompanyName: "" });
    expect(contact.companyName).toBe("Bygg AS");
    expect(contactIsComplete(contact)).toBe(false);
  });

  it("lets the wizard skip the contact step only when everything is known", () => {
    const contact = knownContactFromToken({ company: "Bygg AS", full_name: "Kari Nordmann", phone: "+47 40000000" });
    expect(contact).toEqual({ companyName: "Bygg AS", firstName: "Kari", lastName: "Nordmann", phoneDigits: "4740000000" });
    expect(contactIsComplete(contact)).toBe(true);
  });
});
