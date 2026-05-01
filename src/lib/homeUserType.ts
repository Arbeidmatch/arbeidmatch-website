import { notifyNavigationUserTypeChanged } from "@/lib/navigationUserType";

/** Homepage audience choice (localStorage). `browsing` = dismissed welcome without picking a role. Same key as nav `userType`. */
export const HOME_USER_TYPE_KEY = "userType";

export type HomeUserTypeValue = "employer" | "candidate" | "browsing";

const SESSION_ROLE_KEY = "roleSelected";

export function readHomeUserType(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(HOME_USER_TYPE_KEY);
  } catch {
    return null;
  }
}

export function writeHomeUserType(value: HomeUserTypeValue): void {
  try {
    window.localStorage.setItem(HOME_USER_TYPE_KEY, value);
    if (value === "employer" || value === "candidate") {
      window.sessionStorage.setItem(SESSION_ROLE_KEY, value);
    }
    notifyNavigationUserTypeChanged();
  } catch {
    /* ignore */
  }
}

/** True when no explicit choice yet: missing key, empty, or unknown value. `browsing` counts as set (welcome dismissed). */
export function homeUserTypeIsUnset(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(HOME_USER_TYPE_KEY);
    const v = (raw ?? "").trim();
    if (v === "") return true;
    if (v === "employer" || v === "candidate" || v === "browsing") return false;
    return true;
  } catch {
    return true;
  }
}
