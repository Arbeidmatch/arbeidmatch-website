import { describe, expect, it } from "vitest";

import { appStateFrom, decideAppPrompt, platformOf, visitPopupDelay, type DeviceFacts } from "./app-prompt";

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const phone = (userAgent: string, over: Partial<DeviceFacts> = {}): DeviceFacts => ({
  userAgent,
  coarsePointer: true,
  width: 390,
  standalone: false,
  referrer: "",
  relatedAppInstalled: false,
  ...over,
});
const app = { play_live: false, prompt_hidden: false, read_only: false };

describe("the Forsprang install prompt (ORDER 272)", () => {
  it("an Android phone gets the Android sheet, the browser install until Play is live", () => {
    expect(decideAppPrompt(phone(ANDROID), app, null)).toEqual({ sheet: "android", primary: "install" });
    expect(decideAppPrompt(phone(ANDROID), { ...app, play_live: true }, null)).toEqual({ sheet: "android", primary: "play" });
  });

  it("an iPhone gets the Add to Home Screen steps", () => {
    expect(decideAppPrompt(phone(IPHONE), app, null)?.sheet).toBe("ios");
  });

  it("a desktop gets nothing, also at a narrow window or with an Android UA but a mouse", () => {
    expect(decideAppPrompt(phone(DESKTOP, { coarsePointer: false, width: 1440 }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(DESKTOP, { coarsePointer: false, width: 390 }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(ANDROID, { coarsePointer: false }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(ANDROID, { width: 1024 }), app, null)).toBeNull();
  });

  it("never where the app or a home-screen icon opened the page", () => {
    expect(decideAppPrompt(phone(ANDROID, { standalone: true }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(ANDROID, { referrer: "android-app://no.arbeidmatch.forsprang/" }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(ANDROID, { relatedAppInstalled: true }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(IPHONE, { navigatorStandalone: true }), app, null)).toBeNull();
    expect(decideAppPrompt(phone(`${ANDROID} ForsprangApp/1.0.1`), { ...app, play_live: true }, null)).toBeNull();
  });

  it("not within thirty days of Senere (the ATS says so), and not from an older ATS", () => {
    expect(decideAppPrompt(phone(ANDROID), { ...app, prompt_hidden: true }, null)).toBeNull();
    expect(decideAppPrompt(phone(ANDROID), null, null)).toBeNull();
    expect(appStateFrom(undefined)).toBeNull();
    expect(appStateFrom({ play_live: "true", prompt_hidden: 1 })).toEqual({ play_live: false, prompt_hidden: false, read_only: false });
  });

  it("one window per visit: nothing once another has opened, and it waits behind the key dialog", () => {
    expect(decideAppPrompt(phone(ANDROID), app, "key_dialog")).toBeNull();
    expect(decideAppPrompt(phone(ANDROID), app, "install_app")).toBeNull();
    expect(decideAppPrompt(phone(ANDROID), app, "recommendation")).toBeNull();
    expect(visitPopupDelay("key_dialog")).toBeLessThan(visitPopupDelay("install_app"));
    expect(visitPopupDelay("install_app")).toBeLessThan(visitPopupDelay("recommendation"));
  });

  it("knows an iPad by its touch points", () => {
    expect(platformOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("ios");
    expect(platformOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBeNull();
  });
});
