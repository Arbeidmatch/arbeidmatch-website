import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PALETTE, PageNumber, base, contactLines, type TemplateProps } from "@/lib/cv/templates/shared";
import { fullName } from "@/lib/cv/schema";

const styles = StyleSheet.create({
  headline: { fontSize: 10, fontWeight: 600, color: PALETTE.muted },
  name: { fontSize: 22, fontWeight: 700, color: PALETTE.ink, marginTop: 2 },
  contact: { fontSize: 9, color: PALETTE.muted, marginTop: 8 },
  divider: { borderBottomWidth: 0.8, borderBottomColor: PALETTE.rule, marginTop: 12, marginBottom: 16 },
  recipient: { fontSize: 9.4, color: PALETTE.body, marginBottom: 2 },
  salutation: { fontSize: 11, fontWeight: 700, color: PALETTE.ink, marginTop: 14, marginBottom: 8 },
  paragraph: { marginBottom: 9, textAlign: "left" },
  closing: { marginTop: 12 },
  signature: { fontWeight: 700, color: PALETTE.ink, marginTop: 2 },
});

/**
 * Cover letter. Inherits the typography of the CV templates and is exported as its
 * own PDF file so an employer can open either document on its own.
 */
export function CoverLetter({ doc }: TemplateProps) {
  const letter = doc.coverLetter;
  if (!letter) return <Document />;

  const paragraphs = letter.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const recipientLines = [
    letter.recipientName,
    letter.recipientTitle,
    letter.companyName,
    letter.companyCity,
  ].filter((line): line is string => Boolean(line));

  const salutation = letter.recipientName ? `Dear ${letter.recipientName},` : "Dear Hiring Manager,";

  return (
    <Document>
      <Page size="A4" style={base.page}>
        <Text style={styles.headline}>{doc.personal.headline.toUpperCase()}</Text>
        <Text style={styles.name}>{fullName(doc.personal)}</Text>
        <Text style={styles.contact}>{contactLines(doc.personal).join("  |  ")}</Text>
        <View style={styles.divider} />

        {recipientLines.map((line, index) => (
          <Text key={index} style={styles.recipient}>
            {line}
          </Text>
        ))}

        <Text style={styles.salutation}>{salutation}</Text>

        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={styles.closing}>Yours sincerely,</Text>
        <Text style={styles.signature}>{fullName(doc.personal)}</Text>

        <PageNumber />
      </Page>
    </Document>
  );
}
