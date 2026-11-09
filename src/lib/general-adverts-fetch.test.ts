import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { advertBlocks } = await import("./general-adverts-fetch");

describe("the general advert's body as blocks (ORDER 253)", () => {
  it("headings, lists and paragraphs; the title line left to the page", () => {
    const body = ["We are looking for electricians in Trøndelag, Norway", "", "ABOUT THE JOB", "", "We recruit.", "", "WE OFFER:", "", "- Pay by experience", "- Housing help", "", "Register with ArbeidMatch: https://www.arbeidmatch.no/register/x?ga=1"].join("\n");
    expect(advertBlocks(body)).toEqual([
      { kind: "h", text: "ABOUT THE JOB" },
      { kind: "p", text: "We recruit." },
      { kind: "h", text: "WE OFFER" },
      { kind: "ul", items: ["Pay by experience", "Housing help"] },
      { kind: "p", text: "Register with ArbeidMatch: https://www.arbeidmatch.no/register/x?ga=1" },
    ]);
  });

  it("Norwegian headings with Ø and Å stay headings", () => {
    expect(advertBlocks("t\nETTERSPØRSEL NÅ:\nSLIK REGISTRERER DU DEG:")).toEqual([
      { kind: "h", text: "ETTERSPØRSEL NÅ" },
      { kind: "h", text: "SLIK REGISTRERER DU DEG" },
    ]);
  });
});
