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
 *
 * HIS CORRECTION, 20 November 2026 (ORDER 426): "inregistrarea si logarea se
 * fac prin site nu prin ats". The candidate signs in on this site, at
 * /candidate-login, drawn like RecOS's staff sign-in; RecOS opens the session
 * behind it and its old /candidate/login only sends people here.
 */
export const CANDIDATE_PORTAL_LOGIN_URL = "/candidate-login" as const;

/** The same page with the site's host, for letters and anything read outside the site. */
export const CANDIDATE_PORTAL_LOGIN_ABSOLUTE_URL = "https://www.arbeidmatch.no/candidate-login" as const;

/** Where a candidate with no profile yet goes. The ATS points at this same page. */
export const CANDIDATE_PORTAL_SIGNUP_URL = "/candidate-register" as const;

/**
 * Where a letter sends somebody who asked us for a profile: the one entry gate
 * (ORDER 396), with the site's host because a letter is read outside the site.
 */
export const CANDIDATE_PORTAL_REGISTER_URL = "https://www.arbeidmatch.no/candidate-register" as const;

/**
 * ORDER 396: the letter of the one entry gate carries the single-use token
 * RecOS handed out for the answers given on /candidate-register. Since ORDER
 * 426 it opens the site's sign-in, which finishes the profile with it.
 */
export function candidateRegisterUrlWithGate(token: string): string {
  return `${CANDIDATE_PORTAL_LOGIN_ABSOLUTE_URL}?gate=${encodeURIComponent(token)}`;
}
