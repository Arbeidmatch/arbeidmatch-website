import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { tenderRedirect } from "@/lib/prosjekter/tender-redirect";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Se kunngjøringen as a link (25 November 2026)", () => {
  it("redirects to the https address the POST answered, without a referrer", async () => {
    const r = await tenderRedirect(json({ url: "https://permalink.mercell.com/294606507.aspx" }));
    expect(r.status).toBe(303);
    expect(r.headers.get("Location")).toBe("https://permalink.mercell.com/294606507.aspx");
    expect(r.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("never redirects to another scheme, and says why when there is no address", async () => {
    for (const bad of [json({ url: "javascript:alert(1)" }), json({ url: "http://x.no" }), json({ error: "Prosjektet ble ikke funnet." }, 404)]) {
      const r = await tenderRedirect(bad);
      expect(r.status).toBe(404);
      expect(r.headers.get("Location")).toBeNull();
      expect(await r.text()).toContain("Konkurransen er ikke åpen lenger.");
    }
    const many = await tenderRedirect(json({ error: "For mange forespørsler. Prøv igjen litt senere." }, 429));
    expect(many.status).toBe(429);
    expect(await many.text()).toContain("For mange forespørsler");
  });

  it("is a plain link on every screen, with no empty tab opened first", () => {
    for (const file of ["../../components/prosjekter/ProjectDetail.tsx", "../../components/prosjekter/ProjectPresentationClient.tsx"]) {
      const src = readFileSync(path.resolve(__dirname, file), "utf8");
      expect(src).not.toContain('window.open("", "_blank")');
      expect(src).toContain("/kunngjoring");
      expect(src).toContain('target="_blank" rel="noopener noreferrer"');
    }
  });
});
