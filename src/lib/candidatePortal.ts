/**
 * Candidate auth URLs. Use only in `href`, `router.push`, or server redirects —
 * never render these values as visible page copy.
 */
/**
 * HIS CORRECTION, 4 September 2026: "nu este pe website ci pe ats".
 *
 * The candidate portal is the ATS's. `ats.arbeidmatch.no/candidate/login` is a real
 * page of ours — Candidate registration, email and password, magic link, Google,
 * forgot password — and behind it sit the dashboard, applications, profile,
 * timesheets and availability the candidate signs in to reach.
 *
 * `jobs.arbeidmatch.no` IS NOT OURS. It is the external board we mirror: the ATS
 * scrapes it, `BOARD_SOURCE` names it, `board-mirror-link` treats it as a foreign
 * host. Nobody's password lives there. This constant said
 * `jobs.arbeidmatch.no/login` from 6 August until today, so every "Employee portal"
 * and "Sign in to your profile" link on this site — navbar, mobile drawer,
 * /employees, the candidate account panel — sent a candidate to a stranger's login
 * page, which is exactly what he reported: on a phone he could not sign in at all.
 *
 * Do not point this at the board again, and do not point it at
 * `ats.arbeidmatch.no/login` either: that one is the staff door, with 2FA.
 */
export const CANDIDATE_PORTAL_LOGIN_URL = "https://ats.arbeidmatch.no/candidate/login" as const;

/** Where a candidate with no profile yet goes. The ATS points at this same page. */
export const CANDIDATE_PORTAL_SIGNUP_URL = "/candidate-request" as const;
