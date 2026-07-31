import { describe, expect, it } from "vitest";
import { TEMPLATE_IDS } from "@/lib/cv/schema";
import { SAMPLE_CV, DIACRITICS_PROBE } from "@/lib/cv/fixtures/sample-cv";
import { checkTemplateParsability, normaliseExtracted } from "@/lib/cv/parsability";
import { renderCoverLetterPdf, renderCvPdf } from "@/lib/cv/pdf";

describe("CV templates are machine parseable", () => {
  for (const templateId of TEMPLATE_IDS) {
    it(`${templateId} passes every parsability rule`, async () => {
      const result = await checkTemplateParsability(templateId);
      expect(result.failures).toEqual([]);
      expect(result.pageCount).toBeLessThanOrEqual(2);
    });
  }
});

describe("PDF output details", () => {
  it("renders Romanian and Norwegian characters as real text", async () => {
    const doc = {
      ...SAMPLE_CV,
      personal: { ...SAMPLE_CV.personal, headline: `Tiler ${DIACRITICS_PROBE}`.slice(0, 60) },
    };
    const result = await checkTemplateParsability("classic-linear", doc);
    expect(result.failures).toEqual([]);
    expect(result.text).toContain(normaliseExtracted(DIACRITICS_PROBE));
  });

  it("names the CV file after the candidate", async () => {
    const rendered = await renderCvPdf(SAMPLE_CV);
    expect(rendered.fileName).toBe("POPA_Alex_CV.pdf");
  });

  it("exports the cover letter as its own file", async () => {
    const rendered = await renderCoverLetterPdf(SAMPLE_CV);
    expect(rendered).not.toBeNull();
    expect(rendered?.fileName).toBe("POPA_Alex_CoverLetter.pdf");
  });
});
