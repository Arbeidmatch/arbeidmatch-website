import type { LegalLanguage } from "@/lib/legalPageLanguage";

/**
 * The words of the legal request form, Norsk and English. The request types and
 * identity methods are stored in English whatever language the form is read in
 * (`value`), so the rows in legal_requests and the letter to legal@ stay one
 * vocabulary; only the label the reader sees changes.
 */

export type LegalRequestOption = { value: string; label: string };

type Words = {
  title: string;
  intro: string;
  requestType: string;
  fullName: string;
  email: string;
  identity: string;
  identityPlaceholder: string;
  message: string;
  messageHint: string;
  confirm: string;
  submit: string;
  submitting: string;
  error: string;
  done: string;
  requestTypes: readonly LegalRequestOption[];
  identityMethods: readonly LegalRequestOption[];
};

export const LEGAL_REQUEST_WORDS: Record<LegalLanguage, Words> = {
  no: {
    title: "Send en juridisk henvendelse",
    intro:
      "Bruk dette skjemaet for å utøve rettighetene dine etter personvernforordningen (innsyn, retting, sletting, dataportabilitet og så videre), eller for å stille et juridisk spørsmål eller et spørsmål om personvern. Vi svarer innen 30 dager.",
    requestType: "Type henvendelse",
    fullName: "Fullt navn",
    email: "E-post",
    identity: "Hvordan kan vi bekrefte identiteten din? (valgfritt)",
    identityPlaceholder: "Velg om det passer",
    message: "Melding",
    messageHint: "(minst 20 tegn)",
    confirm:
      "Jeg bekrefter at opplysningene jeg har oppgitt er riktige. Jeg forstår at henvendelsen blir registrert og at jeg får en kopi på e-post.",
    submit: "Send",
    submitting: "Sender",
    error: "Noe gikk galt. Prøv igjen om litt.",
    done: "Vi har mottatt henvendelsen din. Du får en bekreftelse på e-post om kort tid. Vi svarer innen 30 dager, slik personvernforordningen artikkel 12 krever.",
    requestTypes: [
      { value: "GDPR Access (Art. 15)", label: "Innsyn (art. 15)" },
      { value: "GDPR Rectification (Art. 16)", label: "Retting (art. 16)" },
      { value: "GDPR Erasure (Art. 17)", label: "Sletting (art. 17)" },
      { value: "GDPR Restriction (Art. 18)", label: "Begrensning av behandling (art. 18)" },
      { value: "GDPR Portability (Art. 20)", label: "Dataportabilitet (art. 20)" },
      { value: "GDPR Objection (Art. 21)", label: "Innsigelse (art. 21)" },
      { value: "Withdraw consent", label: "Trekke tilbake samtykke" },
      { value: "Privacy Policy question", label: "Spørsmål om personvernerklæringen" },
      { value: "Other legal matter", label: "Annen juridisk sak" },
    ],
    identityMethods: [
      { value: "Reply from registered email", label: "Svar fra den registrerte e-postadressen" },
      { value: "Will provide ID copy on request", label: "Sender kopi av legitimasjon på forespørsel" },
      { value: "Other", label: "Annet" },
    ],
  },
  en: {
    title: "Submit a Legal Request",
    intro:
      "Use this form to exercise your rights under GDPR (access, rectification, erasure, portability, etc.) or to ask any legal or privacy question. We respond within 30 days.",
    requestType: "Request type",
    fullName: "Full name",
    email: "Email",
    identity: "Identity verification method (optional)",
    identityPlaceholder: "Select if applicable",
    message: "Message",
    messageHint: "(min. 20 characters)",
    confirm:
      "I confirm that the information I provided is accurate. I understand my submission will be logged and a copy of this request will be sent to me by email.",
    submit: "Submit",
    submitting: "Submitting",
    error: "Something went wrong. Please try again in a moment.",
    done: "Your request has been received. You will get a confirmation email shortly. We respond within 30 days as required by GDPR Article 12.",
    requestTypes: [
      { value: "GDPR Access (Art. 15)", label: "GDPR Access (Art. 15)" },
      { value: "GDPR Rectification (Art. 16)", label: "GDPR Rectification (Art. 16)" },
      { value: "GDPR Erasure (Art. 17)", label: "GDPR Erasure (Art. 17)" },
      { value: "GDPR Restriction (Art. 18)", label: "GDPR Restriction (Art. 18)" },
      { value: "GDPR Portability (Art. 20)", label: "GDPR Portability (Art. 20)" },
      { value: "GDPR Objection (Art. 21)", label: "GDPR Objection (Art. 21)" },
      { value: "Withdraw consent", label: "Withdraw consent" },
      { value: "Privacy Policy question", label: "Privacy Policy question" },
      { value: "Other legal matter", label: "Other legal matter" },
    ],
    identityMethods: [
      { value: "Reply from registered email", label: "Reply from registered email" },
      { value: "Will provide ID copy on request", label: "Will provide ID copy on request" },
      { value: "Other", label: "Other" },
    ],
  },
};
