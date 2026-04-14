"use client";

import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function RequestPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-navy">Request Candidates</h1>
        <p className="mt-3 text-text-secondary">For Norwegian employers only.</p>

        <div className="mb-8 mt-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>

        <form
          action="mailto:post@arbeidmatch.no"
          method="post"
          encType="text/plain"
          onSubmit={handleSubmit}
          className="space-y-10 rounded-xl border border-border bg-white p-8"
        >
          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Contact Information</legend>
            <div className="grid gap-5 md:grid-cols-2">
              <label>Contact person* <input required name="contactPerson" className={inputClass} /></label>
              <label>Company name* <input required name="companyName" className={inputClass} /></label>
              <label>VAT number (MVA)* <input required name="vatNumber" className={inputClass} /></label>
              <label>Phone* <input required name="phone" className={inputClass} /></label>
              <label>Company email* <input required type="email" name="companyEmail" className={inputClass} /></label>
              <label>Invoice email* <input required type="email" name="invoiceEmail" className={inputClass} /></label>
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Position Details</legend>
            <label className="block">Hiring type* <div className="mt-2 grid gap-2 md:grid-cols-2">{["Candidate delivery","Recruitment","Staffing","Job posting"].map((v) => <label key={v}><input required type="radio" name="hiringType" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label>Position/trade* <select required name="positionTrade" className={inputClass}>{["Carpenter","Tile layer","Painter","Concrete worker","Cleaner","Electrician","Mechanic","Forklift operator","Warehouse worker","Other"].map((v)=><option key={v}>{v}</option>)}</select></label>
            <label className="block">Qualification* <div className="mt-2 grid gap-2 md:grid-cols-2">{["General workers","Experienced (no certificate)","Qualified with foreign certificate","With DSB approval"].map((v) => <label key={v}><input required type="radio" name="qualification" value={v} className="mr-2" />{v}</label>)}</div></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label>Number of positions* <input required name="positions" className={inputClass} /></label>
              <label>Min. experience (years)* <input required name="minExperienceYears" className={inputClass} /></label>
            </div>
            <label>Job description* <textarea required name="jobDescription" rows={4} className={inputClass} /></label>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Requirements</legend>
            <label className="block">Driver&apos;s license* <div className="mt-2 grid gap-2 md:grid-cols-3">{["No","B","B+","E","C","Other"].map((v) => <label key={v}><input required type="radio" name="driversLicense" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label className="block">English level* <div className="mt-2 grid gap-2 md:grid-cols-3">{["Basic","Working level","Fluent"].map((v) => <label key={v}><input required type="radio" name="englishLevel" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label>Hard requirements (deal breakers) <textarea name="hardRequirements" rows={3} className={inputClass} /></label>
            <label className="block">D-number required* <div className="mt-2 grid gap-2 md:grid-cols-3">{["No (company can help)","Yes","Other"].map((v) => <label key={v}><input required type="radio" name="dNumberRequired" value={v} className="mr-2" />{v}</label>)}</div></label>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="mb-4 text-2xl font-semibold text-navy">Contract & Conditions</legend>
            <label className="block">Contract type* <div className="mt-2 grid gap-2 md:grid-cols-2">{["Permanent","Staffing","Self-employed","Other"].map((v) => <label key={v}><input required type="radio" name="contractType" value={v} className="mr-2" />{v}</label>)}</div></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label>Full-time %* <input required name="fullTime" className={inputClass} /></label>
              <label>Hours per day/week* <input required name="hoursPerDayWeek" className={inputClass} /></label>
              <label>Starting salary NOK/hour* <input required name="salaryNokHour" className={inputClass} /></label>
              <label>Accommodation cost/month* (0 if free) <input required name="accommodationCostMonth" className={inputClass} /></label>
            </div>
            <label className="block">Rotation* <div className="mt-2 grid gap-2 md:grid-cols-2">{["None","4 weeks on 2 off","6 weeks on 2 off","Other"].map((v) => <label key={v}><input required type="radio" name="rotation" value={v} className="mr-2" />{v}</label>)}</div></label>
            {[
              ["maxBudget", "Max budget?", ["Yes", "No"]],
              ["overtimeExpected", "Overtime expected?*", ["Yes", "No", "Other"]],
              ["travelCovered", "Travel covered?*", ["Yes", "No", "Other"]],
              ["accommodation", "Accommodation*", ["Free", "Not included", "We help find", "Other"]],
              ["equipmentProvided", "Work equipment provided?*", ["Yes", "No"]],
              ["toolsProvided", "Tools provided?*", ["Yes", "No", "Not required"]],
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
            <label>City/location* <input required name="cityLocation" className={inputClass} /></label>
            <label>Additional notes <textarea name="notes" rows={3} className={inputClass} /></label>
            <label className="block">How soon?* <div className="mt-2 grid gap-2 md:grid-cols-2">{["ASAP","1-2 weeks","1 month","Flexible","Other"].map((v) => <label key={v}><input required type="radio" name="howSoon" value={v} className="mr-2" />{v}</label>)}</div></label>
            <label className="block">Subscribe to candidate updates?* <div className="mt-2 grid gap-2 md:grid-cols-2">{["Yes","No"].map((v) => <label key={v}><input required type="radio" name="subscribeUpdates" value={v} className="mr-2" />{v}</label>)}</div></label>
          </fieldset>

          <button
            type="submit"
            className="w-full rounded-md bg-gold py-4 text-lg font-medium text-white hover:bg-gold-hover"
          >
            Send request
          </button>

          {submitted && (
            <div className="rounded-md border border-gold/40 bg-gold/10 p-4 text-navy">
              Thank you! We&apos;ll review your request and contact you within 24 hours.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
