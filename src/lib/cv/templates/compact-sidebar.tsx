import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  EducationEntry,
  ExperienceEntry,
  HEADINGS,
  PAGE_PADDING,
  PALETTE,
  PageNumber,
  SectionHeading,
  base,
  certificationLine,
  contactLines,
  languageLine,
  type TemplateProps,
} from "@/lib/cv/templates/shared";
import { fullName } from "@/lib/cv/schema";

const SIDEBAR_WIDTH = 168;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.8,
    lineHeight: 1.4,
    color: PALETTE.body,
    paddingTop: PAGE_PADDING,
    paddingBottom: PAGE_PADDING + 10,
    paddingRight: PAGE_PADDING,
    paddingLeft: SIDEBAR_WIDTH + 20,
  },
  sidebarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: PALETTE.sidebarBg,
  },
  sidebarTop: {
    position: "absolute",
    top: PAGE_PADDING,
    left: 18,
    width: SIDEBAR_WIDTH - 32,
  },
  sidebarBottom: {
    position: "absolute",
    top: 238,
    left: 18,
    width: SIDEBAR_WIDTH - 32,
  },
  sidebarName: { fontSize: 18, fontWeight: 700, color: PALETTE.sidebarInk },
  sidebarHeadline: { fontSize: 10, fontWeight: 600, color: PALETTE.gold, marginTop: 4 },
  sidebarContact: { fontSize: 8.6, color: PALETTE.sidebarMuted, marginTop: 3 },
  sidebarHeading: {
    fontSize: 8.8,
    fontWeight: 700,
    color: PALETTE.gold,
    marginTop: 12,
    marginBottom: 4,
  },
  sidebarItem: { fontSize: 8.6, color: PALETTE.sidebarInk, marginBottom: 3 },
  contactDivider: {
    borderBottomWidth: 0.8,
    borderBottomColor: PALETTE.gold,
    marginTop: 10,
    width: 42,
  },
});

/**
 * Dark sidebar on the left. The sidebar is painted in two absolutely positioned blocks
 * so the render tree keeps the linear order: contact first, then the main column,
 * then certifications, skills and languages.
 */
export function CompactSidebar({ doc }: TemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebarBackground} fixed />

        <View style={styles.sidebarTop}>
          <Text style={styles.sidebarName}>{fullName(doc.personal)}</Text>
          <Text style={styles.sidebarHeadline}>{doc.personal.headline}</Text>
          <View style={styles.contactDivider} />
          {contactLines(doc.personal).map((line, index) => (
            <Text key={index} style={styles.sidebarContact}>
              {line}
            </Text>
          ))}
        </View>

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

        <View style={styles.sidebarBottom}>
          {doc.certifications.length > 0 ? (
            <>
              <Text style={styles.sidebarHeading}>{HEADINGS.certifications}</Text>
              {doc.certifications.map((entry, index) => (
                <Text key={index} style={styles.sidebarItem}>
                  {certificationLine(entry)}
                </Text>
              ))}
            </>
          ) : null}

          <Text style={styles.sidebarHeading}>{HEADINGS.skills}</Text>
          <Text style={styles.sidebarItem}>{doc.skills.join(", ")}</Text>

          <Text style={styles.sidebarHeading}>{HEADINGS.languages}</Text>
          {doc.languages.map((entry, index) => (
            <Text key={index} style={styles.sidebarItem}>
              {languageLine(entry)}
            </Text>
          ))}
        </View>

        <PageNumber />
      </Page>
    </Document>
  );
}
