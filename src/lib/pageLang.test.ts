import { describe, expect, it } from "vitest";

import { langDetectSource, langForPath, pageLangInlineScript } from "@/lib/pageLang";

const CASES: Array<[string, string]> = [
  ["/", "nb"],
  ["/jobs", "en"],
  ["/for-candidates", "en"],
  ["/premium", "en"],
  ["/candidate-request", "en"],
  ["/stilling/some-job", "en"],
  ["/request/1f0e9c7a-0000-4000-8000-000000000000", "en"],
  ["/no", "nb"],
  ["/for-employers", "nb"],
  ["/for-employers/", "nb"],
  ["/request", "nb"],
  ["/contact", "nb"],
  ["/bemanning-bygg-anlegg", "nb"],
  ["/bemanningsbyrå-bergen", "nb"],
  ["/bemanningsbyr%C3%A5-bergen", "nb"],
  ["/flislegger/personvern", "nb"],
  ["/annonse/ny", "nb"],
  ["/unsubscribe", "nb"],
  ["/ro", "ro"],
  ["/pl", "pl"],
  ["/en", "en"],
  ["/nothing-like-no", "en"],
];

describe("langForPath", () => {
  it.each(CASES)("%s is %s", (path, lang) => {
    expect(langForPath(path)).toBe(lang);
  });
});

describe("the inline head script", () => {
  it("decides exactly as langForPath does", () => {
    // eslint-disable-next-line no-new-func
    const detect = new Function(`return (${langDetectSource()})`)() as (p: string) => string;
    for (const [path] of CASES) expect(detect(path)).toBe(langForPath(path));
  });

  it("is a self-contained statement", () => {
    const script = pageLangInlineScript();
    expect(script.startsWith("(function(){")).toBe(true);
    expect(script).not.toMatch(new RegExp("[\\u2013\\u2014]"));
  });
});
