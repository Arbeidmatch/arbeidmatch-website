import type { TradeKey } from "@/lib/pay-conditions";

/**
 * A "Ja, vi trenger folk" from a warm-request letter (ATS ORDER 237).
 *
 * The letter's button goes through the ATS, which records the Ja and mints a
 * request ticket (request_tokens, how_did_you_hear = "warm_request") for the
 * firm and its general address, then sends the reader here:
 * /?rask=<ticket>&kilde=warm_request&fag=bygg&rolle=tømrer&fylke=NO060&sted=Trondheim&tjenester=recruitment
 * Rask forespørsel opens on that ticket with the firm, the role and the place
 * filled in, and without the code by e-mail: we wrote to that address
 * ourselves. The services are the ones the letter could lawfully offer; the
 * ATS refuses hire-in again for a firm offered recruitment only.
 */

export const WARM_SOURCE = "warm_request";

export type WarmService = "recruitment" | "staffing";

export type WarmOpen = {
  ticket: string;
  trade: TradeKey | "";
  role: string;
  county: string;
  town: string;
  services: WarmService[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRADES: readonly TradeKey[] = ["bygg", "elektro", "industri", "logistikk", "helse", "horeca", "renhold", "annet"];

/** The fifteen counties by the code the ATS uses. */
export const COUNTY_BY_CODE: Record<string, string> = {
  NO092: "Agder",
  NO0A1: "Rogaland",
  NO094: "Telemark",
  NO093: "Vestfold",
  NO083: "Østfold",
  NO081: "Oslo",
  NO084: "Akershus",
  NO085: "Buskerud",
  NO0A2: "Vestland",
  NO020: "Innlandet",
  NO0A3: "Møre og Romsdal",
  NO060: "Trøndelag",
  NO071: "Nordland",
  NO072: "Troms",
  NO073: "Finnmark",
};

const plain = (v: string | null, max: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

/** The warm open from the address, or null when this is not one. */
export function readWarmOpen(query: Pick<URLSearchParams, "get">): WarmOpen | null {
  const ticket = String(query.get("rask") ?? "").trim();
  if (!UUID.test(ticket) || query.get("kilde") !== WARM_SOURCE) return null;
  const fag = String(query.get("fag") ?? "") as TradeKey;
  const services = String(query.get("tjenester") ?? "")
    .split(",")
    .filter((s): s is WarmService => s === "recruitment" || s === "staffing");
  return {
    ticket,
    trade: TRADES.includes(fag) ? fag : "",
    role: plain(query.get("rolle"), 80),
    county: COUNTY_BY_CODE[String(query.get("fylke") ?? "").toUpperCase()] ?? "",
    town: plain(query.get("sted"), 80),
    // Recruitment is always lawful; hire-in only when the letter offered it.
    services: services.includes("recruitment") ? services : ["recruitment", ...services],
  };
}

/** True for a ticket a warm-request letter minted. */
export function isWarmTicket(row: { how_did_you_hear?: string | null } | null | undefined): boolean {
  return String(row?.how_did_you_hear ?? "").trim() === WARM_SOURCE;
}

/** The service kept for the request: hire-in only when it was offered. */
export function warmServiceKept(open: Pick<WarmOpen, "services">, chosen: string | null | undefined): WarmService {
  return chosen === "staffing" && open.services.includes("staffing") ? "staffing" : "recruitment";
}
