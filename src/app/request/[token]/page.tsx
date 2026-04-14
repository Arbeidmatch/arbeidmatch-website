"use client";

import { FormEvent, useState, useEffect } from "react";
import { useParams } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function DetailedRequestPage() {
  const params = useParams();
  const token = params.token as string;

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/verify-token?token=${token}`);
        const data = await response.json();
        setTokenStatus(data.valid ? "valid" : "invalid");
      } catch {
        setTokenStatus("invalid");
      }
    };

    if (token) verifyToken();
    else setTokenStatus("invalid");
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      token,
    };

    try {
      const response = await fetch("/api/simple-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Webhook request failed");

      setStatus("success");
      form.reset();
      await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" });
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenStatus === "checking") {
    return (
      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <p className="text-text-secondary">Verifying your access...</p>
        </div>
      </section>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <h1 className="text-3xl font-bold text-navy">Link expired or invalid</h1>
          <p className="mt-4 text-text-secondary">
            This link has expired or is no longer valid. Please{" "}
            <a href="/request" className="font-semibold text-gold">
              start a new request →
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-navy">Candidate Request — Details</h1>
        <p className="mt-3 text-text-secondary">For Norwegian employers only.</p>

        <div className="mb-8 mt-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 rounded-xl border border-border bg-white p-8">
          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Contact Information</legend>
            <div className="grid gap-5 md:grid-cols-2">
              <label>Contact person* <input required name="contactPerson" className={inputClass} /></label>
              <label>Company name* <input required name="company" className={inputClass} /></label>
              <label>VAT number (MVA)* <input required name="vatNumber" className={inputClass} /></label>
              <label>Phone* <input required name="phone" className={inputClass} /></label>
              <label>Company email* <input required type="email" name="email" className={inputClass} /></label>
              <label>Invoice email* <input required type="email" name="invoiceEmail" className={inputClass} /></label>
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Position Details</legend>
            <label className="block">Hiring type* <div className="mt-2 grid gap-2 md:grid-cols-2">{["Candidate delivery","Recruitment","Staffing","Job posting"].map((v) => <label key={v}><input required type="radio" name="hiringType" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label>Position/trade* <select required name="position" className={inputClass}>{["Carpenter","Tile layer","Painter","Concrete worker","Cleaner","Electrician","Mechanic","Forklift operator","Warehouse worker","Other"].map((v)=><option key={v}>{v}</option>)}</select></label>
            <label className="block">Qualification* <div className="mt-2 grid gap-2 md:grid-cols-2">{["General workers","Experienced (no certificate)","Qualified with foreign certificate","With DSB approval"].map((v) => <label key={v}><input required type="radio" name="qualification" value={v} className="mr-2" />{v}</label>)}</div></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label>Number of positions* <input required name="numberOfPositions" className={inputClass} /></label>
              <label>Min. experience (years)* <input required name="experience" className={inputClass} /></label>
            </div>
            <label>Job description* <textarea required name="jobDescription" rows={4} className={inputClass} /></label>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Requirements</legend>
            <label className="block">Driver&apos;s license* <div className="mt-2 grid gap-2 md:grid-cols-3">{["No","B","B+","E","C","Other"].map((v) => <label key={v}><input required type="radio" name="driverLicense" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label className="block">English level* <div className="mt-2 grid gap-2 md:grid-cols-3">{["Basic","Working level","Fluent"].map((v) => <label key={v}><input required type="radio" name="englishLevel" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label>Hard requirements (deal breakers) <textarea name="requirements" rows={3} className={inputClass} /></label>
            <label className="block">D-number required* <div className="mt-2 grid gap-2 md:grid-cols-3">{["No (company can help)","Yes","Other"].map((v) => <label key={v}><input required type="radio" name="dNumber" value={v} className="mr-2" />{v}</label>)}</div></label>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Contract & Conditions</legend>
            <label className="block">Contract type* <div className="mt-2 grid gap-2 md:grid-cols-2">{["Permanent","Staffing","Self-employed","Other"].map((v) => <label key={v}><input required type="radio" name="contractType" value={v} className="mr-2" />{v}</label>)}</div></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label>Full-time %* <input required name="fullTime" className={inputClass} /></label>
              <label>Hours per day/week* <input required name="hours" className={inputClass} /></label>
              <label>Starting salary NOK/hour* <input required name="salary" className={inputClass} /></label>
              <label>Accommodation cost/month* (0 if free) <input required name="accommodationCost" className={inputClass} /></label>
            </div>
            <label className="block">Rotation* <div className="mt-2 grid gap-2 md:grid-cols-2">{["None","4 weeks on 2 off","6 weeks on 2 off","Other"].map((v) => <label key={v}><input required type="radio" name="rotation" value={v} className="mr-2" />{v}</label>)}</div></label>
            {[
              ["overtime", "Overtime expected?*", ["Yes", "No", "Other"]],
              ["travel", "Travel covered?*", ["Yes", "No", "Other"]],
              ["accommodation", "Accommodation*", ["Free", "Not included", "We help find", "Other"]],
              ["equipment", "Work equipment provided?*", ["Yes", "No"]],
              ["tools", "Tools provided?*", ["Yes", "No", "Not required"]],
            ].map(([name, label, options]) => (
              <label key={name as string} className="block">
                {label as string}
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {(options as string[]).map((v) => (
                    <label key={v}>
                      <input required type="radio" name={name as string} value={v} className="mr-2" />
                      {v}
                    </label>
                  ))}
                </div>
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Timeline</legend>
            <label>City/location* <input required name="city" className={inputClass} /></label>
            <label>Additional notes <textarea name="notes" rows={3} className={inputClass} /></label>
            <label className="block">How soon?* <div className="mt-2 grid gap-2 md:grid-cols-2">{["ASAP","1-2 weeks","1 month","Flexible","Other"].map((v) => <label key={v}><input required type="radio" name="startDate" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label className="block">Subscribe to candidate updates?* <div className="mt-2 grid gap-2 md:grid-cols-2">{["Yes","No"].map((v) => <label key={v}><input required type="radio" name="subscribe" value={v} className="mr-2" />{v}</label>)}</div></label>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-gold py-4 text-lg font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending..." : "Send request"}
          </button>

          {status === "success" && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              Thank you! We&apos;ll contact you within 24 hours.
            </div>
          )}
          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              Something went wrong. Please email post@arbeidmatch.no
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
