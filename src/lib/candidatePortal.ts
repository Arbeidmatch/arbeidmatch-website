/**
 * Jobs portal candidate auth URLs. Use only in `href`, `router.push`, or server redirects —
 * never render these values as visible page copy.
 */
/**
 * HIS CORRECTION, 6 August 2026: the employee portal is on jobs.arbeidmatch.no/login.
 *
 * It had pointed at the ATS login since this constant was written, which is the door
 * for our own staff and not for a man who wants to see his own file. While
 * applications and employment live on the board, that is where an employee signs in,
 * and every "Employee portal" link on this site reads this one value.
 */
export const CANDIDATE_PORTAL_LOGIN_URL = "https://jobs.arbeidmatch.no/login" as const;
export const CANDIDATE_PORTAL_SIGNUP_URL = "/candidate-request" as const;
