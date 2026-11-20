/**
 * The words and the addresses of the candidate's sign-in on the site
 * (ORDER 426), in English and Norwegian only. Pure, so the tests read them.
 */

export type LoginLang = "en" | "no";

/** RecOS, where the session opens; the handover and the Google and fingerprint starters live there. */
export const RECOS_BASE = "https://ats.arbeidmatch.no";
export const HANDOVER_ACTION = `${RECOS_BASE}/api/public/candidate-sign-in/handover`;

/** What the sign-in carries on from its own address to RecOS: never anything personal. */
const CARRIED = ["next", "invite", "gate", "source", "consent"] as const;

export function safeNext(value: string | null | undefined): string {
  const v = String(value ?? "");
  return v.startsWith("/candidate/") && !v.startsWith("//") && v.length <= 400 ? v : "";
}

/** RecOS's page that starts Google or the fingerprint, with what this visit carries. */
export function signInStartHref(method: "google" | "passkey", params: { get(name: string): string | null }): string {
  const q = new URLSearchParams({ with: method });
  for (const key of CARRIED) {
    const value = (params.get(key) ?? "").trim();
    if (!value || value.length > 400) continue;
    if (key === "next" && !safeNext(value)) continue;
    q.set(key, value);
  }
  return `${RECOS_BASE}/candidate/sign-in/start?${q.toString()}`;
}

export function langFrom(value: string | null | undefined): LoginLang {
  const v = String(value ?? "").toLowerCase();
  return v === "no" || v === "nb" || v === "nn" ? "no" : "en";
}

export const TEXTS = {
  en: {
    welcome: "Welcome back",
    welcomeSub: "Sign in to your candidate profile.",
    finishTitle: "Finish your profile",
    finishSub: "Sign in with the e-mail address the link was sent to.",
    createTitle: "Create your profile",
    createSub: "Free for you. Only people aged 18 or older can register.",
    tagline: "WORK IN NORWAY",
    google: "Continue with Google",
    passkey: "Use fingerprint or face",
    or: "or",
    email: "E-mail",
    sendCode: "Send me a code",
    sending: "Sending...",
    codeLabel: "6-digit code",
    codeSent: (email: string) => `We sent a code to ${email}. It works for 10 minutes.`,
    signIn: "Sign in",
    signingIn: "Signing in...",
    newCode: "Send a new code",
    newCodeIn: (clock: string) => `New code in ${clock}`,
    otherEmail: "Use another e-mail",
    fullName: "Full name",
    birth: "Date of birth",
    consent: "I consent to ArbeidMatch processing my personal data for recruitment, and I accept the",
    privacy: "Privacy Policy",
    and: "and the",
    terms: "Terms of Service",
    continue: "Continue",
    newHere: "New here?",
    createProfile: "Create my profile",
    haveProfile: "I already have a profile",
    citizenshipQ: "Are you an EU/EEA citizen, or do you hold a Norwegian work permit?",
    euEea: "EU/EEA citizen",
    workPermit: "Norwegian work permit",
    neither: "Neither",
    refused: "At this time, ArbeidMatch accepts candidate profiles only from EU/EEA citizens and holders of a Norwegian work permit.",
    gateConsentLabel: "I agree to how ArbeidMatch handles my data",
    adult: "You must be 18 or older.",
    createButton: "Create profile",
    checkMail: "Check your e-mail for the link that opens your profile.",
    again: (s: number) => `You can send another request in ${s}s.`,
    needBirth: "Give your date of birth.",
    underAge: "You must be 18 or older to create a profile.",
    badEmail: "Enter a valid e-mail address.",
    needConsent: "Tick the consent to continue.",
    needName: "Write your full name.",
    powered: "Powered by",
    tryAgain: "Please try again.",
  },
  no: {
    welcome: "Velkommen tilbake",
    welcomeSub: "Logg inn på kandidatprofilen din.",
    finishTitle: "Fullfør profilen din",
    finishSub: "Logg inn med e-postadressen lenken ble sendt til.",
    createTitle: "Opprett profilen din",
    createSub: "Gratis for deg. Bare personer som er 18 år eller eldre, kan registrere seg.",
    tagline: "JOBB I NORGE",
    google: "Fortsett med Google",
    passkey: "Bruk fingeravtrykk eller ansikt",
    or: "eller",
    email: "E-post",
    sendCode: "Send meg en kode",
    sending: "Sender...",
    codeLabel: "Sekssifret kode",
    codeSent: (email: string) => `Vi har sendt en kode til ${email}. Den virker i 10 minutter.`,
    signIn: "Logg inn",
    signingIn: "Logger inn...",
    newCode: "Send en ny kode",
    newCodeIn: (clock: string) => `Ny kode om ${clock}`,
    otherEmail: "Bruk en annen e-post",
    fullName: "Fullt navn",
    birth: "Fødselsdato",
    consent: "Jeg samtykker i at ArbeidMatch behandler personopplysningene mine for rekruttering, og jeg godtar",
    privacy: "personvernerklæringen",
    and: "og",
    terms: "vilkårene for bruk",
    continue: "Fortsett",
    newHere: "Ny her?",
    createProfile: "Opprett profilen min",
    haveProfile: "Jeg har allerede en profil",
    citizenshipQ: "Er du EU/EØS-borger, eller har du norsk arbeidstillatelse?",
    euEea: "EU/EØS-borger",
    workPermit: "Norsk arbeidstillatelse",
    neither: "Ingen av delene",
    refused: "Foreløpig tar ArbeidMatch bare imot kandidatprofiler fra EU/EØS-borgere og personer med norsk arbeidstillatelse.",
    gateConsentLabel: "Jeg godtar hvordan ArbeidMatch behandler dataene mine",
    adult: "Du må være 18 år eller eldre.",
    createButton: "Opprett profil",
    checkMail: "Sjekk e-posten din for lenken som åpner profilen din.",
    again: (s: number) => `Du kan sende en ny forespørsel om ${s} s.`,
    needBirth: "Oppgi fødselsdatoen din.",
    underAge: "Du må være 18 år eller eldre for å opprette en profil.",
    badEmail: "Skriv inn en gyldig e-postadresse.",
    needConsent: "Kryss av for samtykket for å fortsette.",
    needName: "Skriv fullt navn.",
    powered: "Levert av",
    tryAgain: "Prøv igjen.",
  },
} as const;

/** The line an address-bar error shows; RecOS's own redirects name these. */
export function errorText(code: string, lang: LoginLang): string | null {
  if (!code) return null;
  const en: Record<string, string> = {
    access_denied: "Sign-in was cancelled or the link expired.",
    no_candidate_profile: "No candidate profile exists for this e-mail. Use the same e-mail your recruiter has on file.",
    recruiter_account: "This e-mail belongs to a team account. Use the team sign-in page.",
    portal_linked_other: "This profile is already linked to another sign-in.",
    profile_needed: "Create your profile with a code by e-mail, then continue.",
    under_age: "You must be 18 or older to create a profile.",
    gate_needed: "Create your profile first.",
    gate_other_email: "Use the e-mail address the link was sent to.",
    bootstrap_failed: "Could not finish sign-in. Please try again or contact support.",
    link_invalid: "This sign-in link has expired or was already used. Sign in with a code instead.",
    handover_failed: "Could not finish sign-in. Ask for a new code and try again.",
    session_expired: "Your session has expired. Please sign in again.",
  };
  const no: Record<string, string> = {
    access_denied: "Innloggingen ble avbrutt, eller lenken er utløpt.",
    no_candidate_profile: "Det finnes ingen kandidatprofil for denne e-posten. Bruk e-posten rekruttereren din har registrert.",
    recruiter_account: "Denne e-posten hører til en teamkonto. Bruk innloggingen for teamet.",
    portal_linked_other: "Denne profilen er allerede koblet til en annen innlogging.",
    profile_needed: "Opprett profilen din med en kode på e-post, og fortsett deretter.",
    under_age: "Du må være 18 år eller eldre for å opprette en profil.",
    gate_needed: "Opprett profilen din først.",
    gate_other_email: "Bruk e-postadressen lenken ble sendt til.",
    bootstrap_failed: "Innloggingen kunne ikke fullføres. Prøv igjen eller kontakt kundestøtte.",
    link_invalid: "Denne innloggingslenken er utløpt eller allerede brukt. Logg inn med en kode i stedet.",
    handover_failed: "Innloggingen kunne ikke fullføres. Be om en ny kode og prøv igjen.",
    session_expired: "Økten din er utløpt. Logg inn på nytt.",
  };
  const table = lang === "no" ? no : en;
  return table[code] ?? (lang === "no" ? "Noe gikk galt. Prøv igjen." : "Something went wrong. Please try again.");
}
