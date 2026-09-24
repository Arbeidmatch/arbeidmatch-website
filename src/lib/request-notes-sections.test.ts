import { describe, expect, it } from "vitest";
import { contactRoleFrom, notesLists } from "./request-notes-sections";

const NOTES = [
  "About the Position",
  "Project-specific hiring",
  "",
  "Work Tasks",
  "- Formwork and framing",
  "- Roof trusses",
  "",
  "Requirements",
  "- Qualification: 3 to 5 years",
  "",
  "Personal Qualities",
  "- Accurate",
  "- Independent",
  "",
  "We Offer",
  "- Competitive terms",
  "",
  "Additional Notes",
  "A note",
].join("\n");

describe("the lists in the wizard's notes", () => {
  it("reads each list under its heading and stops at the next block", () => {
    expect(notesLists(NOTES)).toEqual({
      workTasks: ["Formwork and framing", "Roof trusses"],
      personalQualities: ["Accurate", "Independent"],
      weOffer: ["Competitive terms"],
    });
  });

  it("gives empty lists for notes without them", () => {
    expect(notesLists("")).toEqual({ workTasks: [], personalQualities: [], weOffer: [] });
    expect(notesLists(null).workTasks).toEqual([]);
  });

  it("finds the contact person's role in the requirements", () => {
    expect(contactRoleFrom("Rotation schedule: No\nContact person's role: Daglig leder")).toBe("Daglig leder");
    expect(contactRoleFrom("nothing here")).toBe("");
  });
});
