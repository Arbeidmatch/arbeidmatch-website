import type { PublicJob } from "./jobs-fetch";
import { tradeFromTitle } from "./trades";

function normalize(value: string): string {
  return value.toLowerCase().replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "a")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

/** Match both filters against public job fields, including Norwegian trade names. */
export function filterJobSearch<T extends Pick<PublicJob, "title" | "category" | "location">>(
  jobs: T[], search: string, location: string,
): T[] {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  const requestedTrade = tradeFromTitle(search);
  const town = normalize(location);
  return jobs.filter(job => {
    const text = normalize(`${job.title} ${job.category ?? ""}`);
    const roleMatches = words.every(word => text.includes(word))
      || (requestedTrade !== null && tradeFromTitle(job.title) === requestedTrade);
    return roleMatches && (!town || normalize(job.location ?? "") === town);
  });
}
