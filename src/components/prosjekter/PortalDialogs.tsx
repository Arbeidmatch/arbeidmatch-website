"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";

import { DIALOG_META, dialogForLink, dialogFromHash, hashFor, type PortalDialog } from "@/lib/prosjekter/dialogs";

/**
 * The portal's forms, reachable from any page by a hash: a link to #tilgang
 * opens "Be om tilgang", a link to #logg-inn opens "Logg inn", over the page
 * the visitor is on. Mounted once in the root layout.
 *
 * The address carries the open dialog (so /prosjekter#tilgang in an e-mail
 * opens it), changed with history.replaceState so nothing scrolls. The dialog
 * and the forms are loaded only when one opens.
 */

const Loading = () => <p style={{ margin: 0, color: "#8792a6", fontSize: 14 }}>Laster ...</p>;
const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });
const AccessForm = dynamic(() => import("@/components/prosjekter/AccessForm"), { ssr: false, loading: Loading });
const LoginForm = dynamic(() => import("@/components/prosjekter/LoginForm"), { ssr: false, loading: Loading });

const CHANGED = "am-portal-dialog";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

const readHash = () => window.location.hash;
const serverHash = () => "";

/** Put a hash on the address (or take it off) without a scroll or a new history entry. */
function setHash(hash: string) {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, "", `${pathname}${search}${hash}`);
  window.dispatchEvent(new Event(CHANGED));
}

export default function PortalDialogs() {
  // Read again on every client navigation: a link to /prosjekter#tilgang from another page opens it on arrival.
  usePathname();
  const dialog = dialogFromHash(useSyncExternalStore(subscribe, readHash, serverHash));

  const open = useCallback((d: PortalDialog) => setHash(hashFor(d)), []);
  const close = useCallback(() => setHash(""), []);

  // A link to this page's #tilgang or #logg-inn opens the dialog in place, whatever renders it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a) return;
      const target = a.getAttribute("target");
      if (target && target !== "_self") return;
      const d = dialogForLink(a.getAttribute("href"), window.location.pathname, window.location.origin);
      if (!d) return;
      e.preventDefault();
      open(d);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open]);

  if (!dialog) return null;
  const meta = DIALOG_META[dialog];
  return (
    <PortalModal title={meta.title} size={meta.size} onClose={close}>
      {dialog === "tilgang" ? <AccessForm onClose={close} /> : <LoginForm />}
    </PortalModal>
  );
}
