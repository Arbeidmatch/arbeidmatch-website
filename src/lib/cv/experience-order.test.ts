import { describe, expect, it } from "vitest";
import { dateRangeWithDuration, durationLabel, monthsBetween, sortExperienceByDate } from "@/lib/cv/schema";

describe("how long a role lasted", () => {
  it("counts a full year between the same month in two years", () => {
    expect(monthsBetween("01/2025", "01/2026")).toBe(12);
    expect(durationLabel("01/2025", "01/2026")).toBe("1 year");
  });

  it("says the years and the months that are left over", () => {
    expect(durationLabel("03/2021", "02/2024")).toBe("2 years 11 months");
    expect(durationLabel("01/2024", "06/2024")).toBe("5 months");
    expect(durationLabel("05/2024", "06/2024")).toBe("1 month");
  });

  it("counts a role inside one month as a month, not as nothing", () => {
    expect(durationLabel("05/2024", "05/2024")).toBe("1 month");
  });

  it("is empty when a date cannot be read, so the CV shows the dates alone", () => {
    expect(durationLabel("", "")).toBe("");
    expect(durationLabel("MM/YYYY", "Present")).toBe("");
    expect(durationLabel("13/2024", "01/2025")).toBe("");
    expect(dateRangeWithDuration("MM/YYYY", "Present")).toBe("MM/YYYY - Present");
  });

  it("counts a job still running up to today", () => {
    const months = monthsBetween("01/2020", "Present");
    expect(months).not.toBeNull();
    expect(months ?? 0).toBeGreaterThan(60);
  });

  it("keeps the plain date range in front, where a parser reads it", () => {
    expect(dateRangeWithDuration("01/2025", "01/2026")).toBe("01/2025 - 01/2026 (1 year)");
  });
});

describe("order of the roles", () => {
  const role = (startDate: string, endDate: string, jobTitle: string) => ({
    startDate,
    endDate,
    jobTitle,
  });

  it("puts the most recent job at the top", () => {
    const sorted = sortExperienceByDate([
      role("01/2018", "01/2020", "old"),
      role("01/2024", "Present", "current"),
      role("01/2020", "01/2024", "middle"),
    ]);
    expect(sorted.map((entry) => entry.jobTitle)).toEqual(["current", "middle", "old"]);
  });

  it("breaks a tie on the end date with the longer job", () => {
    const sorted = sortExperienceByDate([
      role("06/2023", "01/2024", "short"),
      role("01/2020", "01/2024", "long"),
    ]);
    expect(sorted.map((entry) => entry.jobTitle)).toEqual(["short", "long"]);
  });

  it("leaves a role with no readable date at the bottom, in the order it was typed", () => {
    const sorted = sortExperienceByDate([
      role("", "", "being typed"),
      role("01/2024", "Present", "current"),
      role("MM/YYYY", "", "also empty"),
    ]);
    expect(sorted.map((entry) => entry.jobTitle)).toEqual(["current", "being typed", "also empty"]);
  });
});
