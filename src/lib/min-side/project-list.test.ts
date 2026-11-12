import { describe, expect, it } from "vitest";

import type { MinSideProject } from "@/lib/min-side/profile";
import {
  INITIAL_LIST,
  LIST_PAGE,
  dateCell,
  isNew,
  listRows,
  matchesSearch,
  neighbours,
  pageForId,
  pageOf,
  varslerHash,
  varslerRoute,
  withList,
  type ListState,
} from "./project-list";

const NOW = Date.parse("2026-11-12T12:00:00Z");

function project(n: number, part: Partial<MinSideProject> = {}): MinSideProject {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title: `Prosjekt ${n}`,
    stage: "awarded",
    buyer_name: "Trondheim kommune",
    regions: ["NO060"],
    city: "Trondheim",
    domains: ["finishing"],
    description: null,
    estimated_value_nok: null,
    awarded_value_nok: n * 1_000_000,
    published_on: `2026-10-${String((n % 28) + 1).padStart(2, "0")}`,
    deadline_at: null,
    documents_url: null,
    winners: [`Entreprenør ${n} AS`],
    place: "Trondheim",
    ...part,
  };
}

describe("the Prosjektvarsler list (ORDER 273)", () => {
  it("shows the date each stage cares about", () => {
    expect(dateCell(project(1, { stage: "tender", deadline_at: "2026-11-14T10:00:00Z" }))).toBe("Frist 14.11.");
    expect(dateCell(project(1, { stage: "awarded", published_on: "2026-10-02" }))).toBe("Tildelt 02.10.");
    expect(dateCell({ ...project(1, { stage: "planned", published_on: null }), start_on: "2027-03-01" })).toBe("Ventes mars");
    expect(dateCell(project(1, { published_on: null }))).toBe("");
  });

  it("marks Ny only after the last letter, and nothing without one", () => {
    expect(isNew({ first_seen_at: "2026-11-10T08:00:00Z" }, "2026-11-09T07:00:00Z")).toBe(true);
    expect(isNew({ first_seen_at: "2026-11-08T08:00:00Z" }, "2026-11-09T07:00:00Z")).toBe(false);
    expect(isNew({ first_seen_at: "2026-11-10T08:00:00Z" }, null)).toBe(false);
  });

  it("searches the title, the byggherre and the entreprenør, without regard to case or accents", () => {
    const p = project(3, { title: "Ny skole på Ørland", buyer_name: "Ørland kommune", winners: ["Malerfirma Hansen AS"] });
    expect(matchesSearch(p, "skole")).toBe(true);
    expect(matchesSearch(p, "ØRLAND")).toBe(true);
    expect(matchesSearch(p, "hansen skole")).toBe(true);
    expect(matchesSearch(p, "tømrer")).toBe(false);
    expect(matchesSearch(p, "  ")).toBe(true);
  });

  it("sorts newest first by default, by value on request, with missing values last either way", () => {
    const rows = [project(1), project(5), project(3), project(9, { awarded_value_nok: null, published_on: null })];
    expect(listRows(rows, INITIAL_LIST, NOW).map((p) => p.title)).toEqual(["Prosjekt 5", "Prosjekt 3", "Prosjekt 1", "Prosjekt 9"]);
    const asc: ListState = { ...INITIAL_LIST, sort: { key: "value", dir: "asc" } };
    expect(listRows(rows, asc, NOW).map((p) => p.title)).toEqual(["Prosjekt 1", "Prosjekt 3", "Prosjekt 5", "Prosjekt 9"]);
  });

  it("filters by stage (a tender past its deadline waits for the award) and by town", () => {
    const rows = [project(1, { stage: "tender", deadline_at: "2026-11-01T00:00:00Z" }), project(2, { stage: "tender", deadline_at: "2026-12-01T00:00:00Z" }), project(3, { place: "Malvik" })];
    expect(listRows(rows, { ...INITIAL_LIST, stage: "closed" }, NOW).map((p) => p.title)).toEqual(["Prosjekt 1"]);
    expect(listRows(rows, { ...INITIAL_LIST, stage: "tender" }, NOW).map((p) => p.title)).toEqual(["Prosjekt 2"]);
    expect(listRows(rows, { ...INITIAL_LIST, town: "malvik" }, NOW).map((p) => p.title)).toEqual(["Prosjekt 3"]);
  });

  it("pages by 20 and holds the page inside the pages there are", () => {
    const rows = Array.from({ length: 45 }, (_, i) => project(i + 1));
    expect(LIST_PAGE).toBe(20);
    expect(pageOf(rows, 1).rows).toHaveLength(20);
    expect(pageOf(rows, 3)).toMatchObject({ page: 3, pages: 3 });
    expect(pageOf(rows, 3).rows).toHaveLength(5);
    expect(pageOf(rows, 99).page).toBe(3);
    expect(pageOf([], 4)).toMatchObject({ page: 1, pages: 1, rows: [] });
  });

  it("starts at page 1 when a filter or the sort changes, and keeps the page otherwise", () => {
    const s: ListState = { ...INITIAL_LIST, page: 3 };
    expect(withList(s, { q: "skole" }).page).toBe(1);
    expect(withList(s, { sort: { key: "value", dir: "desc" } }).page).toBe(1);
    expect(withList(s, { q: "" }).page).toBe(3);
    expect(withList(s, { page: 2 }).page).toBe(2);
  });
});

describe("Forrige, Neste and the way back to the list", () => {
  const rows = listRows(
    Array.from({ length: 45 }, (_, i) => project(i + 1)),
    INITIAL_LIST,
    NOW,
  );

  it("walks the list as filtered and sorted, disabled at the ends", () => {
    const first = neighbours(rows, rows[0].id);
    expect(first).toMatchObject({ index: 1, total: 45, prev: null, next: rows[1].id });
    const last = neighbours(rows, rows[44].id);
    expect(last).toMatchObject({ index: 45, prev: rows[43].id, next: null });
    expect(neighbours(rows, "missing")).toMatchObject({ prev: null, next: null, index: 0 });
  });

  it("comes back to the page the project is on, also after Neste crossed a page end", () => {
    expect(pageForId(rows, rows[0].id)).toBe(1);
    expect(pageForId(rows, rows[19].id)).toBe(1);
    // Neste from the last row of page 1 opens the first of page 2: going back shows page 2.
    expect(pageForId(rows, neighbours(rows, rows[19].id).next!)).toBe(2);
    expect(pageForId(rows, "missing")).toBeNull();
  });
});

describe("the address carries the open project (#varsler/<id>)", () => {
  const a = "00000000-0000-4000-8000-0000000000aa";
  const b = "00000000-0000-4000-8000-0000000000bb";

  it("reads the list, one project, the settings and one level of them", () => {
    expect(varslerRoute("#varsler")).toEqual({ view: "list" });
    expect(varslerRoute(`#varsler/${a}`)).toEqual({ view: "project", id: a });
    expect(varslerRoute("#varsler/innstillinger")).toEqual({ view: "settings", level: null });
    expect(varslerRoute("#varsler/innstillinger/fag")).toEqual({ view: "settings", level: "fag" });
    expect(varslerRoute("#varsler/innstillinger/x")).toEqual({ view: "settings", level: null });
    expect(varslerRoute("#varsler/<script>")).toEqual({ view: "list" });
    expect(varslerRoute("#firma")).toBeNull();
    expect(varslerRoute("")).toBeNull();
  });

  it("writes what it reads, so a reload opens the same project again", () => {
    for (const r of [{ view: "list" as const }, { view: "project" as const, id: a }, { view: "settings" as const, level: null }, { view: "settings" as const, level: "byer" as const }]) {
      expect(varslerRoute(varslerHash(r))).toEqual(r);
    }
  });

  it("holds one detail at a time: opening B after A leaves only B in the address", () => {
    // The address is the only record of what is open; a second open replaces the first.
    let hash = varslerHash({ view: "project", id: a });
    hash = varslerHash({ view: "project", id: b });
    expect(varslerRoute(hash)).toEqual({ view: "project", id: b });
    expect(hash).not.toContain(a);
  });
});
