"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import PremiumDropdown from "@/components/ui/premium/PremiumDropdown";
import PremiumInputField from "@/components/ui/premium/PremiumInputField";

type UserType = "employer" | "candidate" | null;
type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const EMPLOYER_SUBJECTS = ["Request candidates", "Partnership inquiry", "Technical issue", "Other"] as const;
const CANDIDATE_SUBJECTS = [
  "Profile help",
  "Job application question",
  "Document & certification help",
  "Technical issue",
  "Other",
] as const;
type SubjectOption = (typeof EMPLOYER_SUBJECTS)[number] | (typeof CANDIDATE_SUBJECTS)[number];
const NEUTRAL_SUBJECTS: SubjectOption[] = Array.from(new Set<SubjectOption>([...EMPLOYER_SUBJECTS, ...CANDIDATE_SUBJECTS]));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<SubjectOption | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("userType");
    if (stored === "employer" || stored === "candidate") {
      setUserType(stored);
    } else {
      setUserType(null);
    }
  }, []);

  const subjectOptions = useMemo(() => {
    if (userType === "employer") return [...EMPLOYER_SUBJECTS];
    if (userType === "candidate") return [...CANDIDATE_SUBJECTS];
    return NEUTRAL_SUBJECTS;
  }, [userType]);

  useEffect(() => {
    if (!subjectOptions.length) return;
    if (!subject || !subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0]);
    }
  }, [subject, subjectOptions]);

  function validateForm(): boolean {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) nextErrors.email = "Please enter a valid email.";
    if (!subject.trim()) nextErrors.subject = "Subject is required.";
    if (!message.trim()) nextErrors.message = "Message is required.";
    else if (message.trim().length < 50) nextErrors.message = "Message must be at least 50 characters.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    if (!validateForm()) {
      setStatus("error");
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          need: subject.trim(),
          message: message.trim(),
          company:
            userType === "employer"
              ? "Employer inquiry"
              : userType === "candidate"
                ? "Candidate inquiry"
                : "General inquiry",
          website: "",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setStatusMessage(data.error || "Could not send your message.");
        return;
      }
      setStatus("success");
      setStatusMessage("Message sent successfully. Our team will get back to you shortly.");
      setMessage("");
      startCountdown();
    } catch {
      setStatus("error");
      setStatusMessage("Could not send your message right now. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-4 py-10 text-white md:px-8 md:py-14">
      <div className="mx-auto w-full max-w-[900px]">
        <header className="rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-b from-[#0d1b2a] to-[#12243a] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">Contact ArbeidMatch</p>
          <h1 className="mt-3 text-balance break-words text-3xl font-semibold text-white md:text-4xl">How can we help?</h1>
          <p className="mt-3 text-sm text-white/70 md:text-base">
            Send us your question and we will reply as soon as possible.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <PremiumInputField
                label="Name"
                value={name}
                onChange={(next) => {
                  setName(next);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Your full name"
                className={errors.name ? "border-red-400/80 focus-within:border-red-300 focus-within:shadow-none" : ""}
              />
              {errors.name ? <span className="mt-1 block text-xs text-red-300">{errors.name}</span> : null}
            </div>

            <div>
              <PremiumInputField
                label="Email"
                type="email"
                value={email}
                onChange={(next) => {
                  setEmail(next);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@example.com"
                className={errors.email ? "border-red-400/80 focus-within:border-red-300 focus-within:shadow-none" : ""}
              />
              {errors.email ? <span className="mt-1 block text-xs text-red-300">{errors.email}</span> : null}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-sm text-white/80">Subject</p>
            <PremiumDropdown
              value={subject}
              onChange={(next) => {
                setSubject(next as SubjectOption);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
              }}
              options={subjectOptions.map((option) => ({ value: option, label: option }))}
            />
            {errors.subject ? <span className="mt-1 block text-xs text-red-300">{errors.subject}</span> : null}
          </div>

          <div className="mt-4">
            <PremiumInputField
              multiline
              rows={7}
              label="Message"
              value={message}
              onChange={(next) => {
                setMessage(next);
                if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Describe your request in as much detail as possible."
              className={`min-h-[150px] ${errors.message ? "border-red-400/80 focus-within:border-red-300 focus-within:shadow-none" : ""}`}
            />
            {errors.message ? <span className="mt-1 block text-xs text-red-300">{errors.message}</span> : null}
          </div>

          <button
            type="submit"
            disabled={status === "submitting" || !canResend}
            className={`mt-6 inline-flex w-full justify-center rounded-xl px-6 py-3 text-sm font-semibold sm:w-auto ${
              canResend ? "bg-[#C9A84C] text-[#0D1B2A]" : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            {status === "submitting" ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
          </button>

          {status !== "idle" && statusMessage ? (
            <p className={`mt-4 text-sm ${status === "success" ? "text-[#C9A84C]" : "text-red-300"}`}>{statusMessage}</p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
