import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";

const schema = z.object({
  email: z.string().trim().min(3),
});

const DEFAULT_PUBLIC_EMAIL_DOMAINS_BLOCKLIST = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "msn.com",
];

function getPublicEmailDomainsBlocklist(): Set<string> {
  const raw = process.env.PUBLIC_EMAIL_DOMAINS_BLOCKLIST;
  const normalized = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length > 0) {
    return new Set(normalized);
  }

  return new Set(DEFAULT_PUBLIC_EMAIL_DOMAINS_BLOCKLIST);
}

function normalizeDomain(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .split("/")[0]
    .split(":")[0];

  if (normalized.includes("@")) {
    return normalized.split("@").pop() ?? "";
  }

  return normalized;
}

function extractCandidateDomains(raw: string): string[] {
  return raw
    .split(/[,\s;|]+/g)
    .map((item) => normalizeDomain(item))
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const rawEmail = parsed.data.email.trim().toLowerCase();
    const normalizedInput = rawEmail.includes("@") ? rawEmail : `info@${rawEmail}`;
    const email = normalizedInput;
    const domain = normalizeDomain(normalizedInput.split("@")[1] ?? normalizedInput);
    const publicEmailDomainsBlocklist = getPublicEmailDomainsBlocklist();
    type PartnerRow = {
      id: string;
      company_name: string | null;
      domain: string | null;
      email: string | null;
      verification_status: string | null;
    };
    const findActivePartnerByDomain = async (
      normalizedDomain: string,
    ): Promise<{
      partner: { id: string; company_name: string | null } | null;
      pagesScanned: number;
      rowsScanned: number;
      capReached: boolean;
    }> => {
      const pageSize = 1000;
      const maxPages = 50;
      const maxRows = 50000;
      let lastSeenId: string | null = null;
      let pagesScanned = 0;
      let rowsScanned = 0;

      while (pagesScanned < maxPages && rowsScanned < maxRows) {
        let query = supabase
          .from("partners")
          .select("id, company_name, domain, email, verification_status")
          .eq("active", true)
          .or("verification_status.eq.verified,verification_status.is.null")
          .order("id", { ascending: true })
          .limit(pageSize);

        if (lastSeenId) {
          query = query.gt("id", lastSeenId);
        }

        const { data, error } = await query;
        if (error) {
          if (error.code === "PGRST116") {
            return { partner: null, pagesScanned, rowsScanned, capReached: false };
          }
          if (error.code === "42P01") throw error;
          throw error;
        }

        const rows = (data ?? []) as PartnerRow[];
        pagesScanned += 1;
        rowsScanned += rows.length;

        const partner =
          rows.find((row) => {
            const candidates = [
              ...extractCandidateDomains(String(row.domain ?? "")),
              ...extractCandidateDomains(String(row.email ?? "")),
            ];
            return candidates.includes(normalizedDomain);
          }) ?? null;

        if (partner) {
          return { partner, pagesScanned, rowsScanned, capReached: false };
        }
        if (rows.length === 0 || rows.length < pageSize) {
          return { partner: null, pagesScanned, rowsScanned, capReached: false };
        }

        lastSeenId = rows[rows.length - 1]?.id ?? null;
        if (!lastSeenId) {
          return { partner: null, pagesScanned, rowsScanned, capReached: false };
        }
      }

      return { partner: null, pagesScanned, rowsScanned, capReached: true };
    };

    if (!domain) return NextResponse.json({ verified: false });
    if (publicEmailDomainsBlocklist.has(domain)) {
      return NextResponse.json({ verified: false, reason: "personal_email" }, { status: 200 });
    }

    let partner: { id: string; company_name: string | null } | null = null;
    let pagesScanned = 0;
    try {
      const lookup = await findActivePartnerByDomain(domain);
      partner = lookup.partner;
      pagesScanned = lookup.pagesScanned;
      if (lookup.capReached) {
        await notifyError({
          route: "/api/verify-partner lookup",
          error: new Error("Partner lookup scan cap reached"),
          context: {
            normalizedDomain: domain,
            pagesScanned: lookup.pagesScanned,
            rowsScanned: lookup.rowsScanned,
            matched: false,
            reason: "scan_cap_reached",
          },
        });
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01") {
        await notifyError({
          route: "/api/verify-partner lookup",
          error,
          context: {
            normalizedDomain: domain,
            pagesScanned,
            matched: false,
            reason: "partners_table_missing",
          },
        });
        return NextResponse.json({ verified: false });
      }
      throw error;
    }

    if (!partner) {
      return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
    }

    const requestToken = crypto.randomUUID();
    const requestExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { error: requestTokenError } = await supabase.from("request_tokens").insert({
      token: requestToken,
      full_name: "Partner Contact",
      company: partner.company_name || domain,
      email,
      phone: "N/A",
      job_summary: "Partner candidate request",
      gdpr_consent: true,
      expires_at: requestExpiresAt,
      used: false,
    });
    if (requestTokenError) {
      throw requestTokenError;
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("partner_sessions").insert({
      email,
      session_token: sessionToken,
      request_token: requestToken,
      expires_at: expiresAt,
    });

    if (sessionError) {
      if (sessionError.code === "42P01") {
        return NextResponse.json({ verified: false });
      }
      throw sessionError;
    }

    const transporter = createSmtpTransporter();
    if (!transporter) return NextResponse.json({ verified: true });

    const secureUrl = `https://arbeidmatch.no/request/partner/${requestToken}`;
    const html = buildEmail({
      title: "Your secure access link is ready.",
      preheader: "Partner verification completed. Secure access link inside.",
      body: `
        <p style="margin:0 0 10px 0;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.12em;">YOU ARE VERIFIED AS A PARTNER</p>
        <p style="margin:0 0 16px 0;font-size:15px;color:rgba(255,255,255,0.8);line-height:1.7;">
          Click the button below to access candidate profiles. Your link is personal and valid for 30 minutes from the moment it was generated.
        </p>
        <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;margin:0;">
          This link is linked to your partner account. Do not share it with others. If you did not request this, contact post@arbeidmatch.no immediately.
        </p>
      `,
      ctaText: "Access Candidate Profiles",
      ctaUrl: secureUrl,
      audience: "b2b",
      unsubscribeEmail: email,
    });

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "Your ArbeidMatch secure access link",
      text: `Here is your secure link to access candidate profiles and submit requests: ${secureUrl}\n\nThis link is valid for 30 minutes and is linked to your partner account.`,
      html,
    });

    return NextResponse.json({ verified: true, company_name: partner.company_name });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST116"
    ) {
      return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
    }
    await notifyError({ route: "/api/verify-partner", error });
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
