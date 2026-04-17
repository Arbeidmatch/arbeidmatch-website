"use client";

import { useMemo, useState } from "react";

const steps = [
  {
    question: "Do you have the legal right to live and work in an EU/EEA country?",
    options: ["Yes", "No"],
  },
  {
    question: "What is your main trade or skill?",
    options: ["Carpenter", "Painter", "Tile layer", "Concrete worker", "Electrician", "Mechanic", "Logistics", "Cleaner", "Other"],
  },
  {
    question: "How many years of experience do you have?",
    options: ["Less than 1", "1-3 years", "3-5 years", "5+ years"],
  },
  {
    question: "What is your English level?",
    options: ["Basic", "Conversational", "Fluent"],
  },
  {
    question: "When can you start?",
    options: ["Immediately", "Within 1 month", "1-3 months", "3+ months"],
  },
  {
    question: "Do you have a valid driver's license?",
    options: ["Yes (B or higher)", "No"],
  },
];

export default function ScorePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const result = useMemo(() => {
    if (answers.length < steps.length) return null;
    const strongProfile =
      answers[0] === "Yes" &&
      answers[2] !== "Less than 1" &&
      answers[3] !== "Basic" &&
      answers[5] === "Yes (B or higher)";
    return strongProfile ? "good" : "weak";
  }, [answers]);

  const handleAnswer = (value: string) => {
    const updated = [...answers];
    updated[currentStep] = value;
    setAnswers(updated);

    if (currentStep === 0 && value === "No") {
      setCurrentStep(steps.length);
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep(steps.length);
    }
  };

  const disqualified = answers[0] === "No";

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
                  Right now, legal eligibility is required for our EU/EEA hiring pathways.
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
                  You can still apply to open roles and our team will review your profile.
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
