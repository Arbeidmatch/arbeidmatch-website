/**
 * What the client reads when a call to the ATS does not go through.
 *
 * The ATS answers errors in English for its own log ("order not found", "the
 * posting rules have changed; ..."). None of that is shown as it is: a client
 * gets one calm Norwegian sentence that says what to do next.
 */

const KNOWN: { match: RegExp; message: string }[] = [
  { match: /posting rules have changed/i, message: "Annonsereglene er oppdatert. Les dem på nytt og godta den gjeldende versjonen." },
  { match: /rules must be accepted/i, message: "Dere må godta annonsereglene før annonsen kan sendes." },
  { match: /organisation number must have nine digits/i, message: "Organisasjonsnummeret må ha ni siffer." },
  { match: /organisation number cannot change/i, message: "Organisasjonsnummeret kan ikke endres på en bestilling. Start en ny annonse for et annet firma." },
  { match: /too many adverts from this organisation/i, message: "Det er sendt mange annonser fra dette firmaet i dag. Prøv igjen i morgen, eller kontakt oss på post@arbeidmatch.no." },
  { match: /too many rounds/i, message: "Annonsen har vært til kontroll mange ganger. Kontakt oss på post@arbeidmatch.no, så hjelper vi dere." },
  { match: /cannot be changed now/i, message: "Annonsen kan ikke endres nå." },
  { match: /payment is not open/i, message: "Betaling er ikke åpen for denne bestillingen nå. Last inn siden på nytt." },
  { match: /amount does not match/i, message: "Beløpet stemmer ikke med bestillingen. Vi ser på saken og tar kontakt." },
  { match: /not waiting for a card payment/i, message: "Bestillingen venter ikke på kortbetaling. Last inn siden på nytt." },
  { match: /order not found/i, message: "Vi finner ikke denne bestillingen. Kontroller lenken." },
  { match: /advert too large/i, message: "Annonsen er for lang. Kort ned teksten og prøv igjen." },
];

/**
 * The review answered too late for the page. The order may well exist, so the
 * client is told not to send it again blind: a second send is a second order.
 */
export const SLOW_REVIEW_MESSAGE =
  "Kontrollen tar lengre tid enn vanlig, og annonsen kan allerede være mottatt. Vent et par minutter og skriv til post@arbeidmatch.no før dere sender den på nytt, så sjekker vi den for dere.";

export function norwegianError(status: number, raw?: string | null): string {
  const text = String(raw ?? "");
  for (const k of KNOWN) if (k.match.test(text)) return k.message;
  if (status === 404) return "Vi finner ikke denne bestillingen. Kontroller lenken.";
  if (status === 409) return "Bestillingen er endret i mellomtiden. Last inn siden på nytt.";
  if (status === 429) return "For mange forsøk på kort tid. Vent litt og prøv igjen.";
  if (status === 400) return "Noe i annonsen mangler eller er feil. Se over feltene og prøv igjen.";
  return "Vi får ikke kontakt med systemet vårt akkurat nå. Prøv igjen om et minutt.";
}
