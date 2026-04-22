import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUEST_ID = "0d23b615-e452-4eed-a07a-26361de57e34";
const SLUG = "automotive-technician-jaguar-land-rover-oslo";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  let url = "";
  let key = "";
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (k === "NEXT_PUBLIC_SUPABASE_URL") url = v;
    if (k === "SUPABASE_SERVICE_ROLE_KEY") key = v;
  }
  return { url, key };
}

async function main() {
  const { url, key } = loadEnv();
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const reqRes = await fetch(`${url}/rest/v1/employer_requests?id=eq.${REQUEST_ID}&select=notes`, { headers });
  const reqRows = await reqRes.json();
  if (!reqRes.ok) throw new Error(`Fetch request: ${JSON.stringify(reqRows)}`);
  const notes = reqRows[0]?.notes;
  if (!notes || typeof notes !== "string") throw new Error("Missing notes on employer_requests row");

  const bodyText = notes.trim();
  const published = new Date().toISOString().slice(0, 10);

  const row = {
    employer_request_id: REQUEST_ID,
    slug: SLUG,
    title: "Automotive Technician – Jaguar & Land Rover",
    description: bodyText,
    requirements: bodyText,
    salary_min: 250,
    salary_max: 300,
    hours: null,
    rotation: null,
    license_required: true,
    housing_provided: false,
    travel_paid: false,
    status: "live",
    company_name: "PEOPLE AS",
    employer_email: "as@people.no",
    location: "Oslo, Norway",
    category: "Automotive",
    mapped_job_type: "Automotive",
    experience_years_min: 3,
    edit_token: null,
    token_expires_at: null,
    locked_at: null,
    published_at: published,
  };

  const ins = await fetch(`${url}/rest/v1/employer_jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(row),
  });
  const data = await ins.json();

  if (!ins.ok) {
    console.error("Insert failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const inserted = Array.isArray(data) ? data[0] : data;
  console.log("Inserted row:\n", JSON.stringify(inserted, null, 2));

  const verify = await fetch(
    `${url}/rest/v1/employer_jobs?slug=eq.${encodeURIComponent(SLUG)}&status=eq.live&select=id,slug,title,status,published_at`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" } },
  );
  const vrows = await verify.json();
  if (!verify.ok || !Array.isArray(vrows) || vrows.length === 0) {
    throw new Error(`Verify failed: ${JSON.stringify(vrows)}`);
  }
  console.log("\nVerified live row:", JSON.stringify(vrows[0], null, 2));
  console.log("\nPublic job URL path: /jobs/" + SLUG);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
