/**
 * The words of the contact page, in the language of the door the visitor chose
 * (W1, his report of 6 October 2026: "la firma din afara europei ... sa fie in
 * engleza formularul si optiunea").
 *
 *  - a Norwegian company writes in Norwegian;
 *  - a company from another EU/EEA country, and a job seeker, read English,
 *    every word of it: labels, placeholders, errors, the privacy line, the
 *    button and the thank-you.
 *
 * Pure, so a test can hold each language to having no word of the other.
 */

export type ContactFormLang = "nb" | "en";

/** The two buttons that choose where the company is registered; each in its own language. */
export const ORIGIN_LABELS = {
  norway: "Norsk bedrift",
  foreign: "Company in another EU/EEA country",
} as const;

export const CONTACT_FORM_COPY = {
  nb: {
    title: "Ta kontakt",
    intro: "Har dere spørsmål, eller er dere klare til å finne arbeidskraft til bedriften? Vi svarer innen én virkedag.",
    name: "Navn",
    namePlaceholder: "Fullt navn",
    companyName: "Bedriftens navn",
    companyNamePlaceholder: "Bedriftens navn",
    country: "Land",
    countryPlaceholder: "Velg land",
    vat: "MVA-nummer (EU VAT)",
    vatPlaceholder: "DE123456789",
    email: "E-post",
    emailPlaceholder: "navn@firma.no",
    phone: "Telefon",
    phonePlaceholder: "+47 400 00 000",
    message: "Melding",
    messagePlaceholder: "Hva kan vi hjelpe dere med?",
    generic: "Noe gikk galt. Prøv igjen.",
    tooMany: "For mange forespørsler. Prøv igjen litt senere.",
    bot: "Sikkerhetskontrollen ble ikke godkjent. Prøv igjen.",
    required: "Fyll ut alle obligatoriske felt.",
    phoneFormat: "Skriv telefonnummeret med landskode, for eksempel +49 …",
    failedTitle: "Meldingen ble ikke sendt",
    failed: "Vi kunne ikke sende meldingen. Prøv igjen senere.",
    viesTitle: "MVA-registeret svarer ikke",
    viesBody: "EU-registeret VIES svarer ikke akkurat nå, så vi kunne ikke bekrefte MVA-nummeret. Prøv igjen om litt.",
    policyTitle: "Vi kan ikke ta imot denne henvendelsen",
    sending: "Sender…",
    send: "Send melding",
    thanks: "Takk! Vi tar kontakt med dere snart.",
    privacyBefore: "Les hvordan vi behandler opplysningene deres i ",
    privacyLink: "personvernerklæringen",
    privacyAfter: " vår.",
    registered: "Registrert i Norge",
    supportHeading: "Kundestøtte",
  },
  en: {
    title: "Contact us",
    intro: "Do you have questions, or are you ready to find workers for your company? We reply within one working day.",
    name: "Name",
    namePlaceholder: "Full name",
    companyName: "Company name",
    companyNamePlaceholder: "Company name",
    country: "Country",
    countryPlaceholder: "Choose country",
    vat: "VAT number (EU VAT)",
    vatPlaceholder: "DE123456789",
    email: "Email",
    emailPlaceholder: "name@company.com",
    phone: "Phone",
    phonePlaceholder: "+49 30 1234567",
    message: "Message",
    messagePlaceholder: "How can we help you?",
    generic: "Something went wrong. Please try again.",
    tooMany: "Too many requests. Please try again a little later.",
    bot: "The security check did not pass. Please try again.",
    required: "Please fill in all required fields.",
    phoneFormat: "Please write the phone number with its country code, for example +49 …",
    failedTitle: "Your message was not sent",
    failed: "We could not send your message. Please try again later.",
    viesTitle: "The VAT register is not answering",
    viesBody: "The EU VAT register (VIES) is not answering right now, so we could not confirm the VAT number. Please try again shortly.",
    policyTitle: "We cannot take this request",
    sending: "Sending…",
    send: "Send message",
    thanks: "Thank you! We will get back to you soon.",
    privacyBefore: "Read how we handle your information in our ",
    privacyLink: "privacy notice",
    privacyAfter: ".",
    registered: "Registered in Norway",
    supportHeading: "Support",
  },
} as const satisfies Record<ContactFormLang, Record<string, string>>;

export type ContactFormCopy = (typeof CONTACT_FORM_COPY)[ContactFormLang];
