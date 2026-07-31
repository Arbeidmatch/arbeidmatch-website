import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  CertificationList,
  EducationEntry,
  ExperienceEntry,
  HEADINGS,
  LanguageList,
  NameBlock,
  PALETTE,
  PageNumber,
  SectionHeading,
  SkillsLine,
  base,
  type TemplateProps,
} from "@/lib/cv/templates/shared";

const styles = StyleSheet.create({
  columns: { flexDirection: "row", marginTop: 12 },
  main: { width: "64%", paddingRight: 16 },
  rail: { width: "36%", backgroundColor: PALETTE.railBg, padding: 10, paddingTop: 2 },
  railHeading: { marginTop: 10 },
});

/**
 * Content left, rail right. The rail carries certifications, skills and languages,
 * which are the last three sections in the linear order, so the render tree stays
 * in parser order while the page reads as two columns.
 */
export function TwoColumnRight({ doc }: TemplateProps) {
  return (
    <Document>
      <Page size="A4" style={base.page}>
        <NameBlock personal={doc.personal} />

        <View style={styles.columns}>
          <View style={styles.main}>
            <SectionHeading>{HEADINGS.summary}</SectionHeading>
            <Text style={base.paragraph}>{doc.summary}</Text>

            <SectionHeading>{HEADINGS.experience}</SectionHeading>
            {doc.experience.map((entry, index) => (
              <ExperienceEntry key={index} entry={entry} />
            ))}

            {doc.education.length > 0 ? (
              <>
                <SectionHeading>{HEADINGS.education}</SectionHeading>
                {doc.education.map((entry, index) => (
                  <EducationEntry key={index} entry={entry} />
                ))}
              </>
            ) : null}
          </View>

          <View style={styles.rail}>
            {doc.certifications.length > 0 ? (
              <>
                <SectionHeading style={styles.railHeading}>{HEADINGS.certifications}</SectionHeading>
                <CertificationList items={doc.certifications} />
              </>
            ) : null}

            <SectionHeading style={styles.railHeading}>{HEADINGS.skills}</SectionHeading>
            <SkillsLine items={doc.skills} />

            <SectionHeading style={styles.railHeading}>{HEADINGS.languages}</SectionHeading>
            <LanguageList items={doc.languages} />
          </View>
        </View>

        <PageNumber />
      </Page>
    </Document>
  );
}
