"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

function inputClasses(hasError: boolean): string {
  return [
    "w-full rounded-xl border bg-[#0A1624] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition",
    hasError
      ? "border-red-400/80 focus:border-red-300"
      : "border-white/15 focus:border-[#C9A84C]/60",
  ].join(" ");
}

export default function ContactPage() {
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<SubjectOption | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

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
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">How can we help?</h1>
          <p className="mt-3 text-sm text-white/70 md:text-base">
            Send us your question and we will reply as soon as possible.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-white/80">
              Name
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`${inputClasses(Boolean(errors.name))} mt-1.5`}
                placeholder="Your full name"
              />
              {errors.name ? <span className="mt-1 block text-xs text-red-300">{errors.name}</span> : null}
            </label>

            <label className="text-sm text-white/80">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`${inputClasses(Boolean(errors.email))} mt-1.5`}
                placeholder="name@example.com"
              />
              {errors.email ? <span className="mt-1 block text-xs text-red-300">{errors.email}</span> : null}
            </label>
          </div>

          <label className="mt-4 block text-sm text-white/80">
            Subject
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value as SubjectOption);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
              }}
              className={`${inputClasses(Boolean(errors.subject))} mt-1.5`}
            >
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.subject ? <span className="mt-1 block text-xs text-red-300">{errors.subject}</span> : null}
          </label>

          <label className="mt-4 block text-sm text-white/80">
            Message
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              rows={7}
              className={`${inputClasses(Boolean(errors.message))} mt-1.5 min-h-[150px]`}
              placeholder="Describe your request in as much detail as possible."
            />
            {errors.message ? <span className="mt-1 block text-xs text-red-300">{errors.message}</span> : null}
          </label>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-6 inline-flex rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0D1B2A] disabled:opacity-60"
          >
            {status === "submitting" ? "Sending..." : "Send message"}
          </button>

          {status !== "idle" && statusMessage ? (
            <p className={`mt-4 text-sm ${status === "success" ? "text-[#C9A84C]" : "text-red-300"}`}>{statusMessage}</p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
