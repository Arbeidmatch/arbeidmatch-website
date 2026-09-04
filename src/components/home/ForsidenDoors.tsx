"use client";

import Link from "next/link";

import { CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";

/**
 * The two doors, and where each one lands.
 *
 * This site keeps no accounts of its own. The candidate's account lives on the
 * board, and the two constants in lib/candidatePortal are the only place that
 * is written down, so a door here cannot fall out of step with the navbar, the
 * drawer or /employees.
 *
 * Create profile used to open the ATS candidate login. That is the wrong door
 * twice over: the ATS is the back office, and a man who has no profile yet
 * needs the place where one is made, not a password box.
 *
 * It is a client component because pressing a service is also what tells the
 * leaving panel which conversation the visitor was in - somebody reading about
 * staffing should not be offered a job alert on the way out.
 */

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
        <Link
          href={CANDIDATE_PORTAL_SIGNUP_URL}
          className="mt-6 inline-flex items-center rounded bg-gold px-6 py-3 text-sm font-bold text-navy transition hover:bg-gold-hover"
        >
          Create profile
        </Link>
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
