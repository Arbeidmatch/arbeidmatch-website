/**
 * The small helper that teaches how to move the map, chosen by device.
 *
 * The map never takes the page's own gestures: one finger scrolls the page on
 * a phone, and a plain mouse wheel scrolls the page until the visitor has
 * clicked into the map. So a visitor who tries the page gesture on the map is
 * told the map's, and a visitor who has not moved the map at all is told once.
 */

export type HintDevice = "touch" | "mouse";
export type HintReason = "idle" | "one-finger" | "wheel";
export type HintArt = "two-fingers" | "ctrl-wheel" | "drag";

export type MapHint = { title: string; text: string; art: HintArt; modifier: "Ctrl" | "Cmd" };

/** The key in localStorage that remembers the idle hint was shown. */
export const HINT_SEEN_KEY = "am-prosjektkart-hint-v1";
/** How long the map is in view, unmoved, before the idle hint. */
export const HINT_IDLE_MS = 6000;
/** How long a hint caused by a gesture stays after the last such gesture. */
export const HINT_FLASH_MS = 2600;

/**
 * The hint for a device and what prompted it. A mouse that has not touched
 * the map is taught to drag only once it is zoomed in: at the whole country
 * there is nothing to drag to, so it is taught to zoom first.
 */
export function hintFor(device: HintDevice, reason: HintReason, mac = false, zoomedIn = false): MapHint {
  const key = mac ? "Cmd" : "Ctrl";
  if (device === "touch") {
    return {
      title: "Bruk to fingre for å flytte kartet",
      text: "Knip for å zoome. Med én finger ruller du siden.",
      art: "two-fingers",
      modifier: key,
    };
  }
  if (reason === "wheel") {
    return { title: `Hold ${key} og rull for å zoome`, text: "Dra for å flytte kartet.", art: "ctrl-wheel", modifier: key };
  }
  if (!zoomedIn) {
    return { title: `Hold ${key} og rull for å zoome`, text: "Dra deretter for å flytte kartet.", art: "ctrl-wheel", modifier: key };
  }
  return { title: "Dra for å flytte kartet", text: `Hold ${key} og rull for å zoome.`, art: "drag", modifier: key };
}

/** Whether a wheel over the map zooms it. Otherwise the page scrolls and the hint may show. */
export function wheelZooms(e: { ctrlKey: boolean; metaKey: boolean }, engaged: boolean): boolean {
  return e.ctrlKey || e.metaKey || engaged;
}

/** The device to teach, from what the browser reports: a coarse pointer without hover is a finger. */
export function deviceFrom(coarse: boolean, hover: boolean): HintDevice {
  return coarse && !hover ? "touch" : "mouse";
}

export function isMacPlatform(platform: string | undefined | null): boolean {
  return /mac|iphone|ipad|ipod/i.test(String(platform ?? ""));
}
