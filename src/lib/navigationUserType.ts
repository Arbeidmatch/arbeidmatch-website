/** localStorage key for dual nav (Navbar + mobile drawer). */
export const NAV_USER_TYPE_STORAGE_KEY = "userType";

export type NavigationUserType = "employer" | "candidate";

export function getNavigationUserType(): NavigationUserType | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(NAV_USER_TYPE_STORAGE_KEY);
    if (v === "employer" || v === "candidate") return v;
    const legacy = sessionStorage.getItem("roleSelected");
    if (legacy === "employer" || legacy === "candidate") {
      localStorage.setItem(NAV_USER_TYPE_STORAGE_KEY, legacy);
      sessionStorage.removeItem("roleSelected");
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setNavigationUserType(value: NavigationUserType | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) localStorage.removeItem(NAV_USER_TYPE_STORAGE_KEY);
    else localStorage.setItem(NAV_USER_TYPE_STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent("am-navigation-user-type"));
  } catch {
    /* ignore */
  }
}

/** Call after mutating `userType` in localStorage outside `setNavigationUserType` (e.g. welcome / home helpers). */
export function notifyNavigationUserTypeChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("am-navigation-user-type"));
}

export function subscribeNavigationUserType(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  const onStorage = (e: StorageEvent) => {
    if (e.key === NAV_USER_TYPE_STORAGE_KEY || e.key === null) onChange();
  };
  window.addEventListener("am-navigation-user-type", handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("am-navigation-user-type", handler);
    window.removeEventListener("storage", onStorage);
  };
}
