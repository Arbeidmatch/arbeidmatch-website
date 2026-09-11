/**
 * What the employer request wizard asks about the role itself.
 *
 * THE OWNER, 11 September 2026: "when a request is made I want to know more
 * about the role, for recruitment or staffing". The wizard used to stop at the
 * trade, the pay and a free-text task list, so every request came in without
 * the language the work needs, the certificates of the trade, or how the
 * assignment or the hiring is run. This file is that extra knowledge, in one
 * place, read by the wizard (questions and validation), by the saved row (the
 * `requirements` summary) and by the office letter (the "Role details"
 * section), so the three always say the same thing in the same words.
 *
 * THE LABELS ARE READ BACK BY THE ATS. Every `summaryLabel` below becomes a
 * "Label: value" line in `employer_requests.requirements` and a row of the
 * office letter's "Role details" section, which the ATS intake parses by label
 * (ats-recruitment `src/lib/intake/form-notification-parser.ts`). That parser
 * finds a label anywhere it follows whitespace, case-insensitively, so a label
 * here must not contain one of the letter's existing labels as a word
 * ("City", "Phone", "Salary", "Position" ...). The test file checks this.
 * Renaming a label here breaks the parser fixture on the ATS side: add, do not
 * rename. `ALL_ROLE_DETAIL_LABELS` is the full list for that parser.
 *
 * Kept short on purpose: at most four questions per trade, at most one of them
 * required. A client who meets a wall of questions does not finish the form.
 */

/** The services this wizard still runs to the end. Job advertising has its own flow at /annonse/ny. */
export type RoleService = "staffing" | "recruitment";

export type RoleQuestionKind = "yesno" | "single" | "multi" | "text";

export type RoleQuestion = {
  /** Key in RoleAnswers.trade. Shared between trades when the question means the same thing. */
  id: string;
  /** The question as the client reads it in the wizard. */
  label: string;
  /** "Label" of the "Label: value" line. Read by the ATS; add, never rename. */
  summaryLabel: string;
  /** The same label in Romanian, for the owner's Slack message. */
  roLabel: string;
  kind: RoleQuestionKind;
  options?: readonly string[];
  required?: boolean;
  help?: string;
  placeholder?: string;
};

type TradeQuestionSet = {
  questions: readonly RoleQuestion[];
  /** A position that needs different questions than the rest of its trade. An empty list asks nothing. */
  byPosition?: Record<string, readonly RoleQuestion[]>;
};

/** The job categories of the wizard, in the order it shows them. The wizard's own list is this one. */
export const ROLE_QUESTION_INDUSTRIES = [
  "Electrical",
  "Plumbing and HVAC (VVS)",
  "Construction",
  "Welding and Metal",
  "Logistics",
  "Industry and Production",
  "Cleaning",
  "HoReCa",
  "Healthcare",
] as const;

export const YES_NO = ["Yes", "No"] as const;

// Questions that mean the same thing in several trades share one id, so an
// answer survives a change of category and the line reads the same everywhere.
const FAGBREV: RoleQuestion = {
  id: "fagbrev",
  label: "Trade certificate (fagbrev) required?",
  summaryLabel: "Trade certificate (fagbrev) required",
  roLabel: "Fagbrev necesar",
  kind: "yesno",
  required: true,
};

const FORKLIFT: RoleQuestion = {
  id: "forklift",
  label: "Forklift licence (truckførerbevis) required?",
  summaryLabel: "Forklift licence required",
  roLabel: "Permis de stivuitorist necesar",
  kind: "yesno",
};

const MACHINE_CERT: RoleQuestion = {
  id: "machine_cert",
  label: "Machine operator certificate (maskinførerbevis) required?",
  summaryLabel: "Machine operator certificate required",
  roLabel: "Certificat de operator utilaje necesar",
  kind: "yesno",
  required: true,
};

const SITE_TYPE: RoleQuestion = {
  id: "site_type",
  label: "Type of site",
  summaryLabel: "Type of site",
  roLabel: "Tipul șantierului",
  kind: "multi",
  options: ["Road", "Tunnel", "Building site", "Quarry", "Other"],
};

const TECH_DRAWINGS: RoleQuestion = {
  id: "tech_drawings",
  label: "Must read technical drawings?",
  summaryLabel: "Reads technical drawings",
  roLabel: "Citește desene tehnice",
  kind: "yesno",
};

const WAREHOUSE_ROLES = ["Forklift operator", "Warehouse worker", "Terminal worker", "Picker/Packer"] as const;
const NON_WELDING_METAL_ROLES = ["Industrial mechanic", "CNC operator", "Maintenance mechanic", "Turner", "Mill operator"] as const;

const WAREHOUSE_QUESTIONS: readonly RoleQuestion[] = [
  FORKLIFT,
  {
    id: "truck_types",
    label: "Which trucks will they drive?",
    summaryLabel: "Truck types",
    roLabel: "Tipuri de stivuitoare",
    kind: "multi",
    options: ["Pallet or stacker truck", "Reach truck", "Counterbalance truck", "Other"],
  },
  {
    id: "warehouse_system",
    label: "Experience with scanners or a warehouse system needed?",
    summaryLabel: "Warehouse system experience needed",
    roLabel: "Experiență cu scanere sau sistem de depozit",
    kind: "yesno",
  },
];

const NON_WELDING_METAL_QUESTIONS: readonly RoleQuestion[] = [FAGBREV, TECH_DRAWINGS];

export const TRADE_QUESTIONS: Record<(typeof ROLE_QUESTION_INDUSTRIES)[number], TradeQuestionSet> = {
  Electrical: {
    questions: [
      {
        id: "dsb",
        label: "DSB authorisation required?",
        summaryLabel: "DSB authorisation required",
        roLabel: "Autorizație DSB necesară",
        kind: "yesno",
        required: true,
      },
      {
        id: "electrical_work",
        label: "Type of work",
        summaryLabel: "Type of electrical work",
        roLabel: "Tip de lucrări electrice",
        kind: "multi",
        options: ["Installation", "Service", "Industrial", "Automation"],
      },
    ],
  },
  "Plumbing and HVAC (VVS)": {
    questions: [
      FAGBREV,
      {
        id: "vvs_work",
        label: "Type of work",
        summaryLabel: "Type of plumbing and HVAC work",
        roLabel: "Tip de lucrări VVS",
        kind: "multi",
        options: ["New build", "Service", "Industry"],
      },
    ],
  },
  Construction: {
    questions: [
      FAGBREV,
      {
        id: "own_tools",
        label: "Own tools required?",
        summaryLabel: "Own tools required",
        roLabel: "Scule proprii necesare",
        kind: "yesno",
      },
      {
        id: "work_at_height",
        label: "Work at height (scaffolding, lifts)?",
        summaryLabel: "Work at height",
        roLabel: "Lucru la înălțime",
        kind: "yesno",
      },
    ],
  },
  "Welding and Metal": {
    questions: [
      {
        id: "welding_methods",
        label: "Welding methods",
        summaryLabel: "Welding methods",
        roLabel: "Metode de sudură",
        kind: "multi",
        options: ["MIG/MAG", "TIG", "MMA", "Other"],
      },
      {
        id: "welding_cert",
        label: "Welding certificate required? (e.g. ISO 9606)",
        summaryLabel: "Welding certificate required",
        roLabel: "Certificat de sudor necesar",
        kind: "yesno",
        required: true,
      },
      {
        id: "materials",
        label: "Materials",
        summaryLabel: "Materials",
        roLabel: "Materiale",
        kind: "multi",
        options: ["Carbon steel", "Stainless steel", "Aluminium", "Other"],
      },
    ],
    byPosition: Object.fromEntries(NON_WELDING_METAL_ROLES.map((role) => [role, NON_WELDING_METAL_QUESTIONS])),
  },
  Logistics: {
    // The licence class is asked on the same step by the wizard's own licence
    // chips (saved as driver_license), so it is not asked a second time here.
    questions: [
      {
        id: "ysk",
        label: "YSK (professional driver qualification) required?",
        summaryLabel: "YSK required",
        roLabel: "YSK necesar",
        kind: "yesno",
      },
      {
        id: "adr",
        label: "ADR required?",
        summaryLabel: "ADR required",
        roLabel: "ADR necesar",
        kind: "yesno",
      },
      FORKLIFT,
    ],
    byPosition: {
      ...Object.fromEntries(WAREHOUSE_ROLES.map((role) => [role, WAREHOUSE_QUESTIONS])),
      "Logistics coordinator": [],
    },
  },
  "Industry and Production": {
    questions: [
      {
        id: "production_type",
        label: "Type of production",
        summaryLabel: "Type of production",
        roLabel: "Tip de producție",
        kind: "multi",
        options: ["Food", "Metal and mechanical", "Wood", "Plastics", "Packaging", "Other"],
      },
      FORKLIFT,
    ],
    byPosition: {
      "Excavator operator": [MACHINE_CERT, SITE_TYPE],
      "Wheel loader operator": [MACHINE_CERT, SITE_TYPE],
      "Road worker": [SITE_TYPE],
      "Asphalt worker": [SITE_TYPE],
      "Tunnel worker": [SITE_TYPE],
    },
  },
  Cleaning: {
    questions: [
      {
        id: "cleaning_type",
        label: "Type of cleaning",
        summaryLabel: "Type of cleaning",
        roLabel: "Tip de curățenie",
        kind: "multi",
        options: ["Offices", "Industrial sites", "Construction final cleaning", "Hotels", "Windows", "Other"],
      },
      {
        id: "cleaning_machines",
        label: "Experience with cleaning machines needed?",
        summaryLabel: "Cleaning machine experience needed",
        roLabel: "Experiență cu utilaje de curățenie",
        kind: "yesno",
      },
    ],
  },
  HoReCa: {
    questions: [
      {
        id: "venue_type",
        label: "Type of venue",
        summaryLabel: "Type of venue",
        roLabel: "Tipul localului",
        kind: "multi",
        options: ["Restaurant", "Hotel", "Canteen", "Catering", "Bar or café", "Other"],
      },
      {
        id: "food_hygiene",
        label: "Food hygiene course required?",
        summaryLabel: "Food hygiene course required",
        roLabel: "Curs de igienă alimentară necesar",
        kind: "yesno",
      },
    ],
  },
  Healthcare: {
    questions: [
      {
        id: "hpr",
        label: "Norwegian authorisation (HPR) required?",
        summaryLabel: "HPR authorisation required",
        roLabel: "Autorizație HPR necesară",
        kind: "yesno",
        required: true,
      },
      {
        id: "care_setting",
        label: "Care setting",
        summaryLabel: "Care setting",
        roLabel: "Tipul unității de îngrijire",
        kind: "multi",
        options: ["Nursing home", "Home care", "Hospital", "Assisted living", "Other"],
      },
    ],
  },
};

/** The questions for this trade and position; a position of its own wins, an unknown category asks nothing. */
export function getTradeQuestions(industry: string, position: string): readonly RoleQuestion[] {
  const set = (TRADE_QUESTIONS as Record<string, TradeQuestionSet | undefined>)[industry];
  if (!set) return [];
  const own = set.byPosition?.[position.trim()];
  return own ?? set.questions;
}

/** Every trade question there is, once per id. */
export const ALL_TRADE_QUESTIONS: readonly RoleQuestion[] = (() => {
  const seen = new Map<string, RoleQuestion>();
  for (const set of Object.values(TRADE_QUESTIONS)) {
    const lists = [set.questions, ...Object.values(set.byPosition ?? {})];
    for (const list of lists) for (const q of list) if (!seen.has(q.id)) seen.set(q.id, q);
  }
  return [...seen.values()];
})();

// ---------------------------------------------------------------------------
// Language, and the questions of each service.
// ---------------------------------------------------------------------------

export const LANGUAGE_LEVELS = ["Not needed", "Basic", "Good spoken", "Fluent"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

/** A Norwegian level at which the client has to say why the work needs it. */
export function norwegianNeedsReason(level: string): boolean {
  return level === "Good spoken" || level === "Fluent";
}

export const SHIFT_PATTERNS = ["Day", "Evening", "Night", "Rotation"] as const;
export const PROBATION_OPTIONS = ["None", "3 months", "6 months"] as const;
export const INTERVIEW_ROUND_OPTIONS = ["1", "2", "3+"] as const;

export type RoleAnswers = {
  norwegianLevel: string;
  norwegianReason: string;
  englishLevel: string;
  /** Trade question id to "Yes"/"No", one option, several options, or free text. */
  trade: Record<string, string | string[]>;
  staffing: {
    worksiteStreet: string;
    worksitePostcode: string;
    worksiteCity: string;
    periodFrom: string;
    periodTo: string;
    periodOpenEnded: boolean;
    hoursPerWeek: string;
    shiftPattern: string[];
    approverName: string;
    approverPhone: string;
    ppeProvided: string;
  };
  recruitment: {
    probation: string;
    interviewer: string;
    interviewRounds: string;
    hireBy: string;
  };
};

export const EMPTY_ROLE_ANSWERS: RoleAnswers = {
  norwegianLevel: "",
  norwegianReason: "",
  englishLevel: "",
  trade: {},
  staffing: {
    worksiteStreet: "",
    worksitePostcode: "",
    worksiteCity: "",
    periodFrom: "",
    periodTo: "",
    periodOpenEnded: false,
    hoursPerWeek: "",
    shiftPattern: [],
    approverName: "",
    approverPhone: "",
    ppeProvided: "",
  },
  recruitment: {
    probation: "",
    interviewer: "",
    interviewRounds: "",
    hireBy: "",
  },
};

/** Field keys the wizard marks red. Trade questions are `trade.<id>`. */
export const ROLE_LANGUAGE_FIELD_KEYS = ["norwegianLevel", "norwegianReason", "englishLevel"] as const;
export const ROLE_STAFFING_FIELD_KEYS = [
  "worksiteStreet",
  "worksitePostcode",
  "worksiteCity",
  "periodFrom",
  "periodTo",
  "hoursPerWeek",
  "approverName",
  "approverPhone",
  "ppeProvided",
] as const;
export const ROLE_RECRUITMENT_FIELD_KEYS = ["probation", "interviewRounds"] as const;
export const ALL_TRADE_FIELD_KEYS: readonly string[] = ALL_TRADE_QUESTIONS.map((q) => tradeFieldKey(q.id));

export function tradeFieldKey(id: string): string {
  return `trade.${id}`;
}

export function isRoleService(value: string): value is RoleService {
  return value === "staffing" || value === "recruitment";
}

// ---------------------------------------------------------------------------
// Normalising. The same code runs in the browser and on the server, and the
// server gets whatever was posted, so nothing here trusts its input.
// ---------------------------------------------------------------------------

const TEXT_MAX = 300;

function str(value: unknown, max = TEXT_MAX): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function oneOf(value: unknown, options: readonly string[]): string {
  const s = str(value, 80);
  return options.includes(s) ? s : "";
}

function manyOf(value: unknown, options: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  // In the order of the options, not of the clicks, so the line reads the same every time.
  const picked = new Set(value.filter((v): v is string => typeof v === "string").map((v) => v.trim()));
  return options.filter((o) => picked.has(o));
}

function isoDate(value: unknown): string {
  const s = str(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? "" : s;
}

/** Hours per week as a number between 1 and 80, with a comma accepted as the decimal mark. */
export function parseHoursPerWeek(value: unknown): number | null {
  const s = str(value, 10).replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 80 ? n : null;
}

function digitCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

function tradeAnswer(q: RoleQuestion, value: unknown): string | string[] {
  if (q.kind === "yesno") return oneOf(value, YES_NO);
  if (q.kind === "single") return oneOf(value, q.options ?? []);
  if (q.kind === "multi") return manyOf(value, q.options ?? []);
  return str(value);
}

/** Whatever arrived, as RoleAnswers with only known keys and known options. */
export function normalizeRoleAnswers(raw: unknown): RoleAnswers {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (r.staffing && typeof r.staffing === "object" ? r.staffing : {}) as Record<string, unknown>;
  const c = (r.recruitment && typeof r.recruitment === "object" ? r.recruitment : {}) as Record<string, unknown>;
  const t = (r.trade && typeof r.trade === "object" ? r.trade : {}) as Record<string, unknown>;
  const trade: RoleAnswers["trade"] = {};
  for (const q of ALL_TRADE_QUESTIONS) {
    const a = tradeAnswer(q, t[q.id]);
    if (Array.isArray(a) ? a.length > 0 : a !== "") trade[q.id] = a;
  }
  return {
    norwegianLevel: oneOf(r.norwegianLevel, LANGUAGE_LEVELS),
    norwegianReason: str(r.norwegianReason),
    englishLevel: oneOf(r.englishLevel, LANGUAGE_LEVELS),
    trade,
    staffing: {
      worksiteStreet: str(s.worksiteStreet, 120),
      worksitePostcode: str(s.worksitePostcode, 10),
      worksiteCity: str(s.worksiteCity, 80),
      periodFrom: isoDate(s.periodFrom),
      periodTo: isoDate(s.periodTo),
      periodOpenEnded: s.periodOpenEnded === true,
      hoursPerWeek: str(s.hoursPerWeek, 10),
      shiftPattern: manyOf(s.shiftPattern, SHIFT_PATTERNS),
      approverName: str(s.approverName, 120),
      approverPhone: str(s.approverPhone, 40),
      ppeProvided: oneOf(s.ppeProvided, YES_NO),
    },
    recruitment: {
      probation: oneOf(c.probation, PROBATION_OPTIONS),
      interviewer: str(c.interviewer, 200),
      interviewRounds: oneOf(c.interviewRounds, INTERVIEW_ROUND_OPTIONS),
      hireBy: isoDate(c.hireBy),
    },
  };
}

// ---------------------------------------------------------------------------
// Validation, per wizard step.
// ---------------------------------------------------------------------------

/** The language and trade questions (the Requirements step). Returns the keys that are missing or wrong. */
export function collectLanguageTradeInvalid(
  service: string,
  industry: string,
  position: string,
  raw: RoleAnswers,
): Set<string> {
  const invalid = new Set<string>();
  if (!isRoleService(service)) return invalid;
  const a = normalizeRoleAnswers(raw);
  if (!a.norwegianLevel) invalid.add("norwegianLevel");
  if (norwegianNeedsReason(a.norwegianLevel) && a.norwegianReason.length < 5) invalid.add("norwegianReason");
  if (!a.englishLevel) invalid.add("englishLevel");
  for (const q of getTradeQuestions(industry, position)) {
    if (!q.required) continue;
    const v = a.trade[q.id];
    if (v === undefined || (Array.isArray(v) ? v.length === 0 : v === "")) invalid.add(tradeFieldKey(q.id));
  }
  return invalid;
}

/** The questions of the chosen service (the Salary and conditions step). */
export function collectServiceInvalid(service: string, raw: RoleAnswers): Set<string> {
  const invalid = new Set<string>();
  const a = normalizeRoleAnswers(raw);
  if (service === "staffing") {
    const s = a.staffing;
    if (s.worksiteStreet.length < 3) invalid.add("worksiteStreet");
    if (!/^\d{4}$/.test(s.worksitePostcode)) invalid.add("worksitePostcode");
    if (s.worksiteCity.length < 2) invalid.add("worksiteCity");
    if (!s.periodFrom) invalid.add("periodFrom");
    if (!s.periodOpenEnded && !s.periodTo) invalid.add("periodTo");
    if (!s.periodOpenEnded && s.periodFrom && s.periodTo && s.periodTo < s.periodFrom) invalid.add("periodTo");
    if (parseHoursPerWeek(s.hoursPerWeek) === null) invalid.add("hoursPerWeek");
    if (s.approverName.length < 2) invalid.add("approverName");
    if (digitCount(s.approverPhone) < 6) invalid.add("approverPhone");
    if (!s.ppeProvided) invalid.add("ppeProvided");
  } else if (service === "recruitment") {
    if (!a.recruitment.probation) invalid.add("probation");
    if (!a.recruitment.interviewRounds) invalid.add("interviewRounds");
  }
  return invalid;
}

// ---------------------------------------------------------------------------
// The "Label: value" lines.
// ---------------------------------------------------------------------------

export const ROLE_DETAILS_HEADING = "Role details";

export type RoleDetailRow = { label: string; value: string };

export type RoleDetailsInput = {
  service: string;
  industry: string;
  position: string;
  answers: unknown;
};

/** The staffing project's name in the ATS: "<street> - <city> - Bemanning". */
export function staffingProjectName(street: string, city: string): string {
  const parts = [str(street, 120), str(city, 80)].filter(Boolean);
  return parts.length === 2 ? `${parts[0]} - ${parts[1]} - Bemanning` : "";
}

const RO_WORDS: Record<string, string> = {
  Yes: "Da",
  No: "Nu",
  "Not needed": "Nu e necesară",
  Basic: "De bază",
  "Good spoken": "Vorbește bine",
  Fluent: "Fluent",
  Day: "Zi",
  Evening: "Seară",
  Night: "Noapte",
  Rotation: "Rotație",
  None: "Fără",
  "3 months": "3 luni",
  "6 months": "6 luni",
};

/**
 * The answered questions, in a fixed order, as rows. Only what was answered,
 * only what belongs to the chosen service and trade. "en" is what the ATS reads;
 * "ro" is the same for the owner's Slack message.
 */
export function buildRoleDetails(input: RoleDetailsInput, lang: "en" | "ro" = "en"): RoleDetailRow[] {
  if (!isRoleService(input.service)) return [];
  const a = normalizeRoleAnswers(input.answers);
  const ro = lang === "ro";
  const word = (v: string) => (ro ? (RO_WORDS[v] ?? v) : v);
  const rows: RoleDetailRow[] = [];
  const push = (en: string, roLabel: string, value: string) => {
    if (value) rows.push({ label: ro ? roLabel : en, value });
  };

  push("Norwegian at work", "Norvegiană la lucru", word(a.norwegianLevel));
  if (norwegianNeedsReason(a.norwegianLevel)) push("Why Norwegian is needed", "De ce e nevoie de norvegiană", a.norwegianReason);
  push("English at work", "Engleză la lucru", word(a.englishLevel));

  for (const q of getTradeQuestions(input.industry, input.position)) {
    const v = a.trade[q.id];
    if (v === undefined) continue;
    push(q.summaryLabel, q.roLabel, Array.isArray(v) ? v.join(", ") : word(v));
  }

  if (input.service === "staffing") {
    const s = a.staffing;
    const place = [s.worksitePostcode, s.worksiteCity].filter(Boolean).join(" ");
    push("Worksite address", "Adresa locului de muncă", [s.worksiteStreet, place].filter(Boolean).join(", "));
    push("Staffing project", "Proiect de bemanning", staffingProjectName(s.worksiteStreet, s.worksiteCity));
    let period = "";
    if (s.periodFrom && s.periodOpenEnded) period = ro ? `De la ${s.periodFrom}, pe durată nedeterminată` : `From ${s.periodFrom}, open-ended`;
    else if (s.periodFrom && s.periodTo) period = ro ? `${s.periodFrom} până la ${s.periodTo}` : `${s.periodFrom} to ${s.periodTo}`;
    else if (s.periodFrom) period = ro ? `De la ${s.periodFrom}` : `From ${s.periodFrom}`;
    push("Assignment period", "Perioada", period);
    const hours = parseHoursPerWeek(s.hoursPerWeek);
    push("Hours per week", "Ore pe săptămână", hours === null ? "" : String(hours));
    push("Shift pattern", "Ture", s.shiftPattern.map(word).join(", "));
    push("Hours approved on site by", "Aprobă orele pe șantier", [s.approverName, s.approverPhone].filter(Boolean).join(", "));
    push("Protective equipment provided by the client", "Echipament de protecție asigurat de client", word(s.ppeProvided));
  } else {
    const c = a.recruitment;
    push("Probation period", "Perioadă de probă", word(c.probation));
    push("Interviewed by", "Intervievează", c.interviewer);
    push("Interview rounds", "Runde de interviu", c.interviewRounds);
    push("Hire needed by", "Angajare necesară până la", c.hireBy);
  }
  return rows;
}

/** The rows as "Label: value" lines. */
export function roleDetailLines(rows: readonly RoleDetailRow[]): string[] {
  return rows.map((r) => `${r.label}: ${r.value}`);
}

/** The block appended to `requirements`: the heading, then one line per answer. Empty when nothing was answered. */
export function roleDetailsRequirementsBlock(rows: readonly RoleDetailRow[]): string {
  if (rows.length === 0) return "";
  return [ROLE_DETAILS_HEADING, ...roleDetailLines(rows)].join("\n");
}

/** Every label this file can produce, for the ATS parser's label list. */
export const ALL_ROLE_DETAIL_LABELS: readonly string[] = [
  "Norwegian at work",
  "Why Norwegian is needed",
  "English at work",
  ...[...new Set(ALL_TRADE_QUESTIONS.map((q) => q.summaryLabel))],
  "Worksite address",
  "Staffing project",
  "Assignment period",
  "Hours per week",
  "Shift pattern",
  "Hours approved on site by",
  "Protective equipment provided by the client",
  "Probation period",
  "Interviewed by",
  "Interview rounds",
  "Hire needed by",
];
