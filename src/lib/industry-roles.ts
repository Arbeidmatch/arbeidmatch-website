/**
 * Canonical industry → role labels for /request, token availability check, and candidate-count.
 * Keep in sync across UI and API.
 */

export type IndustryGroup = {
  id: string;
  label: string;
  roles: readonly string[];
};

/** Eleven single-domain industries (English labels). */
export const INDUSTRY_GROUPS: IndustryGroup[] = [
  {
    id: "building",
    label: "Building",
    roles: [
      "Carpenter",
      "Mason",
      "Plasterer",
      "Painter",
      "Tiler",
      "Insulator",
      "Drywaller",
      "Glazier",
      "Roofer",
      "Plumber",
      "Pipefitter",
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    roles: [
      "Excavator operator",
      "Concrete pump operator",
      "Civil labourer",
      "Steel fixer",
      "Concrete worker",
      "Steel erector",
      "Scaffolder",
    ],
  },
  {
    id: "welding",
    label: "Welding",
    roles: [
      "Welder MIG/MAG",
      "Welder TIG",
      "Pipe welder",
      "Boilermaker",
      "Sheet metal worker",
      "Offshore welder",
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    roles: [
      "Industrial electrician",
      "Building electrician",
      "Automation technician",
      "Instrumentation technician",
      "HVAC technician",
      "Refrigeration technician",
      "Marine electrician",
      "Solar installer",
    ],
  },
  {
    id: "production",
    label: "Production",
    roles: [
      "CNC operator",
      "Machine operator",
      "Production worker",
      "Quality control",
      "Maintenance technician",
      "Plant operator",
    ],
  },
  {
    id: "logistics",
    label: "Logistics",
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
    id: "cleaning",
    label: "Cleaning",
    roles: ["Cleaner", "Janitor", "Window cleaner", "Facility manager"],
  },
  {
    id: "hospitality",
    label: "Hospitality",
    roles: ["Cook", "Kitchen assistant", "Waiter", "Hotel staff", "Receptionist"],
  },
  {
    id: "automotive",
    label: "Automotive",
    roles: [
      "Car mechanic",
      "Heavy equipment mechanic",
      "HGV mechanic",
      "Auto body technician",
      "Tire technician",
    ],
  },
  {
    id: "offshore",
    label: "Offshore",
    roles: ["Offshore scaffolder", "Offshore rigger", "Onshore process operator", "ROV technician"],
  },
  {
    id: "general",
    label: "General Labour",
    roles: ["General labourer", "Helper"],
  },
];

/** Legacy shape for /request and APIs: `industry` is the display label. */
export const REQUEST_INDUSTRY_ROLE_GROUPS: { industry: string; roles: string[] }[] = INDUSTRY_GROUPS.map(({ label, roles }) => ({
  industry: label,
  roles: [...roles],
}));

/** Extra ATS title tokens per industry slug (merged into candidate-count industry queries). */
export const INDUSTRY_MAP: Record<string, string[]> = {
  building: ["Building", "Construction", "Bygg"],
  infrastructure: ["Infrastructure", "Civil", "Anlegg"],
  welding: ["Welding", "Sveising"],
  electrical: ["Electrical", "Elektro"],
  production: ["Production", "Industry", "Industri"],
  logistics: ["Logistics", "Transport", "Logistikk"],
  cleaning: ["Cleaning", "Renhold"],
  hospitality: ["Hospitality", "HoReCa"],
  automotive: ["Automotive", "Bilbransje"],
  offshore: ["Offshore"],
  general: ["General Labour", "Generelt"],
};

export function industrySlugForLabel(label: string): string | undefined {
  return INDUSTRY_GROUPS.find((g) => g.label === label)?.id;
}

/** Extra search tokens per canonical role (Norwegian + common variants). Keys match role labels exactly. */
export const ROLE_SYNONYMS: Record<string, string[]> = {
  Carpenter: ["carpenter", "tømrer", "snekker"],
  Mason: ["mason", "bricklayer", "murer"],
  Plasterer: ["plasterer", "pusser", "murpusser"],
  Painter: ["painter", "maler"],
  Tiler: ["tiler", "flislegger"],
  Insulator: ["insulator", "isolasjonsarbeider"],
  Drywaller: ["drywaller", "drywall fitter", "plasterboard", "gipsmonter"],
  Glazier: ["glazier", "glassmester"],
  Roofer: ["roofer", "taktekker"],
  Plumber: ["plumber", "rørlegger"],
  Pipefitter: ["pipefitter", "rørmontør", "rørmontor"],

  "Excavator operator": ["excavator operator", "digger operator", "gravemaskinfører", "gravemaskinforer"],
  "Concrete pump operator": ["concrete pump operator", "betongpumpe operatør", "betongpumpe operator"],
  "Civil labourer": ["civil labourer", "anleggsarbeider"],
  "Steel fixer": ["steel fixer", "rebar", "jernbinder", "armerer"],
  "Concrete worker": ["concrete worker", "betongarbeider"],
  "Steel erector": ["steel erector", "stålmontør", "stålmontor"],
  Scaffolder: ["scaffolder", "stillasbygger"],

  "Welder MIG/MAG": ["welder", "mig", "mag", "sveiser"],
  "Welder TIG": ["tig welder", "tig sveiser"],
  "Pipe welder": ["pipe welder", "rørsveiser"],
  Boilermaker: ["boilermaker", "kjelemaker"],
  "Sheet metal worker": ["sheet metal", "tinsmith", "blikkenslager"],
  "Offshore welder": ["offshore welder", "offshore sveiser"],

  "Industrial electrician": ["industrial electrician", "industrielektriker"],
  "Building electrician": ["building electrician", "byggelektriker", "elektriker"],
  "Automation technician": ["automation", "automatiker"],
  "Instrumentation technician": ["instrumentation", "instrumenttekniker"],
  "HVAC technician": ["hvac", "ventilasjon", "ventilasjonsarbeider"],
  "Refrigeration technician": ["refrigeration", "kulde", "kuldemontør"],
  "Marine electrician": ["marine electrician", "skipselektriker"],
  "Solar installer": ["solar installer", "solcelleinstallatør", "solcelleinstallator"],

  "CNC operator": ["cnc", "cnc operator"],
  "Machine operator": ["machine operator", "maskinoperatør"],
  "Production worker": ["production worker", "produksjonsarbeider"],
  "Quality control": ["quality control", "kvalitetskontroll", "qa"],
  "Maintenance technician": ["maintenance", "vedlikehold", "vedlikeholdstekniker"],
  "Plant operator": ["plant operator", "anleggsoperatør", "anleggsoperator"],

  "Truck driver C/CE": ["truck driver", "lastebilsjåfør", "sjåfør c", "sjåfør ce"],
  "Bus driver D": ["bus driver", "bussjåfør", "sjåfør d"],
  "Delivery driver B": ["delivery driver", "budbilsjåfør"],
  "Forklift operator": ["forklift", "truck", "truckfører", "gaffeltruck"],
  "Warehouse worker": ["warehouse", "lagerarbeider"],
  "Crane operator": ["crane operator", "kranfører"],

  Cleaner: ["cleaner", "renholder"],
  Janitor: ["janitor", "vaktmester"],
  "Window cleaner": ["window cleaner", "vinduspusser"],
  "Facility manager": ["facility manager", "driftsoperatør"],

  Cook: ["cook", "kokk"],
  "Kitchen assistant": ["kitchen assistant", "kjøkkenassistent"],
  Waiter: ["waiter", "servitør"],
  "Hotel staff": ["hotel staff", "hotellansatt"],
  Receptionist: ["receptionist", "resepsjonist"],

  "Car mechanic": ["car mechanic", "bilmekaniker"],
  "Heavy equipment mechanic": ["heavy equipment mechanic", "anleggsmaskinmekaniker"],
  "HGV mechanic": ["hgv mechanic", "truck mechanic", "lastebilmekaniker"],
  "Auto body technician": ["auto body", "karosseri", "billakkerer"],
  "Tire technician": ["tire technician", "dekktekniker"],

  "Offshore scaffolder": ["offshore scaffolder", "offshore stillasbygger"],
  "Offshore rigger": ["offshore rigger", "rigger"],
  "Onshore process operator": ["process operator", "prosessoperatør"],
  "ROV technician": ["rov", "rov technician", "rov operatør"],

  "General labourer": ["general labourer", "generell arbeider", "arbeider"],
  Helper: ["helper", "hjelpearbeider"],
};

export function roleSearchKeywords(role: string): string[] {
  const extra = ROLE_SYNONYMS[role];
  return extra?.length ? [role, ...extra] : [role];
}

export function rolesForIndustry(industry: string): string[] {
  const g = REQUEST_INDUSTRY_ROLE_GROUPS.find((x) => x.industry === industry);
  return g ? [...g.roles] : [];
}
