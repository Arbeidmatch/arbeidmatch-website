import { parseKroner } from "@/lib/pay-conditions";

import { chosenRoles, isOutsideOurTrades, placeLine, summaryLine, tradeOf, whenLine, type RaskAnswers } from "./data";

/**
 * The popup's request as /api/save-employer-request takes it with
 * sourceVariant "rask" (ORDER 224). Nothing unasked is filled in: no name, no
 * phone, no service; the ATS shows those as not stated.
 */
export function buildRaskPayload(a: RaskAnswers, token: string, floor: number | null, serviceType?: "recruitment" | "staffing") {
  const from = parseKroner(a.payFrom);
  const to = a.payTo.trim() ? parseKroner(a.payTo) : from;
  const trade = tradeOf(a.trade);
  return {
    sourceVariant: "rask" as const,
    answerMode: "rolle" as const,
    token,
    company: a.company?.name ?? "",
    orgNumber: a.company?.orgNumber ?? "",
    email: a.email.trim().toLowerCase(),
    trade: a.trade,
    category: trade?.category ?? "Other",
    position: chosenRoles(a).join(", ").slice(0, 300),
    numberOfPositions: a.count,
    startDate: whenLine(a),
    county: a.county,
    city: placeLine(a),
    job_summary: summaryLine(a).slice(0, 1000),
    payFrom: from,
    payTo: to,
    payFloorAtSubmit: floor,
    equalTreatmentConfirmed: a.equalTreatment,
    benefits: [...a.benefits],
    outsideOurTrades: isOutsideOurTrades(a),
    // Only a warm-request ticket's popup asks the service (ATS ORDER 237).
    ...(serviceType ? { serviceType } : {}),
    website: "",
  };
}

/** What /api/request-otp is told about the request, as /request tells it. */
export function otpContext(a: RaskAnswers) {
  const roles = chosenRoles(a).join(", ").slice(0, 160);
  return {
    role: roles,
    roleDisplay: roles,
    industry: tradeOf(a.trade)?.category ?? "Other",
  };
}
