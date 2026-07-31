import type { CvDocument } from "@/lib/cv/schema";

/**
 * Fictional demo data used for guide screenshots and the PDF parsability tests.
 * No real people, no real client names. Romanian diacritics are present on
 * purpose so the font subset is exercised by the test suite.
 */
export const SAMPLE_CV: CvDocument = {
  version: 1,
  templateId: "classic-linear",
  locale: "en",
  personal: {
    firstName: "Alex",
    lastName: "Popa",
    headline: "Tiler / Flislegger",
    email: "alex.popa@example.com",
    phone: "+4790000000",
    city: "Trondheim",
    country: "Norway",
    linkedin: "https://www.linkedin.com/in/example-alex-popa",
    workPermit: "eu-eea",
    drivingLicence: ["B", "BE"],
  },
  summary:
    "Tiler with nine years of experience on residential and commercial sites in Norway and Romania. Certified for wet room work and used to delivering bathrooms that pass inspection first time. Comfortable reading technical drawings, setting out complex patterns and working to a fixed handover date. Holds a valid HSE card and works safely in mixed-trade teams.",
  experience: [
    {
      jobTitle: "Tiler",
      company: "Nordvest Bygg AS",
      city: "Trondheim",
      country: "Norway",
      startDate: "03/2021",
      endDate: "Present",
      bullets: [
        "Installed floor and wall tiling in 120 apartment bathrooms across four residential projects.",
        "Delivered wet room membrane work to TEK17 requirements with zero remediation callbacks.",
        "Coordinated with plumbers and electricians to keep bathroom handovers on the site programme.",
        "Supervised two apprentices and signed off their daily work quality.",
      ],
    },
    {
      jobTitle: "Tiler",
      company: "Delta Interior SRL",
      city: "Cluj-Napoca",
      country: "Romania",
      startDate: "06/2016",
      endDate: "02/2021",
      bullets: [
        "Completed large format porcelain installations in hotel and retail interiors.",
        "Set out mosaic and herringbone patterns from architect drawings.",
        "Maintained a waste rate below five percent across all projects.",
      ],
    },
  ],
  education: [
    {
      qualification: "Vocational diploma, Construction and finishing works",
      institution: "Colegiul Tehnic Anghel Saligny",
      city: "Cluj-Napoca",
      country: "Romania",
      startDate: "09/2012",
      endDate: "06/2015",
      details: "Specialised in interior finishing, tiling and plastering.",
    },
  ],
  certifications: [
    { name: "HSE card (HMS-kort)", issuer: "Arbeidstilsynet", issued: "01/2024", expires: "01/2026" },
    { name: "Wet room certification (vatromssertifisering)", issuer: "Byggmesterskolen", issued: "05/2022" },
    { name: "Working at heights", issuer: "Norsk Sikkerhetsopplaering", issued: "09/2023" },
    { name: "First aid", issuer: "Rode Kors", issued: "04/2024" },
  ],
  skills: [
    "Wall and floor tiling",
    "Wet room membranes",
    "Large format porcelain",
    "Waterproofing",
    "Setting out from drawings",
    "Tile cutting and mitring",
    "Substrate preparation",
    "Grouting and sealing",
    "Site safety",
  ],
  languages: [
    { language: "Romanian", level: "Native" },
    { language: "English", level: "Professional" },
    { language: "Norwegian", level: "Intermediate" },
  ],
  coverLetter: {
    recipientName: "Hiring Manager",
    companyName: "Nordvest Bygg AS",
    companyCity: "Trondheim",
    body: [
      "I am writing to apply for the tiler position advertised on your website. I have worked as a tiler for nine years, the last four of them in Norway, and I hold a valid HSE card and wet room certification.",
      "On my current site I install floor and wall tiling in residential bathrooms and deliver membrane work to TEK17 requirements. Over four projects and 120 bathrooms there have been no remediation callbacks. I am used to coordinating with plumbers and electricians so that handover dates hold.",
      "I read technical drawings, set out complex patterns and keep waste low. I work safely in mixed-trade teams and I have supervised apprentices on site.",
      "I would be glad to discuss how I can contribute to your projects. I am available for an interview at short notice.",
    ].join("\n\n"),
  },
};

/** Diacritics probe. Rendered by the test suite to prove the font subset covers Latin Extended A. */
export const DIACRITICS_PROBE = "șȘțȚăĂîÎâÂæøåÆØÅ";
