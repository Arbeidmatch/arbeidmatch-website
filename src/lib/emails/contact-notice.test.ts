import { describe, expect, it } from "vitest";

import { contactNoticeLetter } from "@/lib/emails/letters";

const base = { name: "Test Person", email: "test@example.invalid", message: "Hei", isSupport: false, to: "post@example.invalid" };

describe("the contact notice subject", () => {
  it("says a job seeker is one, and keeps the opening the ATS reads", () => {
    const l = contactNoticeLetter({ ...base, company: "Not provided", need: "Candidate inquiry" });
    expect(l.subject).toBe("New contact message: Test Person (jobbsøker)");
    expect(l.subject.toLowerCase().startsWith("new contact message:")).toBe(true);
  });

  it("names the company for a client", () => {
    const l = contactNoticeLetter({ ...base, company: "Eksempel AS (org.nr 935 667 089)", need: "Employer request" });
    expect(l.subject).toBe("New contact message: Test Person from Eksempel AS (org.nr 935 667 089)");
  });
});
