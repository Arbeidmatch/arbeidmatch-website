import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ORDER 296: the pop-up's request gets the letters the detailed form sends,
 * through the same function. The mail server, the unsubscribe list and Slack
 * are mocked: nothing here sends anything.
 */
const mocks = vi.hoisted(() => ({
  sent: [] as Record<string, unknown>[],
  smtp: true,
}));

vi.mock("@/lib/createSmtpTransporter", () => ({
  createSmtpTransporter: () =>
    mocks.smtp
      ? {
          sendMail: async (opts: Record<string, unknown>) => {
            mocks.sent.push(opts);
            return {};
          },
        }
      : null,
  authenticatedFrom: (from: string) => from,
}));
vi.mock("@/lib/emailSubscription", () => ({
  isUnsubscribed: async () => false,
  getOrCreateSubscription: async () => "token",
}));
vi.mock("@/lib/slackNotifier", () => ({ notifySlack: vi.fn(async () => undefined) }));

import { raskLetterData, sendRequestLetters } from "./request-letters";

const popup = {
  company: "Test Bygg AS",
  orgNumber: "999999999",
  email: "post@testbygg.invalid",
  full_name: "Test Person",
  category: "Construction",
  position: "Murer, Tømrer",
  numberOfPositions: "3",
  startDate: "Så snart som mulig",
  city: "Trondheim, Trøndelag",
  job_summary: "2 murer, 1 tømrer, Trondheim, Trøndelag, så snart som mulig, 260-300 kr/t",
  benefits: ["Kost", "Verktøy"],
};

beforeEach(() => {
  mocks.sent.length = 0;
  mocks.smtp = true;
});

describe("the pop-up's request letters (ORDER 296)", () => {
  it("sends the office copy and the client's receipt once each, both with the reference", async () => {
    await sendRequestLetters(raskLetterData(popup, "AM-ER-2026-ABCD1234", "260-300"));
    expect(mocks.sent).toHaveLength(2);
    const office = mocks.sent.filter((m) => m.to === "post@arbeidmatch.no");
    const receipt = mocks.sent.filter((m) => m.to === "post@testbygg.invalid");
    expect(office).toHaveLength(1);
    expect(receipt).toHaveLength(1);
    expect(office[0].subject).toBe("New candidate request: Test Bygg AS from Trondheim, Trøndelag");
    expect(office[0].html).toContain("AM-ER-2026-ABCD1234");
    expect(receipt[0].subject).toBe("Vi har mottatt forespørselen - AM-ER-2026-ABCD1234");
    expect(receipt[0].replyTo).toBe("post@arbeidmatch.no");
  });

  it("prints what the pop-up collected in the receipt: the person, the roles, the start, the place, the pay and the benefits", async () => {
    await sendRequestLetters(raskLetterData(popup, "AM-ER-2026-ABCD1234", "260-300"));
    const html = String(mocks.sent.find((m) => m.to === "post@testbygg.invalid")?.html);
    for (const value of ["Test Bygg AS", "Test Person", "2 murer, 1 tømrer", "Så snart som mulig", "Trondheim, Trøndelag", "260-300", "Per time", "Kost, Verktøy"]) {
      expect(html).toContain(value);
    }
  });

  it("throws when the mail server is not configured, so the caller can log it", async () => {
    mocks.smtp = false;
    await expect(sendRequestLetters(raskLetterData(popup, "AM-ER-2026-ABCD1234", null))).rejects.toThrow("SMTP is not configured.");
  });

  it("leaves pay and benefits out when the pop-up had none", () => {
    const data = raskLetterData({ ...popup, benefits: [] }, undefined, null);
    expect(data).toMatchObject({ salary: "", salaryPeriod: "", notes: "", referenceId: "" });
  });
});
