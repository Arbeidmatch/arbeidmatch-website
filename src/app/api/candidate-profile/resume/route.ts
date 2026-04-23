import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { isRateLimited } from "@/lib/requestProtection";
import { logApiError } from "@/lib/secureLogger";
import { notifyError } from "@/lib/errorNotifier";

const tokenSchema = z.string().uuid();
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const cvExtractSchema = z.object({
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  nationality: z.string().nullable(),
  current_location: z.string().nullable(),
  job_categories: z.array(z.string()).nullable(),
  years_experience: z.union([z.string(), z.number()]).nullable(),
  skills: z.array(z.string()).nullable(),
  languages: z
    .array(
      z.object({
        language: z.string(),
        level: z.string().nullable().optional(),
      }),
    )
    .nullable(),
  education: z.array(z.string()).nullable(),
  certifications: z.array(z.string()).nullable(),
  driving_license: z.array(z.string()).nullable(),
});

type CvExtractResponse = z.infer<typeof cvExtractSchema>;

function getExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function normalizeArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

function safeJsonParse(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try to salvage JSON returned inside markdown fences.
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!fenced?.[1]) throw new Error("Invalid JSON response from Claude.");
    return JSON.parse(fenced[1].trim());
  }
}

async function extractTextFromCv(file: File, extension: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text?.trim() ?? "";
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "doc" || extension === "docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value?.trim() ?? "";
  }

  return "";
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile-resume", 40, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const raw = (request.nextUrl.searchParams.get("token") || "").trim();
    const tokenParsed = tokenSchema.safeParse(raw);
    if (!tokenParsed.success) {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const res = await supabase
      .from("candidates")
      .select("email,first_name,profile_draft,profile_completion_step,profile_token,token_expires_at")
      .eq("profile_token", tokenParsed.data)
      .maybeSingle();

    if (res.error) {
      logApiError("/api/candidate-profile/resume", res.error);
      return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
    }

    if (!res.data) {
      return NextResponse.json({ error: "Link is invalid or expired." }, { status: 404 });
    }

    const expires = res.data.token_expires_at ? new Date(res.data.token_expires_at).getTime() : 0;
    if (!expires || expires < Date.now()) {
      return NextResponse.json({ error: "Link is invalid or expired." }, { status: 410 });
    }

    const draft = res.data.profile_draft && typeof res.data.profile_draft === "object" ? (res.data.profile_draft as Record<string, unknown>) : {};

    return NextResponse.json({
      email: res.data.email,
      firstName: res.data.first_name,
      profile_completion_step: res.data.profile_completion_step ?? 0,
      draft,
    });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile/resume", error });
    logApiError("/api/candidate-profile/resume", error);
    return NextResponse.json({ error: "Failed to validate link." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile-resume-upload", 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const formData = await request.formData();
    const maybeFile = formData.get("file");
    if (!(maybeFile instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const extension = getExtension(maybeFile.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "Invalid file format. Allowed: PDF, DOC, DOCX." }, { status: 400 });
    }

    if (maybeFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum allowed size is 5MB." }, { status: 400 });
    }

    const cvText = await extractTextFromCv(maybeFile, extension);
    if (!cvText || cvText.length < 20) {
      return NextResponse.json({ error: "Could not extract readable text from this file." }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: "Claude API key is missing on server." }, { status: 500 });
    }

    const prompt =
      "Extract the following fields from this CV in JSON format only, no other text: full_name, email, phone, nationality, current_location, job_categories (array), years_experience, skills (array), languages (array with level), education (array), certifications (array), driving_license (array of categories). If a field is not found return null.";

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nCV CONTENT:\n${cvText}`,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      logApiError("/api/candidate-profile/resume", { stage: "claude", status: anthropicResponse.status, errText });
      return NextResponse.json({ error: "Claude API error while processing CV." }, { status: 502 });
    }

    const anthropicJson = (await anthropicResponse.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const textBlock = anthropicJson.content?.find((item) => item?.type === "text" && typeof item.text === "string");
    if (!textBlock?.text) {
      return NextResponse.json({ error: "Claude API returned an empty response." }, { status: 502 });
    }

    const parsed = safeJsonParse(textBlock.text);
    const cvParsed = cvExtractSchema.safeParse(parsed);
    if (!cvParsed.success) {
      logApiError("/api/candidate-profile/resume", { stage: "parse-json", issues: cvParsed.error.issues });
      return NextResponse.json({ error: "Claude response could not be parsed as expected JSON." }, { status: 502 });
    }

    const normalized: CvExtractResponse = {
      ...cvParsed.data,
      job_categories: normalizeArray(cvParsed.data.job_categories),
      skills: normalizeArray(cvParsed.data.skills),
      education: normalizeArray(cvParsed.data.education),
      certifications: normalizeArray(cvParsed.data.certifications),
      driving_license: normalizeArray(cvParsed.data.driving_license),
      years_experience: cvParsed.data.years_experience ?? null,
      full_name: cvParsed.data.full_name?.trim() || null,
      email: cvParsed.data.email?.trim() || null,
      phone: cvParsed.data.phone?.trim() || null,
      nationality: cvParsed.data.nationality?.trim() || null,
      current_location: cvParsed.data.current_location?.trim() || null,
      languages:
        cvParsed.data.languages?.length
          ? cvParsed.data.languages.map((item) => ({
              language: item.language.trim(),
              level: item.level?.trim() || null,
            }))
          : null,
    };

    return NextResponse.json({
      extracted: normalized,
      file: { name: maybeFile.name, size: maybeFile.size, type: maybeFile.type || null },
    });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile/resume", error });
    logApiError("/api/candidate-profile/resume", error);
    return NextResponse.json({ error: "Failed to process CV upload." }, { status: 500 });
  }
}
