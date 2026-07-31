import path from "node:path";
import React from "react";
import { Font, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";
import {
  SECTION_HEADINGS,
  dateRange,
  fullName,
  type CvCertification,
  type CvDocument,
  type CvEducation,
  type CvExperience,
  type CvLanguage,
  type CvPersonal,
} from "@/lib/cv/schema";

export const PALETTE = {
  ink: "#0D1B2A",
  body: "#20303F",
  muted: "#55616D",
  gold: "#C9A84C",
  rule: "#C7CDD4",
  sidebarBg: "#0D1B2A",
  sidebarInk: "#FFFFFF",
  sidebarMuted: "#C2CAD3",
  railBg: "#F2F4F7",
} as const;

export const PAGE_PADDING = 34; // ~12 mm at 72 dpi
export const BULLET = "•";

let fontsRegistered = false;

/**
 * Inter, subset to Latin Extended A so Romanian and Norwegian characters render.
 * Registered once per process; the files ship in `public/fonts`.
 */
export function registerCvFonts(): void {
  if (fontsRegistered) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(dir, "Inter-Regular.ttf"), fontWeight: 400 },
      { src: path.join(dir, "Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(dir, "Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Hyphenation off: a parser must never see a bullet split mid word.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export const base = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.8,
    lineHeight: 1.4,
    color: PALETTE.body,
    paddingTop: PAGE_PADDING,
    paddingBottom: PAGE_PADDING + 10,
    paddingHorizontal: PAGE_PADDING,
  },
  name: { fontSize: 21, fontWeight: 700, color: PALETTE.ink },
  headline: { fontSize: 11, fontWeight: 600, color: PALETTE.gold, marginTop: 2 },
  contactLine: { fontSize: 9, color: PALETTE.muted, marginTop: 5 },
  sectionHeading: {
    fontSize: 9.5,
    fontWeight: 700,
    color: PALETTE.ink,
    marginTop: 13,
    marginBottom: 5,
  },
  rule: { borderBottomWidth: 0.8, borderBottomColor: PALETTE.rule, marginBottom: 6 },
  entryTitle: { fontSize: 10.4, fontWeight: 700, color: PALETTE.ink },
  entryMeta: { fontSize: 9.2, color: PALETTE.body, marginTop: 1 },
  entryDates: { fontSize: 9, color: PALETTE.muted, marginTop: 1, marginBottom: 3 },
  bulletRow: { flexDirection: "row", marginBottom: 1.5 },
  bulletGlyph: { width: 9, fontSize: 9.5 },
  bulletText: { flex: 1 },
  entry: { marginBottom: 8 },
  paragraph: { textAlign: "left" },
  pageNumber: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: PALETTE.muted,
  },
});

export interface TemplateProps {
  doc: CvDocument;
}

export function contactLines(personal: CvPersonal): string[] {
  const lines = [
    [personal.city, personal.country].filter(Boolean).join(", "),
    personal.phone,
    personal.email,
  ];
  if (personal.streetAddress) lines.unshift(personal.streetAddress);
  if (personal.linkedin) lines.push(personal.linkedin);
  if (personal.portfolio) lines.push(personal.portfolio);
  return lines.filter(Boolean);
}

export function SectionHeading({ children, style }: { children: string; style?: Style }) {
  return <Text style={style ? [base.sectionHeading, style] : base.sectionHeading}>{children}</Text>;
}

export function RuledHeading({ children }: { children: string }) {
  return (
    <View wrap={false}>
      <SectionHeading>{children}</SectionHeading>
      <View style={base.rule} />
    </View>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <View key={index} style={base.bulletRow} wrap={false}>
          <Text style={base.bulletGlyph}>{BULLET}</Text>
          <Text style={base.bulletText}>{item}</Text>
        </View>
      ))}
    </>
  );
}

/**
 * One experience entry, emitted as consecutive lines:
 * job title, then "Company, City, Country", then the date range, then the bullets.
 */
export function ExperienceEntry({ entry }: { entry: CvExperience }) {
  return (
    <View style={base.entry} wrap={false}>
      <Text style={base.entryTitle}>{entry.jobTitle}</Text>
      <Text style={base.entryMeta}>{[entry.company, entry.city, entry.country].join(", ")}</Text>
      <Text style={base.entryDates}>{dateRange(entry.startDate, entry.endDate)}</Text>
      <Bullets items={entry.bullets} />
    </View>
  );
}

export function EducationEntry({ entry }: { entry: CvEducation }) {
  return (
    <View style={base.entry} wrap={false}>
      <Text style={base.entryTitle}>{entry.qualification}</Text>
      <Text style={base.entryMeta}>{[entry.institution, entry.city, entry.country].join(", ")}</Text>
      <Text style={base.entryDates}>{dateRange(entry.startDate, entry.endDate)}</Text>
      {entry.details ? <Text>{entry.details}</Text> : null}
    </View>
  );
}

export function certificationLine(entry: CvCertification): string {
  const parts: string[] = [entry.name];
  if (entry.issuer) parts.push(entry.issuer);
  if (entry.issued) parts.push(entry.expires ? `${entry.issued} - ${entry.expires}` : entry.issued);
  return parts.join(", ");
}

export function languageLine(entry: CvLanguage): string {
  return `${entry.language}: ${entry.level}`;
}

export function CertificationList({ items }: { items: CvCertification[] }) {
  return (
    <>
      {items.map((entry, index) => (
        <Text key={index} style={{ marginBottom: 2 }}>
          {certificationLine(entry)}
        </Text>
      ))}
    </>
  );
}

/** Skills as one selectable comma separated line. Icon-free and parser friendly. */
export function SkillsLine({ items }: { items: string[] }) {
  return <Text>{items.join(", ")}</Text>;
}

export function LanguageList({ items }: { items: CvLanguage[] }) {
  return (
    <>
      {items.map((entry, index) => (
        <Text key={index} style={{ marginBottom: 2 }}>
          {languageLine(entry)}
        </Text>
      ))}
    </>
  );
}

export function NameBlock({ personal }: { personal: CvPersonal }) {
  return (
    <View>
      <Text style={base.name}>{fullName(personal)}</Text>
      <Text style={base.headline}>{personal.headline}</Text>
      <Text style={base.contactLine}>{contactLines(personal).join("  |  ")}</Text>
    </View>
  );
}

export function PageNumber() {
  return (
    <Text
      style={base.pageNumber}
      render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : "")}
      fixed
    />
  );
}

export const HEADINGS = SECTION_HEADINGS;
