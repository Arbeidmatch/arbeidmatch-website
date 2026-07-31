import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  CertificationList,
  EducationEntry,
  ExperienceEntry,
  HEADINGS,
  LanguageList,
  PALETTE,
  PageNumber,
  SkillsLine,
  base,
  contactLines,
  type TemplateProps,
} from "@/lib/cv/templates/shared";
import { fullName } from "@/lib/cv/schema";

const GUTTER = 92;

const styles = StyleSheet.create({
  header: { marginBottom: 14 },
  name: { fontSize: 22, fontWeight: 700, color: PALETTE.ink },
  headline: { fontSize: 10.5, fontWeight: 600, color: PALETTE.gold, marginTop: 3 },
  contact: { fontSize: 9, color: PALETTE.muted, marginTop: 8 },
  row: {
    flexDirection: "row",
    borderTopWidth: 0.8,
    borderTopColor: PALETTE.rule,
    paddingTop: 9,
    marginTop: 9,
  },
  gutter: { width: GUTTER, paddingRight: 12 },
  gutterLabel: { fontSize: 8.6, fontWeight: 700, color: PALETTE.muted },
  content: { flex: 1 },
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.gutter}>
        <Text style={styles.gutterLabel}>{label}</Text>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/** Section labels sit in a narrow left gutter; the content flows to the right of them. */
export function LabelLeft({ doc }: TemplateProps) {
  return (
    <Document>
      <Page size="A4" style={base.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName(doc.personal)}</Text>
          <Text style={styles.headline}>{doc.personal.headline}</Text>
          <Text style={styles.contact}>{contactLines(doc.personal).join("  //  ")}</Text>
        </View>

        <Row label={HEADINGS.summary}>
          <Text style={base.paragraph}>{doc.summary}</Text>
        </Row>

        <Row label={HEADINGS.experience}>
          {doc.experience.map((entry, index) => (
            <ExperienceEntry key={index} entry={entry} />
          ))}
        </Row>

        {doc.education.length > 0 ? (
          <Row label={HEADINGS.education}>
            {doc.education.map((entry, index) => (
              <EducationEntry key={index} entry={entry} />
            ))}
          </Row>
        ) : null}

        {doc.certifications.length > 0 ? (
          <Row label={HEADINGS.certifications}>
            <CertificationList items={doc.certifications} />
          </Row>
        ) : null}

        <Row label={HEADINGS.skills}>
          <SkillsLine items={doc.skills} />
        </Row>

        <Row label={HEADINGS.languages}>
          <LanguageList items={doc.languages} />
        </Row>

        <PageNumber />
      </Page>
    </Document>
  );
}
