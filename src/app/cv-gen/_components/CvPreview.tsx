"use client";

import {
  SECTION_HEADINGS,
  dateRange,
  dateRangeWithDuration,
  fullName,
  type CvDocument,
} from "@/lib/cv/schema";

/**
 * Screen preview of the PDF. It mirrors the print templates closely enough to judge the
 * layout, but the PDF itself is always rendered on the server, so this is a picture of
 * the result rather than the result.
 *
 * Content order is identical to the print templates: visual columns come from CSS,
 * never from reordering the markup.
 */

const A4_RATIO = 297 / 210;

function contactLine(doc: CvDocument): string {
  return [
    [doc.personal.city, doc.personal.country].filter(Boolean).join(", "),
    doc.personal.phone,
    doc.personal.email,
    doc.personal.linkedin,
    doc.personal.portfolio,
  ]
    .filter(Boolean)
    .join("  |  ");
}

function Bullets({ items }: { items: string[] }) {
  const visible = items.filter((item) => item.trim().length > 0);
  if (visible.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5">
      {visible.map((item, index) => (
        <li key={index} className="flex gap-1.5">
          <span aria-hidden="true">&bull;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Experience({ doc }: { doc: CvDocument }) {
  return (
    <>
      {doc.experience.map((entry, index) => (
        <div key={index} className="mb-2.5">
          <p className="font-bold text-[#0D1B2A]">{entry.jobTitle || "Job title"}</p>
          <p>{[entry.company, entry.city, entry.country].filter(Boolean).join(", ")}</p>
          <p className="text-[#55616D]">
            {dateRangeWithDuration(entry.startDate || "MM/YYYY", entry.endDate || "Present")}
          </p>
          <Bullets items={entry.bullets} />
        </div>
      ))}
    </>
  );
}

function Education({ doc }: { doc: CvDocument }) {
  return (
    <>
      {doc.education.map((entry, index) => (
        <div key={index} className="mb-2.5">
          <p className="font-bold text-[#0D1B2A]">{entry.qualification}</p>
          <p>{[entry.institution, entry.city, entry.country].filter(Boolean).join(", ")}</p>
          <p className="text-[#55616D]">{dateRange(entry.startDate || "MM/YYYY", entry.endDate || "Present")}</p>
          {entry.details ? <p>{entry.details}</p> : null}
        </div>
      ))}
    </>
  );
}

function Certifications({ doc }: { doc: CvDocument }) {
  return (
    <>
      {doc.certifications.map((entry, index) => (
        <p key={index}>
          {[entry.name, entry.issuer, entry.issued && entry.expires ? `${entry.issued} - ${entry.expires}` : entry.issued]
            .filter(Boolean)
            .join(", ")}
        </p>
      ))}
    </>
  );
}

function Languages({ doc }: { doc: CvDocument }) {
  return (
    <>
      {doc.languages.map((entry, index) => (
        <p key={index}>
          {entry.language}: {entry.level}
        </p>
      ))}
    </>
  );
}

/** Gutter row used by the label-left layout. Declared here so it keeps its identity across renders. */
function GutterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex gap-3 border-t border-[#C7CDD4] pt-2">
      <div className="w-[22%] shrink-0 font-bold text-[#55616D]">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Heading({ children, className = "" }: { children: string; className?: string }) {
  return <h3 className={`mt-3 mb-1 font-bold text-[#0D1B2A] ${className}`}>{children}</h3>;
}

function RuledHeading({ children }: { children: string }) {
  return (
    <>
      <Heading>{children}</Heading>
      <div className="mb-1.5 border-b border-[#C7CDD4]" />
    </>
  );
}

export function CvPreview({ doc, scale = 1 }: { doc: CvDocument; scale?: number }) {
  const name = fullName(doc.personal) || "Your name";
  const body = (() => {
    switch (doc.templateId) {
      case "modern-header":
        return (
          <div className="h-full">
            <div className="-mx-[6%] -mt-[6%] mb-3 border-b-2 border-[#C9A84C] px-[6%] pt-[6%] pb-3">
              <p className="text-[2.1em] font-bold leading-tight text-[#0D1B2A]">{name}</p>
              <p className="text-[1.1em] font-semibold text-[#C9A84C]">{doc.personal.headline}</p>
              <p className="mt-1.5 text-[#55616D]">{contactLine(doc)}</p>
            </div>
            <Heading>{SECTION_HEADINGS.summary}</Heading>
            <p>{doc.summary}</p>
            <Heading>{SECTION_HEADINGS.experience}</Heading>
            <Experience doc={doc} />
            {doc.education.length > 0 ? <Heading>{SECTION_HEADINGS.education}</Heading> : null}
            <Education doc={doc} />
            {doc.certifications.length > 0 ? <Heading>{SECTION_HEADINGS.certifications}</Heading> : null}
            <Certifications doc={doc} />
            <Heading>{SECTION_HEADINGS.skills}</Heading>
            <p>{doc.skills.join(", ")}</p>
            <Heading>{SECTION_HEADINGS.languages}</Heading>
            <Languages doc={doc} />
          </div>
        );

      case "two-column-right":
        return (
          <div>
            <p className="text-[1.8em] font-bold leading-tight text-[#0D1B2A]">{name}</p>
            <p className="font-semibold text-[#C9A84C]">{doc.personal.headline}</p>
            <p className="mt-1 text-[#55616D]">{contactLine(doc)}</p>
            <div className="mt-3 flex gap-4">
              <div className="w-[64%]">
                <Heading>{SECTION_HEADINGS.summary}</Heading>
                <p>{doc.summary}</p>
                <Heading>{SECTION_HEADINGS.experience}</Heading>
                <Experience doc={doc} />
                {doc.education.length > 0 ? <Heading>{SECTION_HEADINGS.education}</Heading> : null}
                <Education doc={doc} />
              </div>
              <div className="w-[36%] bg-[#F2F4F7] p-2">
                {doc.certifications.length > 0 ? <Heading>{SECTION_HEADINGS.certifications}</Heading> : null}
                <Certifications doc={doc} />
                <Heading>{SECTION_HEADINGS.skills}</Heading>
                <p>{doc.skills.join(", ")}</p>
                <Heading>{SECTION_HEADINGS.languages}</Heading>
                <Languages doc={doc} />
              </div>
            </div>
          </div>
        );

      case "label-left": {
        const Row = GutterRow;
        return (
          <div>
            <p className="text-[1.9em] font-bold leading-tight text-[#0D1B2A]">{name}</p>
            <p className="font-semibold text-[#C9A84C]">{doc.personal.headline}</p>
            <p className="mt-1.5 text-[#55616D]">{contactLine(doc)}</p>
            <Row label={SECTION_HEADINGS.summary}>
              <p>{doc.summary}</p>
            </Row>
            <Row label={SECTION_HEADINGS.experience}>
              <Experience doc={doc} />
            </Row>
            {doc.education.length > 0 ? (
              <Row label={SECTION_HEADINGS.education}>
                <Education doc={doc} />
              </Row>
            ) : null}
            {doc.certifications.length > 0 ? (
              <Row label={SECTION_HEADINGS.certifications}>
                <Certifications doc={doc} />
              </Row>
            ) : null}
            <Row label={SECTION_HEADINGS.skills}>
              <p>{doc.skills.join(", ")}</p>
            </Row>
            <Row label={SECTION_HEADINGS.languages}>
              <Languages doc={doc} />
            </Row>
          </div>
        );
      }

      case "compact-sidebar":
        return (
          <div className="-m-[6%] flex h-[calc(100%+12%)]">
            <div className="w-[30%] bg-[#0D1B2A] p-[4%] text-white">
              <p className="text-[1.5em] font-bold leading-tight">{name}</p>
              <p className="mt-1 font-semibold text-[#C9A84C]">{doc.personal.headline}</p>
              <div className="my-2 w-8 border-b border-[#C9A84C]" />
              {[
                [doc.personal.city, doc.personal.country].filter(Boolean).join(", "),
                doc.personal.phone,
                doc.personal.email,
              ]
                .filter(Boolean)
                .map((line, index) => (
                  <p key={index} className="text-[#C2CAD3]">
                    {line}
                  </p>
                ))}
              {doc.certifications.length > 0 ? (
                <Heading className="!text-[#C9A84C]">{SECTION_HEADINGS.certifications}</Heading>
              ) : null}
              <div className="text-white">
                <Certifications doc={doc} />
              </div>
              <Heading className="!text-[#C9A84C]">{SECTION_HEADINGS.skills}</Heading>
              <p>{doc.skills.join(", ")}</p>
              <Heading className="!text-[#C9A84C]">{SECTION_HEADINGS.languages}</Heading>
              <Languages doc={doc} />
            </div>
            <div className="flex-1 p-[4%]">
              <Heading>{SECTION_HEADINGS.summary}</Heading>
              <p>{doc.summary}</p>
              <Heading>{SECTION_HEADINGS.experience}</Heading>
              <Experience doc={doc} />
              {doc.education.length > 0 ? <Heading>{SECTION_HEADINGS.education}</Heading> : null}
              <Education doc={doc} />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p className="text-[1.8em] font-bold leading-tight text-[#0D1B2A]">{name}</p>
            <p className="font-semibold text-[#C9A84C]">{doc.personal.headline}</p>
            <p className="mt-1 text-[#55616D]">{contactLine(doc)}</p>
            <RuledHeading>{SECTION_HEADINGS.summary}</RuledHeading>
            <p>{doc.summary}</p>
            <RuledHeading>{SECTION_HEADINGS.experience}</RuledHeading>
            <Experience doc={doc} />
            {doc.education.length > 0 ? <RuledHeading>{SECTION_HEADINGS.education}</RuledHeading> : null}
            <Education doc={doc} />
            {doc.certifications.length > 0 ? <RuledHeading>{SECTION_HEADINGS.certifications}</RuledHeading> : null}
            <Certifications doc={doc} />
            <RuledHeading>{SECTION_HEADINGS.skills}</RuledHeading>
            <p>{doc.skills.join(", ")}</p>
            <RuledHeading>{SECTION_HEADINGS.languages}</RuledHeading>
            <Languages doc={doc} />
          </div>
        );
    }
  })();

  return (
    <div
      className="mx-auto w-full overflow-hidden bg-white text-[#20303F] shadow-none"
      style={{
        aspectRatio: `1 / ${A4_RATIO}`,
        padding: "6%",
        fontSize: `${0.62 * scale}rem`,
        lineHeight: 1.4,
      }}
    >
      {body}
    </div>
  );
}
