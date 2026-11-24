import type { ReactNode } from "react";
import type { SiteNumbers } from "@/lib/numbers";

/**
 * Numbers as RecOS answered them on 24 November 2026, for tests only (ORDER
 * 302): a component test renders with these instead of reaching RecOS. The site
 * itself never holds them.
 */
export const TODAY_NUMBERS: SiteNumbers = {
  reply_promise_contact: 1,
  reply_hours_helper: 24,
  reply_days_employer_request_min: 1,
  reply_days_employer_request_max: 2,
  reply_hours_partner: 48,
  reply_days_invite: 7,
  first_profiles_weeks: 2,
  wage_electrician_min: 260,
  wage_electrician_certified_min: 290,
  wage_electrician_max: 330,
  wage_welder_min: 280,
  wage_welder_max: 330,
  early_bird_profiles_nok: 100,
  early_bird_hire_nok: 1000,
  recommend_limit_firms: 5,
  premium_trial_hours: 24,
  vat_pct_shown: 25,
  company_org_number: "935 667 089",
  company_street_address: "Sverre Svendsens veg 38",
  company_opening_hours: "Mo-Fr 08:00-16:00",
  ad_max_days: 42,
  ad_extend_days: 30,
  payment_term_days_default: 14,
  project_alerts_trial_until: "2026-12-31",
  hiring_plans_from: "2027-01-01",
  alerts_trial_max_users: 3,
};

/** For vi.mock("@/components/NumbersProvider", ...): the hook answers TODAY_NUMBERS. */
export const mockedNumbersProvider = {
  NumbersProvider: ({ children }: { numbers: SiteNumbers; children: ReactNode }) => children,
  useSiteNumbers: () => TODAY_NUMBERS,
};
