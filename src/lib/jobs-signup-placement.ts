/**
 * Where the "Sign Up" section sits on /jobs.
 *
 * HIS RULE, 25 September 2026: with fewer than ten jobs on the page the section
 * comes before the list, because a short list is read to the end in a moment
 * and the way to be told about the next job matters more than the scroll. With
 * ten or more, the list is what the visitor came for, so the section waits
 * after it.
 *
 * The count is the number of jobs actually shown, after any search filter, not
 * the size of the whole board.
 */
export const SIGNUP_ABOVE_LIST_BELOW = 10;

export type SignupPlacement = "above" | "below";

export function signupPlacement(jobsShown: number): SignupPlacement {
  return jobsShown < SIGNUP_ABOVE_LIST_BELOW ? "above" : "below";
}
