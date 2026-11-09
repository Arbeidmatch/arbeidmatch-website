import { describe, expect, it } from "vitest";

import { warmAnswers } from "@/components/rask-foresporsel/RaskForesporselDialog";

import { isWarmTicket, readWarmOpen, warmServiceKept } from "./warm-request";

const T = "0b6f3e1c-1d2e-4c5b-9a8f-7e6d5c4b3a21";
const q = (o: Record<string, string>) => new URLSearchParams(o);

describe("a Ja from a warm-request letter", () => {
  it("opens only on a ticket marked warm_request", () => {
    expect(readWarmOpen(q({ rask: T }))).toBeNull();
    expect(readWarmOpen(q({ rask: "x", kilde: "warm_request" }))).toBeNull();
    expect(readWarmOpen(q({ rask: T, kilde: "warm_request" }))?.ticket).toBe(T);
  });

  it("reads the role, the county by its code and the place", () => {
    const o = readWarmOpen(q({ rask: T, kilde: "warm_request", fag: "bygg", rolle: "tømrer", fylke: "NO060", sted: "Trondheim", tjenester: "recruitment" }))!;
    expect(o).toMatchObject({ trade: "bygg", role: "tømrer", county: "Trøndelag", town: "Trondheim", services: ["recruitment"] });
  });

  it("never lets hire-in through for a firm offered recruitment only", () => {
    const only = readWarmOpen(q({ rask: T, kilde: "warm_request", tjenester: "recruitment" }))!;
    expect(warmServiceKept(only, "staffing")).toBe("recruitment");
    const both = readWarmOpen(q({ rask: T, kilde: "warm_request", tjenester: "recruitment,staffing" }))!;
    expect(warmServiceKept(both, "staffing")).toBe("staffing");
    expect(readWarmOpen(q({ rask: T, kilde: "warm_request", tjenester: "staffing" }))!.services).toEqual(["recruitment", "staffing"]);
  });

  it("fills the popup with the firm from the ticket and the role from the letter", () => {
    const o = readWarmOpen(q({ rask: T, kilde: "warm_request", fag: "bygg", rolle: "tømrer", fylke: "NO060", sted: "Trondheim" }))!;
    const a = warmAnswers(o, { company: "TEST Varme Bygg AS", org_number: "000 000 237", email: "post@test.invalid" });
    expect(a).toMatchObject({ answerMode: "rolle", trade: "bygg", roles: ["Tømrer"], county: "Trøndelag", town: "Trondheim", email: "post@test.invalid" });
    expect(a.company).toEqual({ name: "TEST Varme Bygg AS", orgNumber: "000000237" });
    const other = warmAnswers({ ...o, role: "taktekker", town: "Røros" }, null);
    expect(other).toMatchObject({ otherRoleChosen: true, otherRole: "Taktekker", town: "Annet sted i fylket", company: null });
  });

  it("knows its ticket", () => {
    expect(isWarmTicket({ how_did_you_hear: "warm_request" })).toBe(true);
    expect(isWarmTicket({ how_did_you_hear: "presentation" })).toBe(false);
  });
});
