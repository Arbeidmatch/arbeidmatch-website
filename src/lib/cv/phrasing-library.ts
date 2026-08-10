/**
 * Phrasing library for the "Improve this" button.
 *
 * Authored once with the Claude Code CLI and shipped as static data. Nothing here calls
 * an AI service at runtime: the suggestion engine matches against this file inside the
 * browser, so a candidate's draft text never leaves their device before they consent.
 *
 * Adding a trade means adding a block below, not changing code.
 */

export interface TradeProfile {
  id: string;
  /** Lower case words that identify the trade in a headline or job title. */
  match: string[];
  /** English job title an employer would search for. */
  title: string;
  /** Sentences offered for the professional summary, in order. */
  summary: string[];
  /** Model bullets for the work experience section. */
  bullets: string[];
}

export const TRADE_PROFILES: TradeProfile[] = [
  {
    id: "tiler",
    match: ["tiler", "tiling", "flislegger", "faiantar", "faianta"],
    title: "Tiler",
    summary: [
      "on residential and commercial sites",
      "Certified for wet room work and used to delivering bathrooms that pass inspection first time.",
      "Comfortable reading technical drawings, setting out complex patterns and working to a fixed handover date.",
    ],
    bullets: [
      "Installed floor and wall tiling in residential bathrooms.",
      "Delivered wet room membrane work to TEK17 requirements.",
      "Set out large format porcelain and mosaic patterns from architect drawings.",
      "Prepared substrates, levelled floors and applied waterproofing before tiling.",
      "Coordinated with plumbers and electricians to keep handovers on the site programme.",
    ],
  },
  {
    id: "carpenter",
    match: ["carpenter", "tomrer", "snekker", "dulgher", "joiner"],
    title: "Carpenter",
    summary: [
      "in construction and interior finishing",
      "Skilled in formwork, framing and interior fit-out to Norwegian standards.",
      "Works from drawings, sets out accurately and keeps to the site programme.",
    ],
    bullets: [
      "Built and stripped formwork for in-situ concrete elements.",
      "Framed timber walls, floors and roof structures from drawings.",
      "Installed doors, windows, skirting and interior panelling.",
      "Fitted insulation and vapour barriers to meet energy requirements.",
      "Measured, cut and assembled components to tolerances set out on site.",
    ],
  },
  {
    id: "welder",
    match: ["welder", "welding", "sveiser", "sudor", "sudura", "mig", "tig"],
    title: "Welder",
    summary: [
      "in structural steel and pipe fabrication",
      "Qualified in MIG and TIG welding and used to working to drawings and weld procedure specifications.",
      "Produces welds that pass visual and NDT inspection first time.",
    ],
    bullets: [
      "Welded structural steel sections using MIG and MAG processes.",
      "Carried out TIG welding on stainless steel pipework.",
      "Read isometric drawings and weld procedure specifications before starting each joint.",
      "Prepared, fitted and tacked components ahead of final welding.",
      "Inspected finished welds and corrected defects before handover to NDT.",
    ],
  },
  {
    id: "electrician",
    match: ["electrician", "elektriker", "electrician", "electric", "elektro"],
    title: "Electrician",
    summary: [
      "across residential and commercial installations",
      "Experienced in first and second fix, fault finding and testing.",
      "Comfortable working to Norwegian standards and documenting completed work.",
    ],
    bullets: [
      "Installed cable trays, conduit and containment through new build floors.",
      "Carried out first and second fix wiring for apartments and offices.",
      "Terminated and tested distribution boards before energising.",
      "Traced and repaired faults on live installations with minimal downtime.",
      "Documented completed circuits for handover to the client.",
    ],
  },
  {
    id: "plumber",
    match: ["plumber", "rorlegger", "instalator", "pipefitter", "plumbing"],
    title: "Plumber",
    summary: [
      "in sanitary and heating installations",
      "Experienced in wet room installations, pressure testing and fault finding.",
      "Works to drawings and hands over installations documented and tested.",
    ],
    bullets: [
      "Installed sanitary ware, pipework and drainage in apartment bathrooms.",
      "Pressure tested completed systems and recorded the results for handover.",
      "Fitted underfloor heating manifolds and connected them to the heat source.",
      "Traced and repaired leaks on existing installations.",
      "Coordinated with tilers so wet room sequences stayed on programme.",
    ],
  },
  {
    id: "painter",
    match: ["painter", "maler", "zugrav", "painting", "decorator"],
    title: "Painter",
    summary: [
      "in interior and exterior decorating",
      "Skilled in surface preparation, filling and spray application.",
      "Delivers finishes that pass client inspection without rework.",
    ],
    bullets: [
      "Prepared, filled and sanded surfaces before applying primer and topcoats.",
      "Applied paint by brush, roller and spray to interior and exterior surfaces.",
      "Masked and protected finished areas to avoid damage from other trades.",
      "Matched colours and finishes to the client specification.",
      "Estimated material quantities and kept waste to a minimum.",
    ],
  },
  {
    id: "scaffolder",
    match: ["scaffold", "stillas", "schela", "scaffolder"],
    title: "Scaffolder",
    summary: [
      "erecting and dismantling access scaffolding",
      "Holds a scaffolding course certificate and works strictly to the erection drawing.",
      "Used to inspecting completed structures and tagging them before handover.",
    ],
    bullets: [
      "Erected and dismantled tube and system scaffolding to the erection drawing.",
      "Installed edge protection, ties and bracing to the required load class.",
      "Inspected completed scaffolds and tagged them before handover to other trades.",
      "Loaded, unloaded and stacked scaffold materials safely on site.",
      "Worked at height using fall arrest equipment throughout.",
    ],
  },
  {
    id: "forklift-warehouse",
    match: ["forklift", "warehouse", "truckforer", "lager", "logistics", "picker", "stivuitorist", "depozit"],
    title: "Warehouse Operative",
    summary: [
      "in warehouse and logistics operations",
      "Holds a forklift licence and is used to working to daily pick and dispatch targets.",
      "Careful with stock accuracy and comfortable with handheld scanners and WMS systems.",
    ],
    bullets: [
      "Operated a counterbalance forklift, loading and unloading deliveries.",
      "Picked and packed customer orders against a daily dispatch target.",
      "Booked goods in and out using a handheld scanner and the warehouse system.",
      "Carried out stock counts and reported discrepancies the same day.",
      "Kept aisles, racking and loading areas clear and safe.",
    ],
  },
  {
    id: "driver",
    match: ["driver", "sjafor", "sofer", "hgv", "lorry", "truck driver", "delivery"],
    title: "Driver",
    summary: [
      "in distribution and delivery work",
      "Holds a valid licence and drives to schedule while keeping to driving hours rules.",
      "Careful with load security, vehicle checks and delivery paperwork.",
    ],
    bullets: [
      "Delivered goods to customers across a fixed daily route.",
      "Carried out vehicle checks before and after every shift and reported defects.",
      "Secured loads correctly and checked weight distribution before setting off.",
      "Completed delivery paperwork and obtained signatures at each drop.",
      "Planned routes to keep deliveries within the agreed time windows.",
    ],
  },
  {
    id: "cleaner",
    match: ["cleaner", "cleaning", "renhold", "curatenie", "housekeeping", "vaskehjelp"],
    title: "Cleaner",
    summary: [
      "in commercial and hospitality cleaning",
      "Works to a daily schedule and keeps consistent standards without supervision.",
      "Trained in the safe handling of cleaning chemicals and equipment.",
    ],
    bullets: [
      "Cleaned and prepared guest rooms to the hotel standard, working to a daily room target.",
      "Carried out daily cleaning of offices, washrooms and communal areas.",
      "Handled cleaning chemicals safely and according to the product data sheets.",
      "Restocked consumables and reported maintenance faults to the supervisor.",
      "Completed deep cleans and periodic tasks alongside the daily schedule.",
    ],
  },
  {
    id: "chef-kitchen",
    match: ["chef", "kitchen", "kokk", "bucatar", "cook", "kjokken"],
    title: "Chef",
    summary: [
      "in restaurant and hotel kitchens",
      "Works a section under pressure and keeps to the recipe and portion specification.",
      "Trained in food hygiene and careful with temperature records and stock rotation.",
    ],
    bullets: [
      "Prepared and cooked dishes on a section during service.",
      "Followed recipe and portion specifications to keep food cost under control.",
      "Recorded fridge and cooking temperatures as part of the hygiene routine.",
      "Rotated stock and checked deliveries against the order.",
      "Kept the section clean and set up ready for the next service.",
    ],
  },
  {
    id: "care-worker",
    match: ["care", "helsefagarbeider", "nurse", "asistent", "healthcare", "pleie"],
    title: "Care Worker",
    summary: [
      "in residential and home care settings",
      "Supports residents with daily living while respecting dignity and independence.",
      "Careful with documentation, medication routines and handover notes.",
    ],
    bullets: [
      "Supported residents with personal care, mobility and meals.",
      "Recorded observations and changes in condition in the care record.",
      "Assisted with medication rounds under the agreed procedure.",
      "Handed over clearly to the next shift so nothing was missed.",
      "Worked with families and colleagues to keep care plans up to date.",
    ],
  },
];

/** Skill wording an employer searches for, keyed by what candidates actually type. */
export const SKILL_NORMALISATION: Array<{ match: string[]; skill: string }> = [
  { match: ["tiles", "tile", "tiling", "faianta", "gresie"], skill: "Wall and floor tiling" },
  { match: ["waterproof", "waterproofing", "membrane", "vatrom", "wet room"], skill: "Wet room membranes" },
  { match: ["hms", "hms-kort", "hse card", "hse"], skill: "HSE card (HMS-kort)" },
  { match: ["varme arbeider", "hot work"], skill: "Hot work certificate (varme arbeider)" },
  { match: ["stillas", "scaffold course", "scaffolding course"], skill: "Scaffolding course (stillaskurs)" },
  { match: ["forklift", "truck", "truckforer", "stivuitor"], skill: "Forklift operation (truckforerbevis)" },
  { match: ["mig", "mig welding", "mag"], skill: "MIG welding" },
  { match: ["tig", "tig welding"], skill: "TIG welding" },
  { match: ["drawings", "blueprint", "technical drawing", "desen tehnic"], skill: "Reading technical drawings" },
  { match: ["formwork", "cofraj", "shuttering"], skill: "Formwork" },
  { match: ["framing", "timber frame"], skill: "Timber framing" },
  { match: ["first fix", "second fix"], skill: "First and second fix" },
  { match: ["fault finding", "troubleshoot", "diagnostic"], skill: "Fault finding" },
  { match: ["safety", "hse", "sikkerhet", "protectia muncii"], skill: "Site safety" },
  { match: ["spray", "spraying", "spray painting"], skill: "Spray application" },
  { match: ["plaster", "plastering", "gips"], skill: "Plastering" },
  { match: ["scanner", "wms", "warehouse system"], skill: "Warehouse systems and scanners" },
  { match: ["stock", "inventory", "stoc"], skill: "Stock control" },
  { match: ["food hygiene", "haccp", "igiena"], skill: "Food hygiene (HACCP)" },
  { match: ["first aid", "prim ajutor", "forstehjelp"], skill: "First aid" },
];

/** Openers that carry no information and are removed before rewriting. */
export const EMPTY_PHRASES = [
  "hard working",
  "hardworking",
  "hard worker",
  "fast learner",
  "quick learner",
  "team player",
  "good communication skills",
  "motivated person",
  "i am a motivated",
  "looking for a job",
  "i want to work",
  "i can do many things",
  "i can do anything",
  "responsible person",
  "punctual person",
];

/** Weak openers, with the action verb that replaces them. */
export const WEAK_OPENERS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^(i\s+was\s+)?responsible\s+for\s+/i, replacement: "" },
  { pattern: /^(i\s+)?was\s+working\s+(with|on|in)\s+/i, replacement: "Worked with " },
  { pattern: /^(i\s+)?worked\s+(with|on|in)\s+/i, replacement: "Worked with " },
  { pattern: /^(i\s+)?helped\s+(with\s+)?/i, replacement: "Assisted with " },
  { pattern: /^helping\s+(with\s+)?/i, replacement: "Assisted with " },
  { pattern: /^(i\s+)?did\s+/i, replacement: "Carried out " },
  { pattern: /^(i\s+)?made\s+/i, replacement: "Produced " },
  { pattern: /^doing\s+/i, replacement: "Carried out " },
  { pattern: /^(i\s+)?take\s+care\s+of\s+/i, replacement: "Managed " },
  { pattern: /^(i\s+)?used\s+to\s+/i, replacement: "" },
];

/** Present participles turned into the past tense an employer expects on a CV. */
export const GERUND_TO_PAST: Record<string, string> = {
  installing: "Installed",
  building: "Built",
  cleaning: "Cleaned",
  driving: "Operated",
  welding: "Welded",
  painting: "Painted",
  cooking: "Cooked",
  fixing: "Repaired",
  repairing: "Repaired",
  loading: "Loaded",
  picking: "Picked",
  packing: "Packed",
  checking: "Inspected",
  managing: "Managed",
  working: "Worked",
  making: "Produced",
  preparing: "Prepared",
  measuring: "Measured",
  cutting: "Cut",
  assembling: "Assembled",
  supervising: "Supervised",
  training: "Trained",
  operating: "Operated",
};

/**
 * Misspellings seen in blue collar CVs written in English by Romanian, Polish and
 * Lithuanian speakers. Key is what gets typed, value is the correction. Matching is
 * case insensitive and the original capitalisation is kept.
 *
 * The browser's own spell checker underlines these while the candidate types. This map
 * exists so the "Improve this" button can also fix them without anybody right clicking,
 * and so the fix happens on the device rather than at a spelling service.
 */
export const MISSPELLINGS: Record<string, string> = {
  yeas: "years",
  yers: "years",
  yars: "years",
  yeard: "years",
  expirience: "experience",
  experiance: "experience",
  experince: "experience",
  exprience: "experience",
  expierience: "experience",
  experiencie: "experience",
  carpender: "carpenter",
  carpanter: "carpenter",
  carpentar: "carpenter",
  tiller: "tiler",
  weldor: "welder",
  plumer: "plumber",
  plummer: "plumber",
  electrican: "electrician",
  electritian: "electrician",
  mecanic: "mechanic",
  mechanik: "mechanic",
  painer: "painter",
  constructie: "construction",
  constuction: "construction",
  contruction: "construction",
  constructin: "construction",
  bulding: "building",
  buiding: "building",
  costruction: "construction",
  scafolding: "scaffolding",
  certificat: "certificate",
  certificaat: "certificate",
  certifikat: "certificate",
  cualified: "qualified",
  qualifed: "qualified",
  qualifyed: "qualified",
  responsable: "responsible",
  responsibil: "responsible",
  mantenance: "maintenance",
  maintainance: "maintenance",
  maintenence: "maintenance",
  equipement: "equipment",
  equipmant: "equipment",
  instalation: "installation",
  instaled: "installed",
  instal: "install",
  suppervisor: "supervisor",
  supervisior: "supervisor",
  aprentice: "apprentice",
  aprenticeship: "apprenticeship",
  wharehouse: "warehouse",
  warehous: "warehouse",
  forclift: "forklift",
  forklif: "forklift",
  drivning: "driving",
  lisence: "licence",
  licens: "licence",
  norwegan: "Norwegian",
  norvegian: "Norwegian",
  norvay: "Norway",
  bathrom: "bathroom",
  bathrrom: "bathroom",
  aparment: "apartment",
  apartement: "apartment",
  isolation: "insulation",
  insulaton: "insulation",
  measuring_: "measuring",
  wroking: "working",
  workin: "working",
  worked_: "worked",
  allways: "always",
  alot: "a lot",
  becouse: "because",
  beacuse: "because",
  wich: "which",
  whit: "with",
  ande: "and",
  teh: "the",
  adn: "and",
  seperate: "separate",
  recieve: "receive",
  acomodation: "accommodation",
  acommodation: "accommodation",
  goverment: "government",
  managment: "management",
  enviroment: "environment",
  develope: "develop",
  profesional: "professional",
  proffesional: "professional",
  comunication: "communication",
  colegue: "colleague",
  colleauge: "colleague",
  costumer: "customer",
  costumers: "customers",
  safty: "safety",
  saftey: "safety",
  helth: "health",
  qualiti: "quality",
  finising: "finishing",
  finnishing: "finishing",
  weldeing: "welding",
  weldng: "welding",
};

/**
 * Long words candidates cut short mid-typing. A token that is a prefix of exactly one of
 * these, is at least five letters, and is not itself a word gets completed.
 */
export const PREFIX_COMPLETIONS = [
  "experience",
  "construction",
  "certificate",
  "responsible",
  "maintenance",
  "equipment",
  "installation",
  "electrician",
  "scaffolding",
  "warehouse",
  "qualification",
  "supervisor",
  "apprentice",
  "professional",
  "machinery",
  "requirements",
  "residential",
  "commercial",
  "industrial",
  "insulation",
  "plumbing",
  "carpenter",
];

/** Real words that happen to be the start of a word above, so must be left alone. */
export const NOT_TRUNCATED = new Set([
  "certificate",
  "electric",
  "equip",
  "machine",
  "machines",
  "requirement",
  "resident",
  "residents",
  "scaffold",
  "commerce",
  "industry",
  "profess",
  "carpet",
  "carpets",
  ...PREFIX_COMPLETIONS,
]);

/**
 * First person openings, with what replaces them. A Norwegian CV summary is written in
 * the third person, which the field help already asks for and nothing enforced.
 */
export const FIRST_PERSON_REWRITES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^my name is [^,.]{1,40}[,.]?\s+/i, replacement: "" },
  { pattern: /^i\s*(?:am|'m)\s+(?:a|an)\s+/i, replacement: "" },
  { pattern: /^i\s*(?:am|'m)\s+/i, replacement: "" },
  { pattern: /^im\s+(?:a|an)\s+/i, replacement: "" },
  { pattern: /^i\s+(?:have\s+)?work(?:ed)?\s+as\s+(?:a|an)\s+/i, replacement: "" },
  { pattern: /\bi\s+have\s+been\s+working\b/gi, replacement: "has worked" },
  { pattern: /\bi\s+have\b/gi, replacement: "has" },
  { pattern: /\bi\s*(?:am|'m)\b/gi, replacement: "is" },
  { pattern: /\bi\s+work\b/gi, replacement: "works" },
  { pattern: /\bi\s+can\b/gi, replacement: "can" },
  { pattern: /\bi\s+speak\b/gi, replacement: "speaks" },
  { pattern: /\bi\s+hold\b/gi, replacement: "holds" },
];

export const ACTION_VERBS = [
  "Installed",
  "Operated",
  "Coordinated",
  "Inspected",
  "Maintained",
  "Supervised",
  "Reduced",
  "Delivered",
  "Built",
  "Prepared",
  "Repaired",
  "Assembled",
  "Measured",
  "Trained",
] as const;
