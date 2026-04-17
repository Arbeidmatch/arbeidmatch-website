"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  {
    question: "Do you have the legal right to live and work in an EU/EEA country?",
    options: ["Yes", "No"],
  },
  {
    question: "Do you have more than 2 years of experience in your field?",
    options: ["Yes, more than 2 years", "No, 2 years or less"],
  },
  {
    question: "What is your English level?",
    options: ["I do not speak English", "Work-related", "Conversational", "Fluent"],
  },
];

export default function ScorePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const progress = ((currentStep + 1) / steps.length) * 100;

  const result = useMemo(() => {
    if (answers.length < steps.length) return null;
    const strongProfile =
      answers[0] === "Yes" &&
      answers[1] === "Yes, more than 2 years" &&
      answers[2] !== "I do not speak English";
    return strongProfile ? "good" : "weak";
  }, [answers]);

  const handleAnswer = (value: string) => {
    const updated = [...answers];
    updated[currentStep] = value;
    setAnswers(updated);

    if (currentStep === 0 && value === "No") {
      router.push("/outside-eu-eea");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep(steps.length);
    }
  };

  const disqualified =
    answers[0] === "No" ||
    answers[1] === "No, 2 years or less" ||
    answers[2] === "I do not speak English";

  const submitFeedback = async () => {
    if (feedbackScore === null || feedbackStatus === "sending") return;
    setFeedbackStatus("sending");
    try {
      const response = await fetch("/api/confirmation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "candidate-eligibility-check",
          purpose: "Candidate feedback on the Work Readiness Check",
          pageUrl: "/score",
          score: feedbackScore,
          note: feedbackNote.trim(),
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      setFeedbackStatus("sent");
      setTimeout(() => {
        window.location.href = "https://jobs.arbeidmatch.no";
      }, 3000);
    } catch {
      setFeedbackStatus("error");
    }
  };

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-white p-8">
        <h1 className="text-3xl font-bold text-navy">Work Readiness Check</h1>
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div className="h-full bg-gold transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>

        {currentStep < steps.length ? (
          <div className="mt-8">
            <p className="text-lg font-medium text-navy">{steps[currentStep].question}</p>
            <div className="mt-5 space-y-3">
              {steps[currentStep].options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="block w-full rounded-md border border-border px-4 py-3 text-left text-navy hover:border-gold"
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="mt-5 rounded-md border border-navy px-4 py-2 text-sm font-medium text-navy disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-xl bg-surface p-6">
            {disqualified ? (
              <>
                <h2 className="text-2xl font-bold text-navy">You may not qualify yet</h2>
                <p className="mt-3 text-text-secondary">
                  At the moment, your profile may not be the right match yet. You are welcome to
                  try again after improving your situation.
                </p>
              </>
            ) : result === "good" ? (
              <>
                <h2 className="text-2xl font-bold text-navy">Great, you can continue to the next step</h2>
                <p className="mt-3 text-text-secondary">
                  Based on your answers, you can move forward and explore available opportunities.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-navy">You may not qualify yet</h2>
                <p className="mt-3 text-text-secondary">
                  You are not quite there yet, but you can come back and try again once your
                  situation improves.
                </p>
              </>
            )}
            {!disqualified && (
              <>
                <div className="mt-6 rounded-lg border border-border bg-white p-4 text-left">
                  <p className="text-sm font-semibold text-navy">How was your experience with this check?</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Please rate it from 1 to 10 and share what we can improve. This feedback is anonymous.
                  </p>
                  <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => {
                          setFeedbackScore(score);
                          if (feedbackStatus !== "idle") setFeedbackStatus("idle");
                        }}
                        className={`rounded-md border px-2 py-2 text-sm font-medium ${
                          feedbackScore === score
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-border text-navy hover:border-green-400"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="What could we improve? (optional)"
                    value={feedbackNote}
                    onChange={(event) => {
                      setFeedbackNote(event.target.value);
                      if (feedbackStatus !== "idle") setFeedbackStatus("idle");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void submitFeedback()}
                    disabled={
                      feedbackScore === null ||
                      feedbackStatus === "sending" ||
                      feedbackStatus === "sent"
                    }
                    className="mt-3 rounded-md bg-[#0D1B2A] px-4 py-2 text-sm font-medium text-white hover:bg-[#122845] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {feedbackStatus === "sending"
                      ? "Sending feedback..."
                      : feedbackStatus === "sent"
                        ? "Feedback sent"
                        : "Send feedback"}
                  </button>
                  {feedbackStatus === "error" && (
                    <p className="mt-2 text-xs text-red-600">
                      We could not send your feedback right now. Please try again.
                    </p>
                  )}
                  {feedbackStatus === "sent" && (
                    <p className="mt-2 text-xs text-green-700">
                      Thank you! Your feedback was received. You can now choose the job you want to apply for.
                      Redirecting to job listings in 3 seconds...
                    </p>
                  )}
                </div>
                {feedbackStatus !== "sent" ? (
                  <p className="mt-4 text-sm text-text-secondary">
                    Send your feedback to continue to available job listings.
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
