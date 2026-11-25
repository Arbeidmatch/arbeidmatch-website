import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import MinSideAlerts from "@/components/min-side/MinSideAlerts";
import { valueFactsOf } from "@/lib/min-side/project-detail";
import { INITIAL_LIST, townChips, townOf } from "@/lib/min-side/project-list";
import type { Alerts, MinSideProject } from "@/lib/min-side/profile";

/**
 * ORDER 505 (25 November 2026): Min side shows each project with the facts the
 * owner sees in his own table, and no date or town chip that is wrong or stale.
 */

const TOKEN = "00000000-0000-4000-8000-0000000000a1";
let n = 0;

function project(part: Partial<MinSideProject> = {}): MinSideProject {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title: `Prosjekt ${n}`,
    stage: "awarded",
    buyer_name: "Råde kommune",
    regions: ["NO081"],
    city: null,
    domains: ["finishing"],
    description: null,
    estimated_value_nok: null,
    awarded_value_nok: 3_000_000,
    published_on: "2026-10-02",
    deadline_at: null,
    documents_url: null,
    winners: ["Byggmester AS"],
    place: "Trondheim",
    ...part,
  };
}

function render(projects: MinSideProject[]) {
  const alerts = { plan: null, free_until: null, projects_url: null, projects, last_sent_at: null } as unknown as Alerts;
  return renderToStaticMarkup(
    createElement(MinSideAlerts, {
      token: TOKEN,
      alerts,
      route: { view: "list" },
      go: () => undefined,
      list: INITIAL_LIST,
      setList: () => undefined,
      lastOpened: null,
      scrollBack: null,
      onScrolledBack: () => undefined,
      onPlan: () => undefined,
      saveSettings: async () => ({ ok: true as const }),
      stopAlerts: async () => ({ ok: true as const }),
      onStopped: () => undefined,
    }),
  );
}

afterEach(() => vi.useRealTimers());

describe("town chips are real places, most projects first (ORDER 505)", () => {
  it("never makes a postal code a town", () => {
    expect(townOf("1640")).toBeNull();
    expect(townOf("1640 Råde")).toBe("Råde");
    expect(townOf(" Bø i Telemark ")).toBe("Bø i Telemark");
    expect(townOf("")).toBeNull();
    expect(townOf(null)).toBeNull();
  });

  it("ranks by how many of his projects are there, at most 12", () => {
    const rows = [
      ...["Aremark", "Arendal", "Oslo", "Oslo", "Oslo", "Bergen", "Bergen", "1640", "1640", "1640", "1640"].map((place) => ({ place })),
      ...Array.from({ length: 14 }, (_, i) => ({ place: `By ${String.fromCharCode(65 + i)}` })),
    ];
    const chips = townChips(rows);
    expect(chips).toHaveLength(12);
    expect(chips.slice(0, 2)).toEqual(["Oslo", "Bergen"]);
    expect(chips).not.toContain("1640");
    // Ties go by name.
    expect(chips.slice(2, 5)).toEqual(["Aremark", "Arendal", "By A"]);
  });

  it("the list shows those chips, and none with a digit", () => {
    const html = render([project({ place: "1640" }), project({ place: "Oslo" }), project({ place: "Oslo" }), project({ place: "Aremark" })]);
    const chips = [...html.matchAll(/aria-pressed="(?:true|false)"[^>]*>([^<]+)</g)].map((m) => m[1]);
    expect(chips).toEqual(["Oslo", "Aremark"]);
  });
});

describe("no stale date on the list (ORDER 505)", () => {
  it("a planned project whose month has passed says so, not Ventes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T12:00:00Z"));
    const html = render([
      project({ stage: "planned", winners: [], awarded_value_nok: null, start_on: "2026-10-01" }),
      project({ stage: "planned", winners: [], awarded_value_nok: null, start_on: "2027-02-01" }),
      project({ stage: "planned", winners: [], awarded_value_nok: null, start_on: null, published_on: "2026-11-03" }),
    ]);
    expect(html).toContain("Ventet i oktober, ikke utlyst ennå");
    expect(html).toContain("Ventes februar 2027");
    expect(html).toContain("Kunngjort 03.11.");
    expect(html).not.toMatch(/Ventes (oktober|november)</);
  });
});

describe("the values as the owner's table names them (ORDER 505)", () => {
  it("an awarded value is the contract value, an estimate is an estimate", () => {
    expect(valueFactsOf({ awarded_value_nok: 12_400_000, estimated_value_nok: 15_000_000 })).toEqual([
      { label: "Kontraktsverdi", value: "12 mill. kr" },
      { label: "Anslått verdi", value: "15 mill. kr" },
    ]);
    expect(valueFactsOf({ awarded_value_nok: null, estimated_value_nok: 2_500_000 })).toEqual([{ label: "Anslått verdi", value: "2,5 mill. kr" }]);
    const same = valueFactsOf({ awarded_value_nok: 900_000, estimated_value_nok: 900_000 });
    expect(same).toHaveLength(1);
    expect(same[0].label).toBe("Kontraktsverdi");
    expect(same[0].value).toMatch(/^900\s000 kr$/);
    expect(valueFactsOf({ awarded_value_nok: null, estimated_value_nok: null })).toEqual([]);
  });

  it("the detail shows the winner with its number, every date, the values, and never the source or a contact", () => {
    const src = readFileSync(path.join(process.cwd(), "src/components/prosjekter/ProjectDetail.tsx"), "utf8");
    expect(src).toContain("valueFactsOf(project)");
    expect(src).toContain("Org.nr");
    for (const label of ["Tilbud mottatt", "Kontrakt signert", "Varighet", "Byggestart og slutt", "Prosjektnr."]) expect(src).toContain(label);
    expect(src).not.toMatch(/Doffin|contact_|kontaktperson/i);
  });
});
