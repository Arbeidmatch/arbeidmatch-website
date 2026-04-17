"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [siteRelated, setSiteRelated] = useState<"Yes" | "No" | "">("");
  const [issueCategory, setIssueCategory] = useState("");
  const [issueDetails, setIssueDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const needsFollowupQuestions = rating > 0 && rating <= 4;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 1 || rating > 10) {
      setErrorMessage("Please choose a rating between 1 and 10.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (needsFollowupQuestions && !siteRelated) {
      setErrorMessage("Please tell us if your feedback is related to the website.");
      return;
    }
    if (needsFollowupQuestions && !issueCategory) {
      setErrorMessage("Please select what your feedback is mainly about.");
      return;
    }

    setErrorMessage("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/site-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          email: email.trim(),
          note: note.trim(),
          siteRelated,
          issueCategory,
          issueDetails: issueDetails.trim(),
          source: "site-feedback-page",
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Failed to send feedback");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="bg-surface py-10">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-xl bg-white p-6 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl font-bold text-white">
              ✓
            </div>
            <h1 className="mt-4 text-3xl font-bold text-navy">Feedback sent successfully!</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Thank you for your feedback. We also sent a confirmation email to you.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-12">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="rounded-xl border border-border bg-white p-6 shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <h1 className="text-3xl font-bold text-navy">Share your feedback</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your feedback helps us improve the experience for employers and candidates.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-navy">How would you rate your experience?*</p>
              <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRating(score)}
                    className={`rounded-md border px-2 py-2 text-sm font-medium ${
                      rating === score
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-border text-navy hover:border-green-400"
                    }`}
                    aria-label={`Rate ${score} out of 10`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm text-navy">
              Email*
              <input
                required
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block text-sm text-navy">
              What can we improve? (optional)
              <textarea
                rows={4}
                className={`${inputClass} min-h-[120px]`}
                placeholder="Tell us what we can improve to make your experience better..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            {needsFollowupQuestions && (
              <div className="space-y-3 rounded-md border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-navy">
                  We are sorry this experience was not great. Help us understand better:
                </p>

                <div>
                  <p className="text-sm font-medium text-navy">Is this related to the website?*</p>
                  <div className="mt-2 flex gap-2">
                    {(["Yes", "No"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSiteRelated(value)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium ${
                          siteRelated === value
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-border text-navy hover:border-green-400"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm text-navy">
                  What is this mainly about?*
                  <select
                    className={inputClass}
                    value={issueCategory}
                    onChange={(event) => setIssueCategory(event.target.value)}
                  >
                    <option value="">Select a category</option>
                    <option>Website usability</option>
                    <option>Technical issue</option>
                    <option>Form or submission flow</option>
                    <option>Job information</option>
                    <option>Communication and support</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="block text-sm text-navy">
                  Tell us what happened (optional)
                  <textarea
                    rows={3}
                    className={`${inputClass} min-h-[90px]`}
                    placeholder="Add details so we can investigate and improve faster..."
                    value={issueDetails}
                    onChange={(event) => setIssueDetails(event.target.value)}
                  />
                </label>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {status === "error" && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-md bg-[#0D1B2A] py-3 font-medium text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? "Sending..." : "Send feedback"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
