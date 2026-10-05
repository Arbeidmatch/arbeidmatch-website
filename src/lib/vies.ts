import "server-only";

/**
 * A VAT number checked in VIES, the European Commission's free register
 * service (no key). "unreachable" is a technical failure, said as such and
 * never read as a refusal.
 */
export type ViesResult = { status: "valid"; name: string | null } | { status: "invalid" } | { status: "unreachable" };

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

export async function checkVies(countryCode: string, vatNumber: string): Promise<ViesResult> {
  if (!/^[A-Z]{2}$/.test(countryCode) || !/^[A-Z0-9]{2,14}$/.test(vatNumber)) return { status: "invalid" };
  try {
    const res = await fetch(VIES_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ countryCode, vatNumber }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { status: "unreachable" };
    const data = (await res.json()) as { valid?: boolean; name?: string | null; userError?: string; actionSucceed?: boolean };
    // A member state's own register being down is reported as a user error, not a no.
    if (data.userError && data.userError !== "VALID" && data.userError !== "INVALID") return { status: "unreachable" };
    if (data.valid === true) {
      const name = String(data.name ?? "").trim();
      return { status: "valid", name: name && name !== "---" ? name : null };
    }
    return { status: "invalid" };
  } catch {
    return { status: "unreachable" };
  }
}
