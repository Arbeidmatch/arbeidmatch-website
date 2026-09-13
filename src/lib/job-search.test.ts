import { describe, expect, it } from "vitest";
import { filterJobSearch } from "./job-search";

const jobs = [
  { title: "Car mechanic", category: "Automotive", location: "Trondheim" },
  { title: "Car mechanic", category: "Automotive", location: "Strømmen" },
  { title: "Painter", category: "Construction", location: "Trondheim" },
];

describe("homepage job search", () => {
  it("combines trade and location instead of returning the whole board", () => {
    expect(filterJobSearch(jobs, "mechanic", "Trondheim")).toEqual([jobs[0]]);
  });
  it("matches Norwegian trade aliases and normalized town names", () => {
    expect(filterJobSearch(jobs, "bilmekaniker", " Strommen ")).toEqual([jobs[1]]);
  });
  it("supports either filter alone and empty searches", () => {
    expect(filterJobSearch(jobs, "", "Trondheim")).toEqual([jobs[0], jobs[2]]);
    expect(filterJobSearch(jobs, "PAINTER", "")).toEqual([jobs[2]]);
    expect(filterJobSearch(jobs, "  ", "")).toEqual(jobs);
  });
  it("does not substitute unrelated jobs when there is no match", () => {
    expect(filterJobSearch(jobs, "welder", "Trondheim")).toEqual([]);
    expect(filterJobSearch(jobs, "mechanic", "Bergen")).toEqual([]);
  });
});
