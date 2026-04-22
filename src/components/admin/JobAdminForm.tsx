"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  categoryOptions,
  locationOptions,
  statusOptions,
  typeOptions,
  type AdminJobFormValues,
} from "@/components/admin/job-admin-types";
import type { JobSource } from "@/lib/jobs/types";

interface JobAdminFormProps {
  mode: "create" | "edit";
  jobId?: string;
  source?: JobSource;
  initialValues: AdminJobFormValues;
}

export default function JobAdminForm({ mode, jobId, source = "manual", initialValues }: JobAdminFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField<Key extends keyof AdminJobFormValues>(key: Key, value: AdminJobFormValues[Key]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const endpoint = mode === "create" ? "/api/admin/jobs" : `/api/admin/jobs/${jobId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setError("Could not save this job. Please review the fields and try again.");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/jobs");
    router.refresh();
  }

  const recmanReadonly = mode === "edit" && source === "recman";
  const readOnlyClass = recmanReadonly ? "opacity-70 pointer-events-none" : "";

  return (
    <form onSubmit={handleSubmit} className="rounded-[18px] border border-[#C9A84C]/20 bg-white/[0.03] p-5 md:p-7">
      {recmanReadonly ? (
        <p className="mb-4 rounded-md border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-2 text-sm text-[#f5df9c]">
          This job is synced from RecMan. Synced fields are read-only in this version.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Job title">
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            required
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Company name">
          <input
            value={values.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <label className={`flex items-center gap-2 text-sm text-white/85 ${readOnlyClass}`}>
          <input
            type="checkbox"
            checked={values.hideCompany}
            onChange={(event) => updateField("hideCompany", event.target.checked)}
          />
          Hide company name in public listing
        </label>

        <Field label="Location">
          <select
            value={values.location}
            onChange={(event) => {
              updateField("location", event.target.value);
            }}
            disabled={recmanReadonly}
            className="select-premium input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          >
            {locationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category">
          <select
            value={values.category}
            onChange={(event) => updateField("category", event.target.value)}
            disabled={recmanReadonly}
            className="select-premium input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Work model">
          <select
            value={values.workModel}
            onChange={(event) => updateField("workModel", event.target.value as AdminJobFormValues["workModel"])}
            disabled={recmanReadonly}
            className="select-premium input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Trade">
          <input
            value={values.trade}
            onChange={(event) => updateField("trade", event.target.value)}
            required
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Contract type">
          <input
            value={values.contractType}
            onChange={(event) => updateField("contractType", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Language requirement">
          <input
            value={values.languageRequirement}
            onChange={(event) => updateField("languageRequirement", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Salary">
          <input
            value={values.salary}
            onChange={(event) => updateField("salary", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Start date">
          <input
            type="date"
            value={values.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Application method">
          <select
            value={values.applicationMethod}
            onChange={(event) => updateField("applicationMethod", event.target.value as AdminJobFormValues["applicationMethod"])}
            disabled={recmanReadonly}
            className="select-premium input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          >
            <option value="internal">Internal form</option>
            <option value="external_url">External URL</option>
            <option value="email">Email</option>
          </select>
        </Field>

        <Field label="Application URL">
          <input
            value={values.applicationUrl}
            onChange={(event) => updateField("applicationUrl", event.target.value)}
            disabled={recmanReadonly || values.applicationMethod !== "external_url"}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Application email">
          <input
            value={values.applicationEmail}
            onChange={(event) => updateField("applicationEmail", event.target.value)}
            disabled={recmanReadonly || values.applicationMethod !== "email"}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) => updateField("status", event.target.value as AdminJobFormValues["status"])}
            disabled={recmanReadonly}
            className="select-premium input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Expiry date">
          <input
            type="date"
            value={values.expiryDate}
            onChange={(event) => updateField("expiryDate", event.target.value)}
            className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-white/85">
          <input type="checkbox" checked={values.featured} onChange={(event) => updateField("featured", event.target.checked)} />
          Featured job
        </label>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Summary">
          <textarea
            value={values.summary}
            onChange={(event) => updateField("summary", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark min-h-[100px] w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            required
            disabled={recmanReadonly}
            className="input-premium--dark min-h-[120px] w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Responsibilities (one per line)">
          <textarea
            value={values.responsibilities}
            onChange={(event) => updateField("responsibilities", event.target.value)}
            required
            disabled={recmanReadonly}
            className="input-premium--dark min-h-[110px] w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Requirements (one per line)">
          <textarea
            value={values.requirements}
            onChange={(event) => updateField("requirements", event.target.value)}
            required
            disabled={recmanReadonly}
            className="input-premium--dark min-h-[110px] w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Benefits (one per line)">
          <textarea
            value={values.benefits}
            onChange={(event) => updateField("benefits", event.target.value)}
            disabled={recmanReadonly}
            className="input-premium--dark min-h-[110px] w-full rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          />
        </Field>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={isSubmitting || recmanReadonly}
          className="btn-gold-premium min-h-[44px] rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Create job" : "Save changes"}
        </button>
        {mode === "create" ? (
          <button
            type="button"
            onClick={() => {
              updateField("status", "active");
            }}
            className="btn-outline-premium min-h-[44px] rounded-md border border-white/20 px-5 py-2 text-sm font-semibold text-white/80"
          >
            Set as publish
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-white/85">
      <span>{label}</span>
      {children}
    </label>
  );
}
