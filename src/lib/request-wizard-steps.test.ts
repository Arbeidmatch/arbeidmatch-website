import { describe, expect, it } from "vitest";

import { CONDITION_PAYLOAD_KEYS, withoutConditionAnswers, wizardStepOrder } from "@/lib/request-wizard-steps";

describe("wizardStepOrder", () => {
  it("keeps the full wizard for everyone who did not come from a presentation", () => {
    expect(wizardStepOrder({ shortWizard: false, skipContact: false })).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(wizardStepOrder({ shortWizard: false, skipContact: true })).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("drops pay and conditions and ends at the review for a presentation", () => {
    expect(wizardStepOrder({ shortWizard: true, skipContact: false })).toEqual([0, 1, 3, 4, 7]);
    expect(wizardStepOrder({ shortWizard: true, skipContact: true })).toEqual([1, 3, 4, 7]);
  });

  it("never contains the salary step or the three optional steps in the short wizard", () => {
    for (const skipContact of [true, false]) {
      const order = wizardStepOrder({ shortWizard: true, skipContact });
      for (const s of [2, 5, 6, 8]) expect(order).not.toContain(s);
      expect(order[order.length - 1]).toBe(7);
    }
  });
});

describe("withoutConditionAnswers", () => {
  it("empties every salary and conditions answer and keeps the rest", () => {
    const out = withoutConditionAnswers({
      token: "t",
      company: "Bygg AS",
      salary: "-",
      salaryPeriod: "Per hour",
      accommodation: "Candidate finds own",
      hasRotation: "No",
      overtime: false,
      city: "Oslo",
      subscribe: "No",
    });
    expect(out).toEqual({
      token: "t",
      company: "Bygg AS",
      salary: "",
      salaryPeriod: "",
      accommodation: "",
      hasRotation: "",
      overtime: null,
      city: "Oslo",
      subscribe: "No",
    });
  });

  it("does not add keys the submission did not have", () => {
    const out = withoutConditionAnswers({ company: "Bygg AS" });
    expect(Object.keys(out)).toEqual(["company"]);
    expect(CONDITION_PAYLOAD_KEYS).toContain("salaryFrom");
  });
});
