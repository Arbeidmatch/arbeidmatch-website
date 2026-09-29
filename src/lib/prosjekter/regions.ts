/**
 * Norway's counties by their NUTS 3 code, as the ATS stores a project's place.
 * A copy of the ATS table, identical in behaviour. The last three are the
 * counties of 2020 to 2023, which older projects still carry.
 */
export const NORWAY_REGIONS: Record<string, string> = {
  NO081: "Oslo",
  NO084: "Akershus",
  NO083: "Østfold",
  NO085: "Buskerud",
  NO093: "Vestfold",
  NO094: "Telemark",
  NO020: "Innlandet",
  NO092: "Agder",
  NO0A1: "Rogaland",
  NO0A2: "Vestland",
  NO0A3: "Møre og Romsdal",
  NO060: "Trøndelag",
  NO071: "Nordland",
  NO072: "Troms",
  NO073: "Finnmark",
  NO082: "Viken",
  NO091: "Vestfold og Telemark",
  NO074: "Troms og Finnmark",
};

/** An old county and the counties it became, so a client in Drammen fits a Viken project. */
export const LEGACY_REGIONS: Record<string, string[]> = {
  NO082: ["NO083", "NO084", "NO085"],
  NO091: ["NO093", "NO094"],
  NO074: ["NO072", "NO073"],
};

export type FutureProjectStage = "planned" | "tender" | "awarded" | "cancelled";

export function expandRegions(regions: string[]): string[] {
  return [...new Set(regions.flatMap((r) => [r, ...(LEGACY_REGIONS[r] ?? [])]))];
}
