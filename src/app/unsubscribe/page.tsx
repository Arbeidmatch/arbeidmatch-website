import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Meld av e-post | ArbeidMatch" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The confirmation step before anyone is taken off a list.
 *
 * The link in our letters used to unsubscribe on a plain GET, and a GET is
 * what every mail security scanner does to every link it sees: clients were
 * unsubscribed by their own firewall before they had read the letter. Now the
 * link only opens this page, and the unsubscribe happens when a person presses
 * the button, which POSTs the token to /api/unsubscribe.
 *
 * In Norwegian first, since most of our letters go to Norwegian clients, with
 * the English line under it for the candidates who read English.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const valid = /^[A-Za-z0-9-]{8,200}$/.test(token);

  return (
    <div
      style={{
        minHeight: "70vh",
        background: "#0D1B2A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        {valid ? (
          <>
            <h1 style={{ color: "#ffffff", fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>
              Vil du melde deg av e-post fra ArbeidMatch?
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 6 }}>
              Trykk på knappen for å bekrefte. Du får da ikke flere slike e-poster fra oss.
            </p>
            <p lang="en" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 28 }}>
              Press the button to confirm that you no longer want these emails from ArbeidMatch.
            </p>
            <form method="post" action="/api/unsubscribe">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  background: "#C9A84C",
                  color: "#0D1B2A",
                  border: 0,
                  borderRadius: 10,
                  padding: "12px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                Meld meg av / Unsubscribe
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ color: "#ffffff", fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>
              Lenken er ugyldig.
            </h1>
            <p lang="en" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 28 }}>
              This unsubscribe link is invalid.
            </p>
          </>
        )}
        <p style={{ marginTop: 32 }}>
          <Link href="/" style={{ color: "#C9A84C", fontSize: 14, textDecoration: "none" }}>
            Til forsiden
          </Link>
        </p>
      </div>
    </div>
  );
}
