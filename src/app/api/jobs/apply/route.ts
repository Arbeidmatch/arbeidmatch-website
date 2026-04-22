import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyError } from "@/lib/errorNotifier";
import { jobApplicationSchema } from "@/lib/jobs/application";
import { getJobBySlug, getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { isRateLimited } from "@/lib/requestProtection";
import { logApiError } from "@/lib/secureLogger";
import { candidateProfilePayloadSchema } from "@/lib/candidates/profileSchema";
import { computeJobMatchScore } from "@/lib/candidates/jobMatchScore";

const payloadSchema = z.object({
  jobSlug: z.string().trim().min(2),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  currentCountry: z.string().trim().min(2),
  city: z.string().trim().min(2),
  workAuthorization: z.string().trim().min(2),
  yearsExperience: z.string().trim().min(1),
  trade: z.string().trim().min(2),
  englishLevel: z.string().trim().min(1),
  norwegianLevel: z.string().trim().min(1),
  drivingLicence: z.string().trim().min(1),
  availability: z.string().trim().min(1),
  message: z.string().trim().optional(),
  gdprConsent: z.literal("true"),
  profileJson: z.string().trim().optional(),
});

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "jobs-apply", 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const formData = await request.formData();
    const cvFile = formData.get("cvFile");

    if (!(cvFile instanceof File)) {
      return NextResponse.json({ error: "CV file is required." }, { status: 400 });
    }

    const parsedPayload = payloadSchema.safeParse({
      jobSlug: formData.get("jobSlug"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      currentCountry: formData.get("currentCountry"),
      city: formData.get("city"),
      workAuthorization: formData.get("workAuthorization"),
      yearsExperience: formData.get("yearsExperience"),
      trade: formData.get("trade"),
      englishLevel: formData.get("englishLevel"),
      norwegianLevel: formData.get("norwegianLevel"),
      drivingLicence: formData.get("drivingLicence"),
      availability: formData.get("availability"),
      message: formData.get("message") || undefined,
      gdprConsent: formData.get("gdprConsent"),
      profileJson: (formData.get("profileJson") as string | null) || undefined,
    });

    if (!parsedPayload.success) {
      return NextResponse.json({ error: "Invalid application data.", details: parsedPayload.error.flatten() }, { status: 400 });
    }

    const validatedClientSchema = jobApplicationSchema.safeParse({
      ...parsedPayload.data,
      gdprConsent: true,
      cvFile,
    });

    if (!validatedClientSchema.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: validatedClientSchema.error.flatten() },
        { status: 400 },
      );
    }

    const job = await getJobBySlug(parsedPayload.data.jobSlug);
    if (!job || job.status !== "active") {
      return NextResponse.json({ error: "This job is no longer active." }, { status: 404 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const emailKey = parsedPayload.data.email.trim().toLowerCase();
    const profileRow = await supabase
      .from("candidates")
      .select("can_apply,share_with_employers,profile_completion_step,profile_completed_at")
      .eq("email", emailKey)
      .maybeSingle();

    const message = profileRow.error?.message?.toLowerCase() ?? "";
    const missingCandidatesTable =
      !!profileRow.error &&
      (profileRow.error.code === "42P01" ||
        message.includes('relation "public.candidates" does not exist') ||
        message.includes("does not exist"));

    if (profileRow.error && !missingCandidatesTable) {
      logApiError("/api/jobs/apply candidate lookup", profileRow.error, { email: emailKey });
      return NextResponse.json({ error: "Could not verify candidate profile." }, { status: 500 });
    }

    if (!missingCandidatesTable) {
      if (!profileRow.data) {
        return NextResponse.json({ error: "Complete your candidate profile before applying." }, { status: 403 });
      }
      const completionStep =
        profileRow.data.profile_completion_step ??
        (profileRow.data.profile_completed_at ? 9 : 0);
      if (completionStep < 9) {
        return NextResponse.json(
          { error: "Complete your candidate profile (all 9 steps) before applying." },
          { status: 403 },
        );
      }
      if (!profileRow.data.can_apply) {
        return NextResponse.json({ error: "Complete your candidate profile before applying." }, { status: 403 });
      }
      if (!profileRow.data.share_with_employers) {
        return NextResponse.json(
          { error: "Your profile is set to browse-only. Update sharing consent to apply." },
          { status: 403 },
        );
      }
    }

    let matchScore: number | null = null;
    let matchSummary: string | null = null;
    let profileSnapshot: unknown | null = null;

    if (!parsedPayload.data.profileJson) {
      return NextResponse.json({ error: "Candidate profile snapshot is required to apply." }, { status: 400 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(parsedPayload.data.profileJson);
    } catch {
      return NextResponse.json({ error: "Invalid profile snapshot JSON." }, { status: 400 });
    }

    const parsedProfile = candidateProfilePayloadSchema.safeParse(parsedJson);
    if (!parsedProfile.success) {
      return NextResponse.json({ error: "Invalid profile snapshot." }, { status: 400 });
    }
    if (parsedProfile.data.email.trim().toLowerCase() !== emailKey) {
      return NextResponse.json({ error: "Profile email must match application email." }, { status: 400 });
    }

    profileSnapshot = parsedProfile.data;
    const match = computeJobMatchScore(job, parsedProfile.data);
    matchScore = match.score;
    matchSummary = match.reasons.slice(0, 3).join(" ");

    if (match.score < 70) {
      return NextResponse.json(
        {
          error: "Not ideal match, adjust your profile",
          matchScore: match.score,
          matchSummary,
        },
        { status: 422 },
      );
    }

    const bucket = process.env.SUPABASE_JOB_CV_BUCKET || "job-cvs";
    const filePath = `${job.slug}/${Date.now()}-${sanitizeFileName(cvFile.name)}`;
    const fileBuffer = Buffer.from(await cvFile.arrayBuffer());

    const uploadRes = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
      contentType: cvFile.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadRes.error) {
      logApiError("/api/jobs/apply upload", uploadRes.error, { bucket });
      return NextResponse.json(
        { error: "CV upload failed. Please contact support if this continues." },
        { status: 500 },
      );
    }

    const insertRes = await supabase.from("job_applications").insert({
      job_id: job.id,
      job_slug: job.slug,
      job_title: job.title,
      first_name: parsedPayload.data.firstName,
      last_name: parsedPayload.data.lastName,
      email: parsedPayload.data.email,
      phone: parsedPayload.data.phone,
      current_country: parsedPayload.data.currentCountry,
      city: parsedPayload.data.city,
      work_authorization: parsedPayload.data.workAuthorization,
      years_experience: parsedPayload.data.yearsExperience,
      trade: parsedPayload.data.trade,
      english_level: parsedPayload.data.englishLevel,
      norwegian_level: parsedPayload.data.norwegianLevel,
      driving_licence: parsedPayload.data.drivingLicence,
      availability: parsedPayload.data.availability,
      message: parsedPayload.data.message || null,
      gdpr_consent: true,
      cv_storage_bucket: bucket,
      cv_storage_path: filePath,
      cv_file_name: cvFile.name,
      cv_file_size: cvFile.size,
      status: "new",
      source: "job-board",
      submitted_at: new Date().toISOString(),
      match_score: matchScore,
      match_summary: matchSummary,
      profile_snapshot: profileSnapshot,
    });

    if (insertRes.error) {
      await supabase.storage.from(bucket).remove([filePath]);
      logApiError("/api/jobs/apply insert", insertRes.error);
      return NextResponse.json(
        {
          error: "Application could not be saved.",
          hint: "Create table job_applications in Supabase and retry.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/jobs/apply", error });
    logApiError("/api/jobs/apply", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}
