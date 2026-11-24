import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  arbeidsdager,
  dayMonthNo,
  forgetNumbersForTests,
  getSiteNumbers,
  monthNo,
  nok,
  numberSpan,
  openingHoursSpec,
  orgDigits,
  replySentence,
  SITE_NUMBER_KEYS,
  weeksInWords,
  workingDays,
} from "@/lib/numbers";

/** ORDER 302: the numbers come from RecOS in one request, cached, with no typed fallback. */

const answer = (numbers: Record<string, unknown>) => new Response(JSON.stringify({ numbers }), { status: 200, headers: { "content-type": "application/json" } });

describe("getSiteNumbers", () => {
  beforeEach(() => forgetNumbersForTests());
  afterEach(() => vi.unstubAllGlobals());

  it("asks RecOS once for every key, cached 60 seconds under the numbers tag", async () => {
    const fetchMock = vi.fn(async () => answer({ reply_hours_helper: 36, company_org_number: "111 222 333", unknown_key: 5 }));
    vi.stubGlobal("fetch", fetchMock);
    const n = await getSiteNumbers();
    expect(n).toEqual({ reply_hours_helper: 36, company_org_number: "111 222 333" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate?: number; tags?: string[] } }];
    expect(url).toContain("/api/public/numbers?keys=");
    for (const key of SITE_NUMBER_KEYS) expect(url).toContain(key);
    expect(init.next).toEqual({ revalidate: 60, tags: ["numbers"] });
  });

  it("step 5: RecOS down shows the last value read, and with none at all nothing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    expect(await getSiteNumbers()).toEqual({});

    vi.stubGlobal("fetch", vi.fn(async () => answer({ reply_hours_helper: 36 })));
    expect(await getSiteNumbers()).toEqual({ reply_hours_helper: 36 });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await getSiteNumbers()).toEqual({ reply_hours_helper: 36 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    expect(await getSiteNumbers()).toEqual({ reply_hours_helper: 36 });
  });
});

describe("the phrases", () => {
  it("say the number in each language, and null with none", () => {
    expect(workingDays(1, "no")).toBe("én virkedag");
    expect(workingDays(1, "en")).toBe("one working day");
    expect(workingDays(3, "no")).toBe("3 virkedager");
    expect(workingDays(null, "en")).toBeNull();
    expect(arbeidsdager(1)).toBe("én arbeidsdag");
    expect(arbeidsdager(2)).toBe("2 arbeidsdager");
    expect(weeksInWords(2, "en")).toBe("two weeks");
    expect(weeksInWords(3, "no")).toBe("tre uker");
    expect(weeksInWords(1, "en")).toBe("one week");
    expect(weeksInWords(null, "en")).toBeNull();
    expect(numberSpan(1, 2)).toBe("1-2");
    expect(numberSpan(260, 330, " to ")).toBe("260 to 330");
    expect(numberSpan(2, 2)).toBe("2");
    expect(numberSpan(null, 2)).toBeNull();
    expect(nok(1000)).toBe("1.000");
    expect(nok(250)).toBe("250");
    expect(replySentence({ reply_promise_contact: 1 }, "no")).toBe("Vi svarer innen én virkedag.");
    expect(replySentence({ reply_promise_contact: 2 }, "en")).toBe("We reply within 2 working days.");
    expect(replySentence({}, "en")).toBeNull();
  });

  it("build the dates and the company facts", () => {
    expect(monthNo("2026-12-31")).toBe("desember");
    expect(monthNo("2027-03-31")).toBe("mars");
    expect(dayMonthNo("2027-01-01")).toBe("1. januar");
    expect(monthNo(null)).toBeNull();
    expect(orgDigits("935 667 089")).toBe("935667089");
    expect(orgDigits("12")).toBeNull();
    expect(openingHoursSpec("Mo-Fr 08:00-16:00")).toEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "16:00",
    });
    expect(openingHoursSpec("Mo-Sa 07:00-15:30")?.dayOfWeek).toHaveLength(6);
    expect(openingHoursSpec("every day")).toBeNull();
  });
});
