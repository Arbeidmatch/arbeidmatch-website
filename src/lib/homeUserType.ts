/** Homepage audience choice (localStorage). `browsing` = dismissed welcome without picking a role. */
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
  } catch {
    /* ignore */
  }
}

export function homeUserTypeIsUnset(): boolean {
  const v = readHomeUserType();
  return v !== "employer" && v !== "candidate" && v !== "browsing";
}
