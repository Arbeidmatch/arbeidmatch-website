"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin, Search } from "lucide-react";

type JobCategory = "Offshore" | "Onshore" | "Transport" | "Automotive";
type JobType = "Full-time" | "Contract";

type PremiumJob = {
  title: string;
  company: string;
  location: string;
  salary: string;
  type: JobType;
  category: JobCategory;
  description: string;
  posted: string;
  featured: boolean;
};

const JOBS: PremiumJob[] = [
  {
    title: "Electrical Technician",
    company: "NorthWave Energy",
    location: "Stavanger",
    salary: "NOK 630,000 to 720,000",
    type: "Full-time",
    category: "Offshore",
    description: "Support platform electrical systems, safety inspections, and maintenance planning.",
    posted: "2 days ago",
    featured: true,
  },
  {
    title: "Industrial Welder",
    company: "Fjord Steel Services",
    location: "Bergen",
    salary: "NOK 290 to 340 per hour",
    type: "Contract",
    category: "Onshore",
    description: "Perform MIG and TIG welding on structural components in production facilities.",
    posted: "1 day ago",
    featured: false,
  },
  {
    title: "Heavy Truck Driver C+E",
    company: "Arctic Freight AS",
    location: "Trondheim",
    salary: "NOK 610,000 to 680,000",
    type: "Full-time",
    category: "Transport",
    description: "Handle long-haul deliveries across regional routes with strict safety standards.",
    posted: "3 days ago",
    featured: true,
  },
  {
    title: "Automotive Diagnostic Technician",
    company: "Nordic Mobility Center",
    location: "Oslo",
    salary: "NOK 580,000 to 650,000",
    type: "Full-time",
    category: "Automotive",
    description: "Diagnose electronic systems, perform advanced troubleshooting, and support workshop teams.",
    posted: "5 days ago",
    featured: false,
  },
  {
    title: "Pipe Fitter",
    company: "Polar Process Group",
    location: "Hammerfest",
    salary: "NOK 300 to 360 per hour",
    type: "Contract",
    category: "Offshore",
    description: "Install and maintain pressure piping systems during scheduled offshore rotations.",
    posted: "4 days ago",
    featured: false,
  },
  {
    title: "Concrete Specialist",
    company: "VestBygg Entreprenor",
    location: "Drammen",
    salary: "NOK 280 to 330 per hour",
    type: "Contract",
    category: "Onshore",
    description: "Execute reinforcement, casting, and finishing for commercial construction projects.",
    posted: "6 days ago",
    featured: false,
  },
  {
    title: "Bus Fleet Mechanic",
    company: "CityMove Transit",
    location: "Tromso",
    salary: "NOK 560,000 to 620,000",
    type: "Full-time",
    category: "Transport",
    description: "Service diesel and hybrid fleet vehicles with preventive maintenance schedules.",
    posted: "2 days ago",
    featured: false,
  },
  {
    title: "Paint and Body Technician",
    company: "Prime Auto Repair",
    location: "Kristiansand",
    salary: "NOK 550,000 to 610,000",
    type: "Full-time",
    category: "Automotive",
    description: "Deliver high-quality paint correction and collision repair for premium vehicles.",
    posted: "7 days ago",
    featured: true,
  },
];

const FILTERS: Array<"All" | JobCategory> = ["All", "Offshore", "Onshore", "Transport", "Automotive"];

export default function PremiumJobsBoard() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | JobCategory>("All");

  const visibleJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return JOBS.filter((job) => {
      const inCategory = activeFilter === "All" || job.category === activeFilter;
      if (!inCategory) return false;
      if (!normalized) return true;
      return [job.title, job.company, job.location].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [activeFilter, query]);

  const stats = useMemo(() => {
    const industries = new Set(JOBS.map((job) => job.category));
    return [
      { label: "Live jobs", value: String(JOBS.length) },
      { label: "Industries", value: String(industries.size) },
      { label: "Verified jobs", value: String(JOBS.filter((job) => job.featured).length) },
    ];
  }, []);

  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="container-site section-y-tight pb-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[rgba(201,168,76,0.08)] animate-[fadeIn_.6s_ease]">
            <BriefcaseBusiness className="h-7 w-7 text-[#C9A84C]" />
            <div className="pointer-events-none absolute h-16 w-16 rounded-full bg-[rgba(201,168,76,0.12)] blur-xl" aria-hidden />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-[-0.02em] text-white md:text-5xl animate-[fadeIn_.7s_ease]">
            Blue-Collar Careers in Norway
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg animate-[fadeIn_.8s_ease]">
            Explore premium opportunities in offshore, onshore, transport, and automotive sectors with verified employers
            across Norway.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-5 text-center transition-all duration-300"
              >
                <p className="text-3xl font-bold text-[#C9A84C]">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.1em] text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site pb-8">
        <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-4 md:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search jobs by title, company, location"
              className="h-12 w-full rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,168,76,0.45)] focus:outline-none"
            />
          </label>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                  activeFilter === filter
                    ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                    : "border-white/15 bg-[rgba(255,255,255,0.02)] text-white/75 hover:border-[rgba(201,168,76,0.35)] hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site pb-20">
        {visibleJobs.length === 0 ? (
          <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-14 text-center">
            <p className="text-xl font-semibold text-white">No matching opportunities right now.</p>
            <p className="mt-2 text-sm text-white/70">Try another keyword or switch category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleJobs.map((job) => (
              <article
                key={`${job.company}-${job.title}`}
                className={`flex h-full flex-col rounded-[16px] border bg-[rgba(255,255,255,0.03)] p-5 transition-all duration-300 hover:-translate-y-1 ${
                  job.featured
                    ? "border-[rgba(201,168,76,0.45)]"
                    : "border-[rgba(201,168,76,0.15)] hover:border-[rgba(201,168,76,0.35)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-[rgba(201,168,76,0.3)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">
                    {job.type}
                  </span>
                  <span className="text-xs text-white/55">{job.posted}</span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-white">{job.title}</h2>
                <p className="mt-1 text-sm font-medium text-white/75">{job.company}</p>

                <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4 text-[#C9A84C]" />
                  <span>{job.location}</span>
                </div>

                <p className="mt-3 text-sm font-semibold text-[#C9A84C]">{job.salary}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{job.description}</p>

                <div className="mt-5 flex items-center justify-between pt-3">
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-white/65">
                    {job.category}
                  </span>
                  <button
                    type="button"
                    className="rounded-[10px] bg-[#C9A84C] px-4 py-2 text-xs font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

