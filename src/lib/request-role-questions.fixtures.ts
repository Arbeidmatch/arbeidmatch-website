import { EMPTY_ROLE_ANSWERS, type RoleAnswers } from "./request-role-questions";

/** A staffing request as a client would fill it in. Used for the ATS parser fixture too. */
export const STAFFING_SAMPLE: RoleAnswers = {
  ...EMPTY_ROLE_ANSWERS,
  norwegianLevel: "Good spoken",
  norwegianReason: "Safety briefings on site are in Norwegian",
  englishLevel: "Basic",
  trade: { dsb: "Yes", electrical_work: ["Service", "Installation"] },
  staffing: {
    worksiteStreet: "Storgata 12",
    worksitePostcode: "0155",
    worksiteCity: "Oslo",
    periodFrom: "2026-10-05",
    periodTo: "",
    periodOpenEnded: true,
    hoursPerWeek: "37,5",
    shiftPattern: ["Night", "Day"],
    approverName: "Site Manager",
    approverPhone: "+47 900 00 000",
    ppeProvided: "Yes",
  },
};

export const RECRUITMENT_SAMPLE: RoleAnswers = {
  ...EMPTY_ROLE_ANSWERS,
  norwegianLevel: "Not needed",
  englishLevel: "Good spoken",
  trade: { welding_methods: ["TIG", "MIG/MAG"], welding_cert: "Yes" },
  recruitment: { probation: "6 months", interviewer: "Production manager", interviewRounds: "2", hireBy: "2026-11-02" },
};
