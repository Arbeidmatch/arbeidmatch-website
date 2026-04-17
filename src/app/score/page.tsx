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
      router.push("/eligibility-assistance");
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

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-white p-8">
        <h1 className="text-3xl font-bold text-navy">Eligibility Check</h1>
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
                <h2 className="text-2xl font-bold text-navy">Great, you likely qualify!</h2>
                <p className="mt-3 text-text-secondary">
                  Your profile matches common requirements for employers in Norway.
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
              <a
                href="https://jobs.arbeidmatch.no"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-md bg-gold px-6 py-3 font-medium text-white hover:bg-gold-hover"
              >
                {result === "good" ? "Browse open positions" : "Browse jobs anyway"}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
