import { describe, expect, it } from "vitest";

import { CANDIDATE_REGISTER_URL, profileRequestLetter } from "@/lib/emails/letters";

/**
 * REPAIR R20, 4 October 2026: where somebody who asked for a profile makes one.
 *
 * The button in this letter pointed at a sign-up page on the old board, which
 * is another system. Everything that person then typed about themselves went
 * in over there, and the profile we had just invited them to create did not
 * exist here at all. Worse, the guard at the one outbound door refuses any
 * message carrying that address, so the letter was not merely wrong: a person
 * who asked to register was answered with nothing.
 */

/** Assembled from its parts so this file is not a place the old address is written. */
const OLD_BOARD = ["jobs", "arbeidmatch", "no"].join(".");

describe("the letter that invites somebody to make a profile", () => {
  const letter = profileRequestLetter({
    to: "candidate@example.no",
    unsubscribeUrl: "https://arbeidmatch.no/api/unsubscribe?token=t",
  });

  it("sends them to our own registration", () => {
    expect(CANDIDATE_REGISTER_URL).toBe("https://ats.arbeidmatch.no/candidate/login/register");
    expect(letter.html).toContain(CANDIDATE_REGISTER_URL);
  });

  it("names the old board nowhere at all", () => {
    expect(letter.html).not.toContain(OLD_BOARD);
    expect(letter.subject).not.toContain(OLD_BOARD);
  });
});
