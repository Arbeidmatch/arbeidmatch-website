/**
 * The service a company asks us for, and which of them it may ask for.
 *
 * THE OWNER, 24 September 2026: "in acel formular de cerere trebuie sa poata
 * alege tipul de serviciu", and of the four services: "Fara bemanning la
 * agentii". A firm that is itself a bemannings or rekrutteringsbyra is never
 * offered staffing on the form. The ATS makes the same split when it builds
 * the offer (ats-recruitment src/lib/prospects/deck-request.ts, offerPackageFor).
 *
 * The keys are what reaches the ATS: the website row keeps the key in
 * `hiring_type` (the column the ATS reads its service from) and in
 * `form_answers.service_type`, beside `form_answers.requester_is_agency`.
 *
 * Job advertising is shown and cannot be chosen yet ("Kommer snart"). Its key
 * is listed so the ATS vocabulary stays whole, but no form accepts it.
 *
 * Pure on purpose: the picker, the wizard and the save route all read it.
 */

export const REQUEST_SERVICE_KEYS = ["staffing", "recruitment", "sourcing", "advertising"] as const;
export type RequestServiceKey = (typeof REQUEST_SERVICE_KEYS)[number];

/** The services a request can be sent for today. */
export const SELECTABLE_REQUEST_SERVICES = ["staffing", "recruitment", "sourcing"] as const;
export type SelectableRequestService = (typeof SELECTABLE_REQUEST_SERVICES)[number];

/** Which of the two kinds of firm is asking, in the ATS's own words. */
export const REQUESTER_KINDS = ["own_operation", "agency"] as const;
export type RequesterKind = (typeof REQUESTER_KINDS)[number];

export function isRequesterKind(value: unknown): value is RequesterKind {
  return value === "own_operation" || value === "agency";
}

export function isSelectableRequestService(value: unknown): value is SelectableRequestService {
  return typeof value === "string" && (SELECTABLE_REQUEST_SERVICES as readonly string[]).includes(value);
}

/**
 * Whether this firm may ask for this service. An agency may not ask for
 * staffing; nobody may ask for advertising yet. An unknown kind (a request
 * from a wizard opened before the question existed) is judged on the service
 * alone.
 */
export function isServiceAllowedFor(service: unknown, kind: RequesterKind | null | undefined): boolean {
  if (!isSelectableRequestService(service)) return false;
  if (kind === "agency" && service === "staffing") return false;
  return true;
}

/** The choice kept only when it is still allowed for the kind, else cleared. */
export function keepServiceIfAllowed(service: string, kind: RequesterKind | null | undefined): string {
  return isServiceAllowedFor(service, kind) ? service : "";
}

export type ServiceCard = {
  key: RequestServiceKey;
  label: string;
  blurb: string;
  /** Shown, never selectable. */
  comingSoon: boolean;
};

/** The four services as the Norwegian picker on /request shows them. */
export const REQUEST_SERVICE_CARDS_NB: readonly ServiceCard[] = [
  { key: "staffing", label: "Bemanning", blurb: "Vi leier ut fagfolk som er ansatt hos oss.", comingSoon: false },
  { key: "recruitment", label: "Rekruttering", blurb: "Vi tar hele prosessen frem til ansettelse hos dere.", comingSoon: false },
  { key: "sourcing", label: "Sourcing", blurb: "Vi finner og sorterer kandidatene, dere ansetter selv.", comingSoon: false },
  { key: "advertising", label: "Stillingsannonser", blurb: "Kommer snart", comingSoon: true },
];

/** The cards this kind of firm sees: an agency never sees Bemanning. */
export function serviceCardsFor<T extends { key: RequestServiceKey }>(cards: readonly T[], kind: RequesterKind | null | undefined): T[] {
  return cards.filter((card) => !(kind === "agency" && card.key === "staffing"));
}

/**
 * THE CHOICE, CARRIED FROM THE PICKER INTO THE WIZARD.
 *
 * Neither the access code nor the request token has a column for it, so it
 * travels on the wizard's address (?service=...&kind=...) and the wizard keeps
 * it per token in the browser, so a reload or a reopened link in the same
 * browser opens on the same answer. The wizard asks both questions again on its
 * first step, prefilled, so a link opened anywhere else is asked, never guessed.
 */
export type CarriedServiceChoice = { service: SelectableRequestService | ""; kind: RequesterKind | "" };

export function readCarriedServiceChoice(serviceRaw: unknown, kindRaw: unknown): CarriedServiceChoice {
  const kind = isRequesterKind(kindRaw) ? kindRaw : "";
  const service = isServiceAllowedFor(serviceRaw, kind || null) ? (serviceRaw as SelectableRequestService) : "";
  return { service, kind };
}

/** The wizard's address with the choice on it. */
export function withServiceChoice(redirectUrl: string, choice: CarriedServiceChoice): string {
  const params = new URLSearchParams();
  if (choice.service) params.set("service", choice.service);
  if (choice.kind) params.set("kind", choice.kind);
  const query = params.toString();
  if (!query) return redirectUrl;
  return `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}${query}`;
}

export function serviceChoiceStorageKey(token: string): string {
  return `am_request_service:${token}`;
}

/**
 * THE CONTRACT TYPE OF A STAFFING REQUEST (the owner, 24 September 2026).
 *
 * A staffing client does not choose one: our people are hired out to him for
 * the assignment, which is what the form's existing "Temporary hire" says.
 * The save route and the request letters set it from the service, never from
 * what the browser sent, so a staffing request always reaches the ATS with
 * the same words. Every other service keeps the client's own answer.
 */
export const STAFFING_CONTRACT_TYPE = "Temporary hire";

export function contractTypeForService(service: string | null | undefined, given: string | null | undefined): string {
  if (service === "staffing") return STAFFING_CONTRACT_TYPE;
  return String(given ?? "").trim();
}
