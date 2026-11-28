/**
 * Jobs from the Norwegian market, as RecOS serves them to this site (ORDER 514).
 *
 * A copy of the ATS's own shapes (GET /api/public/market-jobs and
 * /api/public/market-jobs/{id}). This site deploys separately, so the copy is
 * deliberate: the ATS is the one that decides what a card says, this side only
 * draws it.
 */

export type MarketSiteCard = {
  id: string;
  kind: "market";
  state: "open" | "closed";
  privateTest: boolean;
  trade: { key: string; en: string; no: string };
  title: string;
  place: string | null;
  zone: string | null;
  employer: "local employer";
  pay: string | null;
  /** Rule 2: no pay in the advert, the legal minimum with its level and source. Absent from an ATS that predates it. */
  payFloor?: StartingPay | null;
  perks: string[];
  englishWorks: boolean;
  experienceInsteadOfCertificate: boolean;
  newToday: boolean;
  positions: number;
  applyBy: string | null;
  postedAt: string | null;
  recruitmentOnly: boolean;
};

/** rate and validFrom feed Check my pay; absent from an ATS that predates it. */
export type StartingPay = { label: string; level: string; rate?: number; validFrom?: string; source: { text: string; url: string } };

export type MarketSiteDetail = MarketSiteCard & {
  requirements: string[];
  tasks: string[];
  gives: string[];
  hours: string;
  housing: { text: string; usual: string | null };
  travelToWork: string;
  travelToNorway: { text: string; usual: string | null };
  start: string;
  checkSourceUrl: string | null;
  /** Check if I fit: one yes-or-no question per requirement. Absent from an ATS that predates it. */
  fit?: FitQuestion[];
  /** Check my pay: the trade's legal minimum, also when the advert names pay. Absent from an ATS that predates it. */
  legalMinimum?: StartingPay | null;
  similar: MarketSiteCard[];
};

export type MarketJobsList = { jobs: MarketSiteCard[]; privateTest: boolean; staff: boolean };

export type MarketEventKind = "view" | "keep" | "interested" | "pass" | "send" | "recommend" | "check_source" | "report";
export type PassReason = "pay" | "place" | "trade" | "language" | "housing" | "other";
export type ReportReason = "fee" | "fraud" | "unavailable" | "wrong_info" | "below_minimum" | "discrimination" | "other";

export type FitQuestion = { id: string; text: string; addable: "certificate" | "language" | null };
export type FitVerdict = { state: "fits" | "add" | "jobs_that_fit" | "unanswered"; met: number; total: number; toAdd: string[] };
export type FitAnswer = { verdict: FitVerdict; jobsThatFit: MarketSiteCard[] };
