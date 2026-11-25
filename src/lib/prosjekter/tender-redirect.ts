import { tenderUrlFrom } from "@/lib/min-side/project-detail";

/**
 * "Se kunngjøringen" as a plain link (25 November 2026). The button used to open
 * an empty tab, ask for the address with a POST and then point the tab at it;
 * the owner pressed it on Min side and nothing opened. A link to one of these
 * routes opens in a new tab like any link, in every browser and with any
 * popup setting: the route runs the same POST (validation, rate limit, the
 * ATS counting the click) and answers with a redirect to the https address,
 * or with a short page saying why there is none.
 */
export async function tenderRedirect(answer: Response): Promise<Response> {
  const body = (await answer.json().catch(() => null)) as { error?: unknown } | null;
  const link = answer.status === 200 ? tenderUrlFrom(body) : null;
  if (link) return new Response(null, { status: 303, headers: { Location: link, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  const said = typeof body?.error === "string" && body.error.length <= 200 ? body.error : "";
  const message = answer.status === 429 ? said || "For mange forespørsler. Prøv igjen litt senere." : "Konkurransen er ikke åpen lenger.";
  return new Response(page(message), {
    status: answer.status === 429 ? 429 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function page(message: string): string {
  return `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Kunngjøringen</title></head><body style="font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#F4F6F9;color:#1B2B44"><main style="max-width:420px;padding:24px;text-align:center"><p style="font-size:17px;line-height:1.5">${escapeHtml(message)}</p><p style="font-size:15px;color:#5A6B82">Du kan lukke denne fanen.</p></main></body></html>`;
}
