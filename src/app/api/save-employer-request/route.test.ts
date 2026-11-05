import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The save route and the ticket a personalised presentation carries (the
 * owner, 24 September 2026). Supabase is mocked: nothing here reaches a
 * database.
 */
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  limit: vi.fn(),
  ticket: { data: null as Record<string, unknown> | null, error: null as unknown },
  inserted: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: vi.fn(async () => undefined) }));
vi.mock("@/lib/secureLogger", () => ({ logApiError: vi.fn() }));
vi.mock("@/lib/apiSecurity", async (original) => ({
  ...(await original<typeof import("@/lib/apiSecurity")>()),
  getRateLimitResult: mocks.limit,
}));

import { POST } from "./route";

const TOKEN = "11111111-2222-4333-8444-555555555555";
const DECK = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const DAY = 24 * 60 * 60 * 1000;

const valid = {
  token: TOKEN,
  company: "Test Bygg AS",
  orgNumber: "999999999",
  email: "post@testbygg.invalid",
  full_name: "Test Person",
  phone: "+47 12345678",
  hiringType: "recruitment",
  requesterKind: "own_operation",
  category: "Construction",
  position: "Carpenter",
  qualification: "Skilled",
  city: "Trondheim",
  howDidYouHear: "presentation",
};

function request(body: unknown) {
  return new NextRequest("https://www.arbeidmatch.no/api/save-employer-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fakeSupabase() {
  return {
    from: (table: string) => {
      if (table === "request_tokens") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => mocks.ticket,
        };
        return chain;
      }
      if (table === "employer_requests") {
        return {
          insert: (row: Record<string, unknown>) => {
            mocks.inserted.push(row);
            const chain = {
              select: () => chain,
              maybeSingle: async () => ({ data: { id: 42 }, error: null }),
            };
            return chain;
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inserted.length = 0;
  mocks.limit.mockReturnValue({ limited: false, retryAfterSeconds: 0 });
  mocks.admin.mockReturnValue(fakeSupabase());
  mocks.ticket = {
    data: {
      how_did_you_hear: "presentation",
      created_at: new Date(Date.now() - 2 * DAY).toISOString(),
      expires_at: new Date(Date.now() + 28 * DAY).toISOString(),
      used: false,
    },
    error: null,
  };
});

describe("save-employer-request with a presentation's ticket", () => {
  it("saves the request and records the source and the deck for the ATS", async () => {
    const response = await POST(request({ ...valid, deck: DECK }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, referenceId: "AM-ER-2026-00042" });
    const row = mocks.inserted[0];
    expect(row.token_id).toBe(TOKEN);
    expect(row.how_did_you_hear).toBe("presentation");
    const answers = row.form_answers as Record<string, unknown>;
    expect(answers.source).toBe("presentation");
    expect(answers.deck).toBe(DECK);
    expect(answers.token).toBeUndefined();
  });

  it("records the source even when the link carried no deck", async () => {
    await POST(request(valid));
    const answers = mocks.inserted[0].form_answers as Record<string, unknown>;
    expect(answers.source).toBe("presentation");
    expect(answers.deck).toBeNull();
  });

  // His rule, 28 September 2026: a presentation's ticket always opens the form, so it always saves.
  it("saves from a presentation ticket after 30 days and after an earlier request", async () => {
    mocks.ticket = {
      data: { ...mocks.ticket.data, created_at: new Date(Date.now() - 31 * DAY).toISOString(), used: true },
      error: null,
    };
    const response = await POST(request({ ...valid, deck: DECK }));
    expect(response.status).toBe(200);
    expect(mocks.inserted).toHaveLength(1);
  });

  it("keeps a website ticket as it was: no source, the deck dropped, its own answer kept", async () => {
    mocks.ticket = {
      data: { how_did_you_hear: "website-request", created_at: new Date().toISOString(), expires_at: null, used: false },
      error: null,
    };
    const response = await POST(request({ ...valid, howDidYouHear: "Google", deck: DECK }));
    expect(response.status).toBe(200);
    const row = mocks.inserted[0];
    expect(row.how_did_you_hear).toBe("Google");
    const answers = row.form_answers as Record<string, unknown>;
    expect(answers.source).toBeUndefined();
    expect(answers.deck).toBeUndefined();
  });

  it("takes the source from the ticket, never from the body", async () => {
    mocks.ticket = {
      data: { how_did_you_hear: "website-request", created_at: new Date().toISOString(), expires_at: null, used: false },
      error: null,
    };
    await POST(request({ ...valid, howDidYouHear: "presentation" }));
    const answers = mocks.inserted[0].form_answers as Record<string, unknown>;
    expect(answers.source).toBeUndefined();
  });

  it("refuses a deck that is not a presentation token", async () => {
    expect((await POST(request({ ...valid, deck: "not-a-uuid" }))).status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });
});

describe("save-employer-request and the work location", () => {
  it("keeps a place that is not in the wizard's list, as typed", async () => {
    const response = await POST(request({ ...valid, city: "  Myre, Harstad " }));
    expect(response.status).toBe(200);
    expect(mocks.inserted[0].city).toBe("Myre, Harstad");
  });

  it("refuses a location with markup and saves nothing", async () => {
    expect((await POST(request({ ...valid, city: "<b>Myre</b>" }))).status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });
});

describe("save-employer-request and a staffing request's contract type", () => {
  it("sets it from the service, never from the browser", async () => {
    const response = await POST(request({ ...valid, hiringType: "staffing", contractType: "Permanent employment" }));
    expect(response.status).toBe(200);
    const row = mocks.inserted[0];
    expect(row.contract_type).toBe("Temporary hire");
    expect((row.form_answers as Record<string, unknown>).contractType).toBe("Temporary hire");
  });

  it("drops any pay or conditions a browser sends with a staffing request", async () => {
    await POST(request({ ...valid, hiringType: "staffing", salary: "300-350", salaryFrom: "300", accommodation: "Candidate finds own" }));
    const row = mocks.inserted[0];
    expect(row.salary).toBe("");
    const answers = row.form_answers as Record<string, unknown>;
    expect(answers.salaryFrom ?? "").toBe("");
    expect(answers.accommodation ?? "").toBe("");
  });

  it("keeps the client's answer for recruitment", async () => {
    await POST(request({ ...valid, contractType: "Permanent employment" }));
    expect(mocks.inserted[0].contract_type).toBe("Permanent employment");
  });
});

describe("save-employer-request and a staffing worksite", () => {
  const site = (staffing: Record<string, unknown>) => ({ ...valid, hiringType: "staffing", roleAnswers: { staffing } });

  it("takes a staffing request with no address and no period", async () => {
    expect((await POST(request(site({})))).status).toBe(200);
    expect((await POST(request({ ...valid, hiringType: "staffing" }))).status).toBe(200);
    expect(mocks.inserted).toHaveLength(2);
  });

  it("refuses an address without a period, and saves nothing", async () => {
    const response = await POST(request(site({ worksiteStreet: "Testveien 1" })));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { fields?: string[] };
    expect(body.fields).toEqual(expect.arrayContaining(["periodFrom", "periodTo"]));
    expect(mocks.inserted).toHaveLength(0);
  });

  it("refuses an end date before the start", async () => {
    const response = await POST(request(site({ worksiteCity: "Trondheim", periodFrom: "2026-11-01", periodTo: "2026-10-01" })));
    expect(response.status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("takes an address with a full period, and keeps the raw answers out of form_answers", async () => {
    const response = await POST(
      request(site({ worksiteStreet: "Testveien 1", worksitePostcode: "7010", worksiteCity: "Trondheim", periodFrom: "2026-10-01", periodTo: "2026-10-01" })),
    );
    expect(response.status).toBe(200);
    expect((mocks.inserted[0].form_answers as Record<string, unknown>).roleAnswers).toBeUndefined();
  });
});

/** ORDER 224: "Rask forespørsel", the popup, and the pay block on both variants. */
describe("save-employer-request from the popup (sourceVariant rask)", () => {
  const rask = {
    sourceVariant: "rask",
    answerMode: "rolle",
    token: TOKEN,
    company: "Test Bygg AS",
    orgNumber: "999999999",
    email: "post@testbygg.invalid",
    trade: "bygg",
    category: "Construction",
    position: "Betongarbeider",
    numberOfPositions: "3",
    startDate: "Så snart som mulig",
    county: "Trøndelag",
    city: "Trondheim, Trøndelag",
    job_summary: "3 personer: betongarbeider, Trondheim, Trøndelag, så snart som mulig, 260-300 kr/t",
    payFrom: 260,
    payTo: 300,
    payFloorAtSubmit: 250,
    equalTreatmentConfirmed: true,
    benefits: ["Bolig uten trekk", "Kost"],
    outsideOurTrades: false,
    website: "",
  };

  it("saves a valid request marked rask, with the unasked columns empty and the pay kept", async () => {
    const response = await POST(request(rask));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, referenceId: "AM-ER-2026-00042" });
    const row = mocks.inserted[0];
    expect(row).toMatchObject({ full_name: "", phone: "", hiring_type: "", qualification: "", required_skills: [], org_number: "999999999" });
    const answers = row.form_answers as Record<string, unknown>;
    expect(answers).toMatchObject({
      sourceVariant: "rask",
      answerMode: "rolle",
      payFrom: 260,
      payTo: 300,
      payFloorAtSubmit: 250,
      benefits: ["Bolig uten trekk", "Kost"],
      outsideOurTrades: false,
    });
    expect(typeof answers.equalTreatmentConfirmedAt).toBe("string");
    expect(Number.isNaN(Date.parse(String(answers.equalTreatmentConfirmedAt)))).toBe(false);
    expect(answers.token).toBeUndefined();
  });

  it("takes Til as Fra when the client left it empty", async () => {
    await POST(request({ ...rask, payTo: null }));
    expect((mocks.inserted[0].form_answers as Record<string, unknown>).payTo).toBe(260);
  });

  it("refuses a request without the equal-treatment confirmation, and saves nothing", async () => {
    const response = await POST(request({ ...rask, equalTreatmentConfirmed: false }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "pay_conditions" });
    expect(mocks.inserted).toHaveLength(0);
  });

  it("refuses an amount under the floor, and saves nothing", async () => {
    const response = await POST(request({ ...rask, payFrom: 240 }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("Under minstelønn (250 kr per time).");
    expect(mocks.inserted).toHaveLength(0);
  });

  it("refuses Til under Fra and a malformed org.nr.", async () => {
    expect((await POST(request({ ...rask, payTo: 255 }))).status).toBe(400);
    expect((await POST(request({ ...rask, orgNumber: "12345" }))).status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("marks the trade Annet as outside our trades whatever the browser said", async () => {
    await POST(request({ ...rask, trade: "annet", category: "Other", position: "Smed", payFloorAtSubmit: null }));
    expect((mocks.inserted[0].form_answers as Record<string, unknown>).outsideOurTrades).toBe(true);
  });
});

describe("save-employer-request from the detailed form with the pay block", () => {
  const pay = { sourceVariant: "detaljert", answerMode: "detaljer", payFrom: "260", payTo: "300", payFloorAtSubmit: 250, equalTreatmentConfirmed: true, benefits: ["Kost"] };

  it("keeps the pay block next to the answers", async () => {
    const response = await POST(request({ ...valid, ...pay }));
    expect(response.status).toBe(200);
    const answers = mocks.inserted[0].form_answers as Record<string, unknown>;
    expect(answers).toMatchObject({ sourceVariant: "detaljert", answerMode: "detaljer", payFrom: 260, payTo: 300, benefits: ["Kost"] });
    expect(typeof answers.equalTreatmentConfirmedAt).toBe("string");
  });

  it("requires both amounts on the detailed variant", async () => {
    expect((await POST(request({ ...valid, ...pay, payTo: "" }))).status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("refuses it without the confirmation or under the floor", async () => {
    expect((await POST(request({ ...valid, ...pay, equalTreatmentConfirmed: false }))).status).toBe(400);
    expect((await POST(request({ ...valid, ...pay, payFrom: "200" }))).status).toBe(400);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("saves a form opened before the pay block exactly as before", async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    const answers = mocks.inserted[0].form_answers as Record<string, unknown>;
    expect(answers.sourceVariant).toBeUndefined();
    expect(answers.equalTreatmentConfirmedAt).toBeUndefined();
  });
});
