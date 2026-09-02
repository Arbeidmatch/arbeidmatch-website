"use client";

import Link from "next/link";

/**
 * The two doors, and where each one lands.
 *
 * This site keeps no accounts. The login is the ATS's, and this page sends
 * people there with the right context: one user base, one password to reset,
 * and no second list of companies to fall out of step with the first.
 *
 * It is a client component because pressing a service is also what tells the
 * leaving panel which conversation the visitor was in - somebody reading about
 * staffing should not be offered a job alert on the way out.
 */

const ATS_BASE = process.env.NEXT_PUBLIC_ATS_URL?.replace(/\/$/, "") || "https://ats.arbeidmatch.no";

function rememberService(service: "recruitment" | "staffing" | "job_ad") {
  try {
    sessionStorage.setItem("am_last_service", service);
  } catch {
    // Without it the leaving panel simply does not appear, which is the right
    // failure: a generic panel is an advertisement, not help.
  }
}

export function ForsidenDoors() {
  return (
    <div className="grid border-t border-border md:grid-cols-2">
      {/* The person looking for work. One profile, and we call. */}
      <div className="border-b border-border p-8 md:border-b-0 md:border-r">
        <h3 className="text-2xl font-bold text-navy">Looking for work?</h3>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          Make one profile. We call you when something fits your trade, so you stop sending the same CV to ten companies.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-text-secondary">
          <li>Profile in five minutes, CV optional</li>
          <li>You can see who has read it</li>
          <li>You delete it whenever you want</li>
        </ul>
        <a
          href={`${ATS_BASE}/candidate/login`}
          className="mt-6 inline-flex items-center rounded bg-gold px-6 py-3 text-sm font-bold text-navy transition hover:bg-gold-hover"
        >
          Create profile
        </a>
      </div>

      {/* The company that needs people. Three ways, and the choice decides what opens. */}
      <div className="bg-navy/[0.03] p-8">
        <h3 className="text-2xl font-bold text-navy">Need people?</h3>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          Post a job yourself, or let us find the people. Three ways, one place, and you pick by how much time you have.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-text-secondary">
          <li>
            <button type="button" onClick={() => rememberService("job_ad")} className="text-left hover:text-gold">
              <strong className="font-semibold text-navy">Job ad.</strong> You write it, we publish it, the applications
              reach you
            </button>
          </li>
          <li>
            <button type="button" onClick={() => rememberService("recruitment")} className="text-left hover:text-gold">
              <strong className="font-semibold text-navy">Recruitment.</strong> We find and present the candidates
            </button>
          </li>
          <li>
            <button type="button" onClick={() => rememberService("staffing")} className="text-left hover:text-gold">
              <strong className="font-semibold text-navy">Staffing.</strong> We employ them, you hire them in
            </button>
          </li>
        </ul>
        <Link
          href="/request"
          onClick={() => rememberService("recruitment")}
          className="mt-6 inline-flex items-center rounded border border-navy px-6 py-3 text-sm font-bold text-navy transition hover:bg-navy hover:text-white"
        >
          Register company
        </Link>
      </div>
    </div>
  );
}
