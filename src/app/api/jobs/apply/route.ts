import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyError } from "@/lib/errorNotifier";
import { createSmtpTransporter, PROFILE_TRANSACTIONAL_FROM } from "@/lib/candidates/smtpShared";
import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { buildEmail } from "@/lib/emailTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { jobApplicationSchema } from "@/lib/jobs/application";
import { getJobBySlug, getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { isRateLimited } from "@/lib/requestProtection";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { logApiError } from "@/lib/secureLogger";
import { candidateProfilePayloadSchema } from "@/lib/candidates/profileSchema";
import { computeJobMatchScore } from "@/lib/candidates/jobMatchScore";
import { notifyError as notifySlackError } from "@/lib/slack/notify";
import { computeEmployerBoardMatch, employerBoardMeetsThreshold } from "@/lib/employer-flow/employerBoardMatch";
import {
  sendCandidateApplicationReceivedEmail,
  sendEmployerNewCandidateEmail,
} from "@/lib/employer-flow/employerJobEmails";

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
  behavioralStory: z.string().trim().min(30).max(1200),
  behavioralSafety: z.string().trim().min(30).max(1200),
  gdprConsent: z.literal("true"),
  profileJson: z.string().trim().optional(),
});

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  const report500 = async (context: string, err: unknown) => {
    await notifySlackError(err instanceof Error ? `${err.message}\n${err.stack || ""}` : String(err), context, "critical");
  };
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
      behavioralStory: formData.get("behavioralStory"),
      behavioralSafety: formData.get("behavioralSafety"),
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
      await report500("/api/jobs/apply supabase_missing", "Supabase is not configured.");
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const emailKey = parsedPayload.data.email.trim().toLowerCase();
    const profileRow = await supabase
      .from("candidates")
      .select("id,can_apply,share_with_employers,profile_completion_step,profile_completed_at,profile_score")
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
      await report500("/api/jobs/apply candidate_lookup", profileRow.error.message || "Candidate lookup failed");
      return NextResponse.json({ error: "Could not verify candidate profile." }, { status: 500 });
    }

    if (!missingCandidatesTable) {
      if (!profileRow.data) {
        return NextResponse.json({ error: "Complete your candidate profile before applying.", profileScore: 0 }, { status: 403 });
      }
      const profileScore = Number(profileRow.data.profile_score ?? 0);
      const normalizedProfileScore = Number.isFinite(profileScore) ? profileScore : 0;
      if (normalizedProfileScore < 60) {
        return NextResponse.json({ error: "Complete your candidate profile before applying.", profileScore: normalizedProfileScore }, { status: 403 });
      }
      if (!profileRow.data.can_apply) {
        return NextResponse.json({ error: "Complete your candidate profile before applying.", profileScore: normalizedProfileScore }, { status: 403 });
      }
      if (!profileRow.data.share_with_employers) {
        return NextResponse.json(
          { error: "Your profile is set to browse-only. Update sharing consent to apply.", profileScore: normalizedProfileScore },
          { status: 403 },
        );
      }
    }

    let matchScore: number | null = null;
    let matchSummary: string | null = null;
    let profileSnapshot: unknown | null = null;
    let employerInbox: string | null = null;

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

    if (job.source === "employer_board" && job.employerBoardMeta) {
      const boardMatch = computeEmployerBoardMatch(job.employerBoardMeta, parsedProfile.data);
      matchScore = Math.round(boardMatch.percent);
      matchSummary = boardMatch.breakdown.slice(0, 4).join(" ");
      if (!employerBoardMeetsThreshold(boardMatch)) {
        return NextResponse.json(
          {
            error: "This job may not be the right fit for you",
            matchScore,
            matchSummary,
          },
          { status: 422 },
        );
      }
      if (job.employerJobId) {
        const er = await supabase.from("employer_jobs").select("employer_email").eq("id", job.employerJobId).maybeSingle();
        if (!er.error && er.data?.employer_email) {
          employerInbox = String(er.data.employer_email).trim().toLowerCase();
        }
      }
    } else {
      const match = computeJobMatchScore(job, parsedProfile.data);
      matchScore = match.score;
      matchSummary = match.reasons.slice(0, 3).join(" ");
      if (match.score < 70) {
        return NextResponse.json(
          {
            error: "This job may not be the right fit for you",
            matchScore: match.score,
            matchSummary,
          },
          { status: 422 },
        );
      }
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
      await report500("/api/jobs/apply upload", uploadRes.error.message || "CV upload failed");
      return NextResponse.json(
        { error: "CV upload failed. Please contact support if this continues." },
        { status: 500 },
      );
    }

    const employerAccessToken = randomUUID();
    const employerAccessExpiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const behavioralAnswers = {
      deliveryUnderPressure: validatedClientSchema.data.behavioralStory,
      safetyOnSite: validatedClientSchema.data.behavioralSafety,
    };

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
      behavioral_answers: behavioralAnswers,
      employer_access_token: employerAccessToken,
      employer_access_expires_at: employerAccessExpiresAt,
    }).select("id");

    if (insertRes.error) {
      await supabase.storage.from(bucket).remove([filePath]);
      logApiError("/api/jobs/apply insert", insertRes.error);
      await report500("/api/jobs/apply insert", insertRes.error.message || "Application insert failed");
      return NextResponse.json(
        {
          error: "Application could not be saved.",
          hint: "Create table job_applications in Supabase and retry.",
        },
        { status: 500 },
      );
    }

    const newApplicationId =
      Array.isArray(insertRes.data) && insertRes.data[0] && typeof insertRes.data[0].id === "string"
        ? insertRes.data[0].id
        : null;

    if (newApplicationId) {
      void logAuditEvent("job_application_submitted", "application", newApplicationId, "candidate", {
        jobSlug: job.slug,
        jobSource: job.source,
        matchScore,
      });
    }

    try {
      const transport = createSmtpTransporter();
      const origin = getSiteOrigin();
      const candidateDisplayName = `${parsedPayload.data.firstName} ${parsedPayload.data.lastName}`.trim();
      const internalAtsUrl = `${origin}/employer/candidates/${newApplicationId}?token=${employerAccessToken}`;

      await sendCandidateApplicationReceivedEmail({
        to: parsedPayload.data.email.trim(),
        jobTitle: job.title,
        jobLocation: job.location,
        nextStepNote: "Next step: we review your application with the employer. If shortlisted, we will contact you by email or phone.",
      });
      void logAuditEvent("email_sent_candidate_application_received", "email", newApplicationId, "system", {
        template: "candidate_application_received",
        jobSlug: job.slug,
      });
      if (transport && newApplicationId) {
        const internalHtml = buildEmail({
          title: "New job application received",
          preheader: "A candidate submitted a new application.",
          body: `
            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
              <strong>${candidateDisplayName}</strong> applied for <strong>${job.title}</strong>.
            </p>
            <p style="margin:0 0 10px 0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.74);">
              Candidate email: ${parsedPayload.data.email}<br/>
              Phone: ${parsedPayload.data.phone}<br/>
              Trade: ${parsedPayload.data.trade}<br/>
              Experience: ${parsedPayload.data.yearsExperience}
            </p>
          `,
          ctaText: "Open candidate profile in ATS",
          ctaUrl: internalAtsUrl,
        });
        await safeSendEmail("post@arbeidmatch.no", `New candidate application – ${job.title}`, internalHtml, {
          from: PROFILE_TRANSACTIONAL_FROM,
          text: `New candidate application for ${job.title}\nCandidate: ${candidateDisplayName}\nEmail: ${parsedPayload.data.email}\nATS link: ${internalAtsUrl}`,
          ipAddress: request.headers.get("x-forwarded-for") || undefined,
          transporter: transport,
        });
        void logAuditEvent("email_sent_internal_application_notification", "email", newApplicationId, "system", {
          template: "internal_application_notification",
          jobSlug: job.slug,
        });
      }
      if (employerInbox && newApplicationId && employerAccessToken && job.source === "employer_board") {
        await sendEmployerNewCandidateEmail({
          to: employerInbox,
          applicationId: newApplicationId,
          token: employerAccessToken,
          jobTitle: job.title,
        });
        void logAuditEvent("email_sent_employer_new_candidate", "email", newApplicationId, "system", {
          template: "employer_new_candidate",
          jobSlug: job.slug,
        });
      }
    } catch (mailErr) {
      logApiError("/api/jobs/apply notify", mailErr, { jobSlug: job.slug });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/jobs/apply", error });
    await report500("/api/jobs/apply", error);
    logApiError("/api/jobs/apply", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}
