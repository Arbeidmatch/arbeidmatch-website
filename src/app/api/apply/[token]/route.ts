import { NextRequest, NextResponse } from "next/server";
import { atsBaseUrl } from "@/lib/jobs-fetch";

export const dynamic = "force-dynamic";

/**
 * The application, handed to the ATS by our server rather than by the browser.
 *
 * HIS INSTRUCTION, 3 September 2026: "omul aplica pe website si procesata
 * aplicatia in ats si tot procesul." And, the same afternoon: "eu nu vreau sa
 * expun ats ul ci websiteul vreau sa fie public."
 *
 * Both hold only if the browser never talks to ats.arbeidmatch.no. A form that
 * posts straight there puts the address in the network tab, in the CSP, and in
 * any error the browser shows, which is the thing he asked not to happen. So the
 * form posts here, on his own domain, and this passes it on from the server.
 *
 * IT FORWARDS RATHER THAN REIMPLEMENTS. Everything that decides whether an
 * application is accepted lives in the ATS and has to: the session token, the
 * consent rules, the duplicate and blocklist checks, the file gate that reads
 * the real bytes of a CV, the retention clock. A second copy of any of that here
 * would be a second thing to keep right, and the day they disagree is the day
 * somebody is accepted on this side and refused on the other.
 *
 * The multipart body is passed through whole, so the CV arrives as the file the
 * person chose and is checked by the same gate as every other way in.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const clean = String(token ?? "").trim();
  // A token is minted by the ATS and is opaque to us. This only refuses the
  // shapes that cannot be one, so a typed URL does not become an upstream call.
  if (!/^[A-Za-z0-9_-]{16,200}$/.test(clean)) {
    return NextResponse.json({ error: "That application link is not valid." }, { status: 400 });
  }

  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return NextResponse.json({ error: "We could not read that application." }, { status: 400 });
  }

  // The applicant's address, so the ATS rate limit and human check count the
  // person rather than this server. Forwarding X-Forwarded-For alone did not do
  // it: Vercel overwrites that header on the ATS side, so every applicant looked
  // like one visitor, five applications a minute for the whole site (found
  // 10 September 2026). The address travels in its own header, signed with the
  // secret the ATS already checks for our mail relay; without the secret the ATS
  // ignores it.
  const applicantIp =
    request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const secret = process.env.ATS_EMAIL_SECRET?.trim() ?? "";

  try {
    const upstream = await fetch(`${atsBaseUrl()}/api/public/apply/${encodeURIComponent(clean)}/submit`, {
      method: "POST",
      body,
      cache: "no-store",
      headers: {
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
        "x-real-ip": request.headers.get("x-real-ip") ?? "",
        ...(secret && applicantIp
          ? { "x-arbeidmatch-website-secret": secret, "x-arbeidmatch-applicant-ip": applicantIp }
          : {}),
      },
    });

    const text = await upstream.text();
    // The upstream message is written for the applicant and is passed through as
    // it is. Replacing it with a generic sentence would hide "that email has
    // already applied", which is the one thing they need to be told.
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "We could not send your application just now. Please try again shortly." },
      { status: 502 },
    );
  }
}
