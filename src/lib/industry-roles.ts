/**
 * Canonical industry → role labels for /request and candidate-count.
 * Keep in sync across UI and API.
 */

export const REQUEST_INDUSTRY_ROLE_GROUPS: { industry: string; roles: string[] }[] = [
  {
    industry: "Construction & Civil",
    roles: [
      "Carpenter",
      "Concrete worker",
      "Steel fixer/rebar",
      "Mason/Bricklayer",
      "Welder MIG/MAG",
      "Welder TIG",
      "Pipe welder",
      "Steel erector",
      "Scaffolder",
      "Roofer",
      "Plasterer",
      "Painter",
      "Tiler",
      "Insulator",
      "Civil labourer",
    ],
  },
  {
    industry: "Electrical & Technical",
    roles: [
      "Industrial electrician",
      "Building electrician",
      "Automation technician",
      "Instrumentation technician",
      "HVAC technician",
      "Refrigeration technician",
    ],
  },
  {
    industry: "Logistics & Transport",
    roles: [
      "Truck driver C/CE",
      "Bus driver D",
      "Delivery driver B",
      "Forklift operator",
      "Warehouse worker",
      "Crane operator",
    ],
  },
  {
    industry: "Industry & Production",
    roles: [
      "CNC operator",
      "Machine operator",
      "Production worker",
      "Quality control",
      "Mechanic industrial",
      "Maintenance technician",
      "Pipefitter",
    ],
  },
  {
    industry: "Cleaning & Facility",
    roles: ["Cleaner", "Facility manager", "Janitor", "Window cleaner"],
  },
  {
    industry: "Hospitality & Healthcare",
    roles: ["Helsefagarbeider", "Pleiemedhjelper", "Cook", "Kitchen assistant", "Waiter", "Hotel staff"],
  },
  {
    industry: "Automotive & Mechanics",
    roles: ["Car mechanic", "Heavy equipment mechanic", "Auto body", "Tire technician"],
  },
  {
    industry: "Offshore & Onshore",
    roles: [
      "Offshore welder",
      "Offshore scaffolder",
      "Offshore rigger",
      "Onshore process operator",
      "ROV technician",
    ],
  },
  {
    industry: "Other / General Labour",
    roles: ["General labourer", "Helper"],
  },
];

/** Extra search tokens per canonical role (Norwegian + common variants). */
export const ROLE_SYNONYMS: Record<string, string[]> = {
  Carpenter: ["tømrer", "snekker", "carpentry"],
  "Concrete worker": ["betongarbeider", "betong", "concrete"],
  "Steel fixer/rebar": ["armerer", "jernbinder", "rebar", "betongarmering"],
  "Mason/Bricklayer": ["murer", "murere", "bricklayer", "masonry"],
  "Welder MIG/MAG": ["sveiser", "mig", "mag", "co2", "welder"],
  "Welder TIG": ["sveiser", "tig", "welder"],
  "Pipe welder": ["rørsveiser", "pipesveiser", "rør sveiser", "pipe weld"],
  "Steel erector": ["stålmontør", "steel assembly", "montør"],
  Scaffolder: ["stillasbygger", "stillas", "scaffolding"],
  Roofer: ["taktekker", "tak", "roofing"],
  Plasterer: ["pussarbeider", "gips", "stukkatur"],
  Painter: ["maler", "maling"],
  Tiler: ["flislegger", "flis"],
  Insulator: ["isolatør", "isolering"],
  "Civil labourer": ["anleggsarbeider", "anlegg", "gravearbeider", "labourer"],

  "Industrial electrician": ["industrielektriker", "industri elkraft"],
  "Building electrician": ["bygningselektriker", "elektriker", "installatør"],
  "Automation technician": ["automatikker", "automasjon", "plc"],
  "Instrumentation technician": ["instrumentering", "feltinstrumentering"],
  "HVAC technician": ["ventilasjon", "klima", "varme og ventilasjon", "vvs tekniker"],
  "Refrigeration technician": ["kjøletekniker", "kulde", "klimaanlegg"],

  "Truck driver C/CE": ["lastebil", "vogntog", "sjåfør", "c/ce", "yrkessjåfør"],
  "Bus driver D": ["bussjåfør", "buss", "d-kort"],
  "Delivery driver B": ["budbil", "varebil", "bud"],
  "Forklift operator": ["truckfører", "truck", "gaffeltruck", "fltruck"],
  "Warehouse worker": ["lagerarbeider", "lager", "logistikk arbeider"],
  "Crane operator": ["kranfører", "kran"],

  "CNC operator": ["cnc", "maskinkjører"],
  "Machine operator": ["maskinoperatør", "maskin"],
  "Production worker": ["produksjonsarbeider", "produksjon"],
  "Quality control": ["kvalitet", "kvalitetskontroll", "qc"],
  "Mechanic industrial": ["industrimekaniker", "mekaniker"],
  "Maintenance technician": ["vedlikehold", "vedlikeholdstekniker", "driftstekniker"],
  Pipefitter: ["rørlegger industri", "rørmontør", "pipe fitter"],

  Cleaner: ["renholder", "renhold"],
  "Facility manager": ["drift ansvarlig", "facility"],
  Janitor: ["vaktmester", "servicearbeider"],
  "Window cleaner": ["fasadeworker", "vinduspuss"],

  Helsefagarbeider: ["health care worker", "helsefag", "sykepleierassistent"],
  Pleiemedhjelper: ["pleier", "omsorg", "hjelpepleier"],
  Cook: ["kokk", "chef"],
  "Kitchen assistant": ["kjøkkenhjelp", "kjøkken assistent"],
  Waiter: ["servitør", "servise"],
  "Hotel staff": ["hotell", "resepsjon", "housekeeping"],

  "Car mechanic": ["personbil mekaniker", "verksted mekaniker"],
  "Heavy equipment mechanic": ["anleggsmaskin mekaniker", "tung mekaniker"],
  "Auto body": ["karosseri", "lakkerer", "platesmed"],
  "Tire technician": ["dekk", "dekktekniker"],

  "Offshore welder": ["offshore sveiser", "offshore welding"],
  "Offshore scaffolder": ["offshore stillas"],
  "Offshore rigger": ["offshore rigging", "rigger"],
  "Onshore process operator": ["prosesstekniker", "anleggsoperatør"],
  "ROV technician": ["rov", "undervanns teknologi"],

  "General labourer": ["arbeider", "hjelp arbeider", "allround"],
  Helper: ["hjelpearbeider", "medhjelper"],
};

export function roleSearchKeywords(role: string): string[] {
  const extra = ROLE_SYNONYMS[role];
  return extra?.length ? [role, ...extra] : [role];
}

export function rolesForIndustry(industry: string): string[] {
  const g = REQUEST_INDUSTRY_ROLE_GROUPS.find((x) => x.industry === industry);
  return g ? [...g.roles] : [];
}
