import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(process.cwd(), "src/components/min-side/MinSideClient.tsx"), "utf8");
const form = source.slice(source.indexOf("function StaffingForm"));

describe("ORDER 498: the request form's buttons", () => {
  it("are 160 x 44, the same for both, never full width", () => {
    expect(source).toMatch(/const REQUEST_BUTTON = "[^"]*\bh-11\b[^"]*\bw-40\b/);
    expect(source).not.toMatch(/const REQUEST_BUTTON = "[^"]*\bw-full\b/);
    expect(form).toContain("className={REQUEST_SEND}");
    expect(form).toContain("className={REQUEST_CANCEL}");
  });

  it("send is the short label, since the dialog title says what is sent", () => {
    expect(form).toContain('{busy ? "Sender ..." : "Send"}');
    expect(form).not.toContain('"Send forespørselen"');
  });
});
