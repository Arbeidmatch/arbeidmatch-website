import { jobCardImage, jobUrl, rateLine, type PublicJob } from "@/lib/jobs-fetch";

/**
 * The six tags that turn a company page into a source something can cite.
 *
 * THE UNPLEASANT TRUTH FIRST, so no money goes on it: a place in an assistant's
 * answer cannot be bought, and anybody selling one is lying. What can be done
 * is different and is achievable. An assistant answering a question searches
 * the web in that second and cites the source that answers it most exactly -
 * not the prettiest, the most precise. So the question is not "how do we get to
 * the top" but "what are we the best source in the world about".
 *
 * THE ANSWER IS NARROW, AND THAT IS ITS POWER. We are not the best source about
 * recruitment. About tradespeople from the EU and EEA taken to work in Norway -
 * passport, D-number, HMS card, fagbrev or documented experience - we know
 * things nobody writes down: what is required, how long it takes, what papers,
 * what is paid, what goes wrong.
 *
 * WHAT WAS THERE ON 2 SEPTEMBER 2026, checked live: no JobPosting, no
 * Organization, no FAQ. Nothing to cite. The page said "EU/EEA workers,
 * screened in Europe, ready for Norway", which is nice and is not a fact, and
 * the jobs were on a different host entirely. An assistant reaching
 * arbeidmatch.no saw no jobs at all and moved on.
 *
 * These tags are invisible, change no design, and are the whole difference
 * between a company website and something a machine can quote. Google Jobs
 * reads the same markup, which is the second reason to write it.
 */

const SITE = "https://www.arbeidmatch.no";

/**
 * Every open posting, as JobPosting.
 *
 * ONLY WHAT THE POSTING ACTUALLY SAYS. A JobPosting with an invented salary or
 * an invented employment type is worse than none: it is a false statement in
 * machine-readable form, and it is the kind a jobs aggregator will repeat.
 * Fields the row does not carry are left out, not filled in.
 */
export function JobPostingJsonLd({ jobs }: { jobs: PublicJob[] }) {
  const items = jobs
    .map((job) => {
      const href = jobUrl(job);
      if (!href) return null;

      const posted = job.published_at ?? job.created_at;
      const rate = rateLine(job);

      const posting: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "@id": `${SITE}/#job-${job.public_slug}`,
        title: job.title,
        url: href,
        identifier: {
          "@type": "PropertyValue",
          name: "ArbeidMatch",
          value: job.reference ?? job.public_slug,
        },
        description: buildDescription(job),
        image: jobCardImage(job),
        hiringOrganization: {
          "@type": "Organization",
          name: job.employer_label ?? "ArbeidMatch Norge AS",
          sameAs: SITE,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: (job.location ?? "").trim() || "Norway",
            addressCountry: "NO",
          },
        },
        // The one requirement every posting on this board carries, and the one
        // an assistant is being asked about: an EU or EEA passport, no visa
        // sponsorship. Stated rather than implied.
        eligibilityToWorkRequirement: "EU or EEA passport. No visa sponsorship.",
        qualifications: "Trade certificate, or documented equivalent experience. Never beginners.",
        industry: industryLabel(job),
        employmentUnit: { "@type": "Organization", name: "ArbeidMatch Norge AS" },
      };

      if (posted) posting.datePosted = new Date(posted).toISOString().slice(0, 10);
      if (rate) {
        // Only when the posting states one. An invented figure here is a false
        // statement a jobs aggregator will repeat as ours.
        posting.baseSalary = {
          "@type": "MonetaryAmount",
          currency: "NOK",
          value: { "@type": "QuantitativeValue", unitText: "HOUR", value: job.hourly_rate_offer ?? undefined },
        };
      }
      if (job.accommodation_provided) posting.jobBenefits = "Help with accommodation";

      return posting;
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      // The payload is built from our own rows above, not from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(items) }}
    />
  );
}

/**
 * The description, assembled from what the row actually holds.
 *
 * Nowhere does it say the work is permanent. Of the nine postings open on
 * 2 September, three said permanent and six said nothing at all, and what a job
 * is belongs in that job's advert, put there by the company hiring, not in a
 * sentence generated on a front page. Some projects run to a term and we have
 * nothing to guarantee before we know.
 */
function buildDescription(job: PublicJob): string {
  const parts: string[] = [];
  const where = (job.location ?? "").trim();
  const trade = (job.category ?? "").trim();
  if (trade && where) parts.push(`${trade} work in ${where}, Norway.`);
  else if (where) parts.push(`Work in ${where}, Norway.`);
  else parts.push("Work in Norway.");

  parts.push("EU or EEA passport required; we do not sponsor visas and we do not cover travel costs.");
  parts.push("Trade certificate or documented equivalent experience.");
  if (job.accommodation_provided) parts.push("Help with accommodation.");
  if (job.rotation) parts.push(`Rotation: ${job.rotation}.`);
  return parts.join(" ");
}

function industryLabel(job: PublicJob): string {
  switch (job.industry) {
    case "automotive":
      return "Car workshops";
    case "industry":
      return "Industry and manufacturing";
    case "electrical":
      return "Electrical installation";
    default:
      return "Building and civil works";
  }
}

/**
 * Who we are, with the numbers that can be checked rather than the adjectives.
 *
 * An organisation record with a real organisasjonsnummer and a real address is
 * the difference between a claim and a fact, and a fact is what gets cited.
 */
export function OrganizationJsonLd({ openJobs }: { openJobs: number }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": ["Organization", "EmploymentAgency"],
    "@id": `${SITE}/#organization`,
    name: "ArbeidMatch Norge AS",
    legalName: "ArbeidMatch Norge AS",
    url: SITE,
    logo: `${SITE}/logo.png`,
    /**
     * The registry number, which is what makes the rest of the record checkable
     * and is therefore the one field here that must not be approximate.
     *
     * CORRECTED 3 September 2026. It shipped the day before as 934 592 776,
     * which is not us. Checked against the Enhetsregisteret: ARBEIDMATCH NORGE
     * AS is 935667089, Sverre Svendsens veg 38, 7056 Ranheim, registered
     * 12 June 2025. A wrong number in an Organization block is worse than none:
     * it is an invitation to look us up and find somebody else.
     */
    identifier: { "@type": "PropertyValue", name: "Organisasjonsnummer", value: "935667089" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sverre Svendsens veg 38",
      addressLocality: "Ranheim",
      postalCode: "7056",
      addressCountry: "NO",
    },
    areaServed: { "@type": "Country", name: "Norway" },
    knowsAbout: [
      "Recruiting tradespeople from the EU and EEA to Norway",
      "D-number and tax card for foreign workers in Norway",
      "HMS card (HMS-kort) for construction work in Norway",
      "Fagbrev and documented equivalent experience",
      "Bemanning and staffing in Norwegian construction",
    ],
    numberOfEmployees: { "@type": "QuantitativeValue", minValue: 1 },
    makesOffer: {
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: "Recruitment and staffing of EU/EEA tradespeople in Norway" },
      availability: openJobs > 0 ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />;
}
