import { describe, expect, it } from "vitest";
import { ACCESS_REGION_CODES, checkAccessRequest } from "./access";
const base = { company: "Demo AS", orgnr: "999999999", email: "demo@example.test", phone: "", contact_name: "Demo Test", contact_role: "Manager", website_confirmed: true, regions: ["NO060"], domains: ["electrical"] };
describe("requested project plans", () => {
  it("preserves the plan and notification choice for the owner's review", () => { const c = checkAccessRequest({ ...base, requested_plan: "regional", requested_frequency: "daily" }); expect(c.ok).toBe(true); if (c.ok) expect(c.value).toMatchObject({ requested_plan: "regional", requested_frequency: "daily" }); });
  it("keeps trial scope to one county, one trade and weekly alerts", () => { expect(checkAccessRequest({ ...base, requested_plan: "trial", requested_frequency: "weekly" }).ok).toBe(true); for (const patch of [{ regions: [] }, { domains: [] }, { requested_frequency: "daily" }, { regions: ["NO060", "NO020"] }]) expect(checkAccessRequest({ ...base, requested_plan: "trial", requested_frequency: "weekly", ...patch }).ok).toBe(false); });
  it("requires at least one county for Regional", () => { expect(checkAccessRequest({ ...base, regions: [], requested_plan: "regional" }).ok).toBe(false); });
  it("normalizes national scope rather than trusting submitted counties", () => { const c = checkAccessRequest({ ...base, requested_plan: "national" }); expect(c.ok).toBe(true); if (c.ok) expect(c.value.regions).toEqual(ACCESS_REGION_CODES); });
  it("rejects unknown plan and frequency values", () => { expect(checkAccessRequest({ ...base, requested_plan: "owner" }).ok).toBe(false); expect(checkAccessRequest({ ...base, requested_plan: "regional", requested_frequency: "instant" }).ok).toBe(false); });
});
