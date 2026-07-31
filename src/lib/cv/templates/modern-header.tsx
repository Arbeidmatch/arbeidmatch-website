import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  CertificationList,
  EducationEntry,
  ExperienceEntry,
  HEADINGS,
  LanguageList,
  PAGE_PADDING,
  PALETTE,
  PageNumber,
  SectionHeading,
  SkillsLine,
  base,
  contactLines,
  type TemplateProps,
} from "@/lib/cv/templates/shared";
import { fullName } from "@/lib/cv/schema";

const styles = StyleSheet.create({
  band: {
    marginHorizontal: -PAGE_PADDING,
    marginTop: -PAGE_PADDING,
    paddingHorizontal: PAGE_PADDING,
    paddingTop: PAGE_PADDING,
    paddingBottom: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: PALETTE.gold,
    marginBottom: 12,
  },
  bandName: { fontSize: 25, fontWeight: 700, color: PALETTE.ink },
  bandHeadline: { fontSize: 12, fontWeight: 600, color: PALETTE.gold, marginTop: 3 },
  bandContact: { fontSize: 9, color: PALETTE.muted, marginTop: 7 },
  heading: { marginTop: 12, marginBottom: 4 },
});

/** Full width name and headline band with a gold rule, single column body. */
export function ModernHeader({ doc }: TemplateProps) {
  return (
    <Document>
      <Page size="A4" style={base.page}>
        <View style={styles.band}>
          <Text style={styles.bandName}>{fullName(doc.personal)}</Text>
          <Text style={styles.bandHeadline}>{doc.personal.headline}</Text>
          <Text style={styles.bandContact}>{contactLines(doc.personal).join("  |  ")}</Text>
        </View>

        <SectionHeading style={styles.heading}>{HEADINGS.summary}</SectionHeading>
        <Text style={base.paragraph}>{doc.summary}</Text>

        <SectionHeading style={styles.heading}>{HEADINGS.experience}</SectionHeading>
        {doc.experience.map((entry, index) => (
          <ExperienceEntry key={index} entry={entry} />
        ))}

        {doc.education.length > 0 ? (
          <>
            <SectionHeading style={styles.heading}>{HEADINGS.education}</SectionHeading>
            {doc.education.map((entry, index) => (
              <EducationEntry key={index} entry={entry} />
            ))}
          </>
        ) : null}

        {doc.certifications.length > 0 ? (
          <>
            <SectionHeading style={styles.heading}>{HEADINGS.certifications}</SectionHeading>
            <CertificationList items={doc.certifications} />
          </>
        ) : null}

        <SectionHeading style={styles.heading}>{HEADINGS.skills}</SectionHeading>
        <SkillsLine items={doc.skills} />

        <SectionHeading style={styles.heading}>{HEADINGS.languages}</SectionHeading>
        <LanguageList items={doc.languages} />

        <PageNumber />
      </Page>
    </Document>
  );
}
