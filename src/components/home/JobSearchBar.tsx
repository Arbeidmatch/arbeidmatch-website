"use client";

import { useState, type FormEvent } from "react";
import type { LocationCount } from "@/lib/jobs-fetch";

/**
 * Three boxes, and the third one is not for the person typing in it.
 *
 * The trade and the town are the search. The company is the register: after a
 * month of traffic the rows say which trades are asked for in which areas and
 * which companies people want to work at, which is who to call and where.
 *
 * WHAT IS RECORDED. The trade, the town, the company, the hour, and how many
 * results came back. No account, no cookie, no address, no identifier of any
 * kind, which is why this can run from the first day without a consent banner:
 * a row here is a question, not a person.
 *
 * THE SEARCH STILL WORKS IF THE REGISTER IS DOWN. The record is sent without
 * being waited for. A visitor looking for work must never wait on our reporting.
 */

const ATS_BASE = process.env.NEXT_PUBLIC_ATS_URL?.replace(/\/$/, "") || "https://ats.arbeidmatch.no";

export function JobSearchBar({
  locations,
  resultsCount,
  labels,
}: {
  locations: LocationCount[];
  /** What the board currently holds, so the register row knows demand against supply. */
  resultsCount: number;
  labels: {
    role: string;
    rolePlaceholder: string;
    where: string;
    everywhere: string;
    company: string;
    companyPlaceholder: string;
    search: string;
  };
}) {
  const [role, setRole] = useState("");
  const [where, setWhere] = useState("");
  const [company, setCompany] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Sent and not awaited. keepalive so it survives the navigation that
    // follows, which is the whole point: the row is written for the search the
    // person is leaving the page to run.
    try {
      const body = JSON.stringify({ role, location: where, company, source: "website", results: resultsCount });
      const url = `${ATS_BASE}/api/public/job-search-demand`;
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
      }
    } catch {
      // A search that could not be recorded is still a search.
    }

    const params = new URLSearchParams();
    if (role.trim()) params.set("search", role.trim());
    if (where.trim()) params.set("location", where.trim());
    window.location.href = `/jobs${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 flex max-w-3xl flex-wrap overflow-hidden rounded border border-gold/40 shadow-lg"
    >
      <label className="min-w-[150px] flex-[1.2] border-r border-border bg-white px-4 py-3 text-left">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{labels.role}</span>
        <input
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={labels.rolePlaceholder}
          className="mt-1 w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-text-secondary"
        />
      </label>

      <label className="min-w-[140px] flex-[0.8] border-r border-border bg-white px-4 py-3 text-left">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{labels.where}</span>
        <select
          name="where"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          className="mt-1 w-full bg-transparent text-[15px] text-navy outline-none"
        >
          <option value="">{labels.everywhere}</option>
          {/* Only towns that actually have a posting in them. A dropdown of
              every Norwegian city would offer the reader eleven empty searches. */}
          {locations.map((location) => (
            <option key={location.name} value={location.name}>
              {location.name} ({location.count})
            </option>
          ))}
        </select>
      </label>

      <label className="min-w-[140px] flex-[0.9] border-r border-border bg-white px-4 py-3 text-left">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{labels.company}</span>
        <input
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={labels.companyPlaceholder}
          className="mt-1 w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-text-secondary"
        />
      </label>

      <button
        type="submit"
        className="bg-gold px-8 py-3 text-sm font-bold text-navy transition hover:bg-gold-hover"
      >
        {labels.search}
      </button>
    </form>
  );
}
