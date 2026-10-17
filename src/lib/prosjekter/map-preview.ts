// Public previews are deliberately independent of project records.
export const MAP_DEMO = {
  title: "Eksempel: nytt næringsbygg",
  stage: "Planlagt",
  value: "85 MNOK",
  buyer: "Eksempelbyggherre (fiktiv)",
} as const;

export function clusterTargetZoom(current: number, expansion: number, max: number): number {
  return Math.min(max, Math.max(current + 2, expansion));
}
