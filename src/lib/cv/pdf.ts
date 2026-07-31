import "server-only";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
} from "pdf-lib";
import { cvDocumentSchema, cvFileName, fullName, type CvDocument } from "@/lib/cv/schema";
import { CV_TEMPLATES, CoverLetter } from "@/lib/cv/templates";
import { registerCvFonts } from "@/lib/cv/templates/shared";

export const CV_JSON_ATTACHMENT_NAME = "arbeidmatch-cv.json";
const XMP_NAMESPACE = "https://www.arbeidmatch.no/ns/cv/1.0/";
const CREATOR = "ArbeidMatch CV Generator";

export type CvPdfKind = "cv" | "cover_letter" | "combined";

export interface RenderedPdf {
  bytes: Uint8Array;
  fileName: string;
  kind: CvPdfKind;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildXmp(doc: CvDocument, json: string): string {
  const name = escapeXml(fullName(doc.personal));
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:am="${XMP_NAMESPACE}">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${name} - CV</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>${name}</rdf:li></rdf:Seq></dc:creator>
   <dc:language><rdf:Bag><rdf:li>en-US</rdf:li></rdf:Bag></dc:language>
   <xmp:CreatorTool>${CREATOR}</xmp:CreatorTool>
   <am:schemaVersion>1</am:schemaVersion>
   <am:templateId>${escapeXml(doc.templateId)}</am:templateId>
   <am:document>${escapeXml(json)}</am:document>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Metadata, the embedded JSON attachment and the XMP packet. Applied to every PDF we
 * hand out so our own ATS can read structured data instead of re-parsing the text layer.
 */
async function finalise(rawBytes: Uint8Array, doc: CvDocument, kind: CvPdfKind): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(rawBytes);
  const name = fullName(doc.personal);
  const label = kind === "cover_letter" ? "Cover letter" : "CV";

  pdf.setTitle(`${name} - ${label}`);
  pdf.setAuthor(name);
  pdf.setSubject(doc.personal.headline);
  pdf.setKeywords(doc.skills);
  pdf.setCreator(CREATOR);
  pdf.setProducer(CREATOR);

  // Document language, so assistive tech and parsers do not guess.
  pdf.catalog.set(PDFName.of("Lang"), PDFString.of("en-US"));

  const json = JSON.stringify(doc);
  const jsonBytes = new TextEncoder().encode(json);
  await pdf.attach(jsonBytes, CV_JSON_ATTACHMENT_NAME, {
    mimeType: "application/json",
    description: "Structured ArbeidMatch CV data",
  });

  const xmpBytes = new TextEncoder().encode(buildXmp(doc, json));
  const xmpStream = pdf.context.stream(xmpBytes, {
    Type: PDFName.of("Metadata"),
    Subtype: PDFName.of("XML"),
  });
  pdf.catalog.set(PDFName.of("Metadata"), pdf.context.register(xmpStream));

  return pdf.save({ useObjectStreams: false });
}

function assertValid(doc: CvDocument): CvDocument {
  return cvDocumentSchema.parse(doc);
}

/**
 * Every template returns a `Document`, but its props type is the CV payload rather
 * than `DocumentProps`, which is what `renderToBuffer` is typed against.
 */
function asPdfDocument(element: React.ReactElement): React.ReactElement<DocumentProps> {
  return element as React.ReactElement<DocumentProps>;
}

export async function renderCvPdf(input: CvDocument): Promise<RenderedPdf> {
  const doc = assertValid(input);
  registerCvFonts();
  const Template = CV_TEMPLATES[doc.templateId];
  const raw = await renderToBuffer(asPdfDocument(React.createElement(Template, { doc })));
  return {
    bytes: await finalise(new Uint8Array(raw), doc, "cv"),
    fileName: cvFileName(doc.personal, "cv"),
    kind: "cv",
  };
}

export async function renderCoverLetterPdf(input: CvDocument): Promise<RenderedPdf | null> {
  const doc = assertValid(input);
  if (!doc.coverLetter) return null;
  registerCvFonts();
  const raw = await renderToBuffer(asPdfDocument(React.createElement(CoverLetter, { doc })));
  return {
    bytes: await finalise(new Uint8Array(raw), doc, "cover_letter"),
    fileName: cvFileName(doc.personal, "cover_letter"),
    kind: "cover_letter",
  };
}

/** CV first, cover letter appended. Offered as an option in the last builder step. */
export async function renderCombinedPdf(input: CvDocument): Promise<RenderedPdf> {
  const doc = assertValid(input);
  const cv = await renderCvPdf(doc);
  const letter = await renderCoverLetterPdf(doc);
  if (!letter) return cv;

  const merged = await PDFDocument.create();
  for (const source of [cv.bytes, letter.bytes]) {
    const loaded = await PDFDocument.load(source);
    const pages = await merged.copyPages(loaded, loaded.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  return {
    bytes: await finalise(await merged.save({ useObjectStreams: false }), doc, "combined"),
    fileName: cvFileName(doc.personal, "combined"),
    kind: "combined",
  };
}

/** Reads the embedded JSON back out. Used by the parsability test and by ATS ingestion. */
export async function extractEmbeddedCvJson(bytes: Uint8Array): Promise<CvDocument | null> {
  const pdf = await PDFDocument.load(bytes);

  const names = pdf.catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
  const embeddedFiles = names?.lookupMaybe(PDFName.of("EmbeddedFiles"), PDFDict);
  const entries = embeddedFiles?.lookupMaybe(PDFName.of("Names"), PDFArray);
  if (!entries) return null;

  // The array alternates name, file specification.
  for (let i = 0; i + 1 < entries.size(); i += 2) {
    const key = entries.lookup(i);
    if (!(key instanceof PDFString) && !(key instanceof PDFHexString)) continue;
    if (key.decodeText() !== CV_JSON_ATTACHMENT_NAME) continue;

    const fileSpec = entries.lookupMaybe(i + 1, PDFDict);
    const embeddedFile = fileSpec?.lookupMaybe(PDFName.of("EF"), PDFDict);
    const stream = embeddedFile?.lookup(PDFName.of("F"));
    if (stream instanceof PDFRawStream) {
      // The attachment is Flate compressed, so decode before reading it back.
      const decoded = decodePDFRawStream(stream).decode();
      return JSON.parse(new TextDecoder().decode(decoded)) as CvDocument;
    }
  }
  return null;
}
