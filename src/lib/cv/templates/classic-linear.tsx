import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  CertificationList,
  EducationEntry,
  ExperienceEntry,
  HEADINGS,
  LanguageList,
  NameBlock,
  PageNumber,
  RuledHeading,
  SkillsLine,
  base,
  type TemplateProps,
} from "@/lib/cv/templates/shared";

/** Plain reverse-chronological. Single column, name block, ruled section headings. */
export function ClassicLinear({ doc }: TemplateProps) {
  return (
    <Document>
      <Page size="A4" style={base.page}>
        <NameBlock personal={doc.personal} />
        <View style={{ marginTop: 10 }} />

        <RuledHeading>{HEADINGS.summary}</RuledHeading>
        <Text style={base.paragraph}>{doc.summary}</Text>

        <RuledHeading>{HEADINGS.experience}</RuledHeading>
        {doc.experience.map((entry, index) => (
          <ExperienceEntry key={index} entry={entry} />
        ))}

        {doc.education.length > 0 ? (
          <>
            <RuledHeading>{HEADINGS.education}</RuledHeading>
            {doc.education.map((entry, index) => (
              <EducationEntry key={index} entry={entry} />
            ))}
          </>
        ) : null}

        {doc.certifications.length > 0 ? (
          <>
            <RuledHeading>{HEADINGS.certifications}</RuledHeading>
            <CertificationList items={doc.certifications} />
          </>
        ) : null}

        <RuledHeading>{HEADINGS.skills}</RuledHeading>
        <SkillsLine items={doc.skills} />

        <RuledHeading>{HEADINGS.languages}</RuledHeading>
        <LanguageList items={doc.languages} />

        <PageNumber />
      </Page>
    </Document>
  );
}
