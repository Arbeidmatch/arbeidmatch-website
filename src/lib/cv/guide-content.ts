/** Content for the /cv guide. Kept out of the page so the copy is easy to review. */

export interface GuideBlock {
  id: string;
  title: string;
  whatToWrite: string;
  good: string;
  bad: string;
  /** Screenshot key in the generated manifest, if one exists. */
  shot?: string;
}

export const GUIDE_BLOCKS: GuideBlock[] = [
  {
    id: "contact",
    title: "Contact details",
    whatToWrite:
      "Your name, the job title you are applying for, your city and country, a phone number with the country code, and an email you actually read. Nothing else. No photo, no date of birth, no national identity number.",
    good: "Alex Popa, Tiler / Flislegger, Trondheim, Norway, +47 900 00 000, alex.popa@example.com",
    bad: "Alex, 34 years old, married, photo attached, tel 0900 00 000",
    shot: "step-2-details",
  },
  {
    id: "summary",
    title: "Professional summary",
    whatToWrite:
      "Three or four sentences at the top. What you are, how long you have done it, what you are certified for, and what you are good at. Write it in the third person, without I or my. Between 300 and 800 characters is the range that carries real keywords without turning into an essay.",
    good: "Tiler with nine years of experience on residential and commercial sites in Norway and Romania. Certified for wet room work and used to delivering bathrooms that pass inspection first time. Comfortable reading technical drawings and working to a fixed handover date.",
    bad: "I am a hard working person, fast learner and team player looking for a new opportunity where I can grow.",
    shot: "step-3-summary",
  },
  {
    id: "experience",
    title: "Work experience",
    whatToWrite:
      "Most recent job first. For each one: job title, then company with city and country, then the dates as MM/YYYY, then two to six bullets. Start every bullet with an action verb and put a number in it wherever you can.",
    good: "Installed floor and wall tiling in 120 apartment bathrooms across four residential projects.",
    bad: "Responsible for tiling and other tasks as required.",
    shot: "step-4-experience",
  },
  {
    id: "education",
    title: "Education",
    whatToWrite:
      "The qualification, where you got it, and when. For a trade, the diploma matters far more than the school name. If you learned on the job rather than at a school, say so here in one line.",
    good: "Vocational diploma, Construction and finishing works, Colegiul Tehnic Anghel Saligny, Cluj-Napoca, Romania, 09/2012 - 06/2015",
    bad: "High school, 2015",
    shot: "step-5-education",
  },
  {
    id: "certificates",
    title: "Certificates and licences",
    whatToWrite:
      "These often decide whether you can start on a Norwegian site at all. List the ones you hold with the issue and expiry dates. Write the English name with the Norwegian term in brackets, so both a person and a machine can find it.",
    good: "HSE card (HMS-kort), Arbeidstilsynet, 01/2024 - 01/2026",
    bad: "I have all the necessary certificates.",
    shot: "step-6-certificates",
  },
  {
    id: "skills",
    title: "Skills",
    whatToWrite:
      "Between 6 and 20 short noun phrases. Use the words an employer types into a search: the tools, the materials, the processes. Not personality traits.",
    good: "Wall and floor tiling, Wet room membranes, Large format porcelain, Waterproofing, Setting out from drawings, Site safety",
    bad: "Hard working, punctual, motivated, good with people",
    shot: "step-7-skills",
  },
  {
    id: "languages",
    title: "Languages",
    whatToWrite:
      "Every language with an honest level. Norwegian at any level is worth stating. Do not claim fluent if you cannot hold a conversation on site, because it will come up in the first phone call.",
    good: "Romanian: Native, English: Professional, Norwegian: Intermediate",
    bad: "Languages: many",
    shot: "step-7-skills",
  },
  {
    id: "cover-letter",
    title: "Cover letter",
    whatToWrite:
      "Three to five short paragraphs: why this job, what you have done that proves you can do it, and when you can start. Name the company. A letter that could be sent to anyone reads like it was.",
    good: "I have worked as a tiler for nine years, the last four of them in Norway, and I hold a valid HSE card and wet room certification.",
    bad: "Dear Sir or Madam, I am writing to apply for any position available in your company.",
    shot: "step-8-cover-letter",
  },
];

export const COMMON_MISTAKES = [
  {
    mistake: "A photo",
    why: "Norwegian employers do not expect one, and some systems drop the whole header when they hit an image.",
  },
  {
    mistake: "Your national identity number",
    why: "It is never needed to apply for a job, and it is the most sensitive number you own.",
  },
  {
    mistake: "Age, marital status, number of children",
    why: "None of it belongs on a CV here, and it invites the wrong kind of decision.",
  },
  {
    mistake: "Long paragraphs instead of bullets",
    why: "A recruiter scans. Anything buried in the middle of a paragraph is not read.",
  },
  {
    mistake: "A PDF exported as an image",
    why: "A CV scanned or exported as a picture contains no text at all. To a parser it is a blank page.",
  },
  {
    mistake: "Creative job titles",
    why: "Nobody searches for Tile Artist. They search for Tiler.",
  },
  {
    mistake: "Unexplained gaps",
    why: "A gap over a year with no explanation raises a question you are not there to answer. One line is enough.",
  },
  {
    mistake: "Tables, text boxes and columns of text",
    why: "They scramble the reading order, so your job titles and dates arrive at the employer shuffled.",
  },
];

export const NORWEGIAN_SPECIFICS = [
  {
    title: "The certificates employers ask for",
    body: "HMS-kort is required to be on most sites. Varme arbeider is needed for hot work. Stillaskurs covers scaffolding, truckforerbevis covers forklifts, and vatrom certification covers wet rooms. If you hold one, name it in English with the Norwegian term in brackets.",
  },
  {
    title: "How to present your work permit",
    body: "If you hold an EU or EEA passport, say so plainly. It answers the first question an employer has. We recruit EU and EEA passport holders only and do not sponsor visas.",
  },
  {
    title: "Give a Norwegian mobile number if you have one",
    body: "A Norwegian number gets answered faster and costs the employer nothing to call. If you do not have one yet, write your own number in full international format.",
  },
  {
    title: "References",
    body: "Do not print your referees' phone numbers on a CV that you send to strangers. Write that references are available on request and have two names ready for when you are asked.",
  },
];

export const FAQ = [
  {
    question: "Is the CV builder free?",
    answer:
      "Yes. Building your CV and downloading the PDF costs nothing, and there is no account to create.",
  },
  {
    question: "How long does it take?",
    answer:
      "About 15 minutes if you have your dates and certificate numbers to hand. Your progress is kept in your browser, so you can stop and come back.",
  },
  {
    question: "Why does my CV need to be in English?",
    answer:
      "Most Norwegian staffing and recruitment companies work in Norwegian and English, and the systems they use to search CVs are built around English keywords. English also travels: the same CV works for every employer we send it to.",
  },
  {
    question: "What does ATS ready actually mean?",
    answer:
      "It means the PDF is real text in a sensible order, so when software reads it, your job titles, dates, skills and contact details come out complete and in the right sequence. A decorative CV can lose half its content in that step.",
  },
  {
    question: "Do you keep my data?",
    answer:
      "Nothing reaches our servers while you fill the form. When you download, you confirm with a code sent to your email and we create a work profile for you so we can match you with jobs. You can see, export or delete everything at any time from the link in that email.",
  },
  {
    question: "Do you send my CV to employers automatically?",
    answer:
      "No. A work profile lets us match you with jobs. Your CV goes to a specific employer only after a separate, explicit step.",
  },
  {
    question: "Do I need a cover letter?",
    answer:
      "It is optional but strongly recommended. Applications that include one are given higher priority.",
  },
  {
    question: "Which layout should I choose?",
    answer:
      "Classic if you are unsure. All five carry the same information, but the plainer layouts survive older parsing software best.",
  },
];
