"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { addPasskey, listPasskeys, passkeysSupported, removePasskey } from "@/lib/min-side/passkey-browser";
import { passkeyLabel, type ListedPasskey } from "@/lib/min-side/passkey";
import { BTN_OUTLINE, INK, MUTED_L, RULE } from "./ui";

/**
 * "Logg inn uten e-post" in the Firma section (ORDER 228): one press adds a
 * passkey of this device to the person's Min side, and each device it was added
 * on is listed with "Fjern". A browser without passkeys sees nothing of it.
 */

const noop = () => () => undefined;

export function usePasskeysSupported(): boolean {
  return useSyncExternalStore(noop, passkeysSupported, () => false);
}

export default function MinSidePasskeys({ token }: { token: string }) {
  const supported = usePasskeysSupported();
  const [keys, setKeys] = useState<ListedPasskey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let live = true;
    void listPasskeys(token).then((list) => {
      if (live && list) setKeys(list);
    });
    return () => {
      live = false;
    };
  }, [supported, token]);

  if (!supported) return null;

  const add = async () => {
    setBusy(true);
    setError(null);
    setAdded(false);
    const r = await addPasskey(token);
    setBusy(false);
    if (r.ok) {
      setKeys(r.value);
      setAdded(true);
    } else if (!r.cancelled) setError(r.error);
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    setAdded(false);
    const r = await removePasskey(token, id);
    setBusy(false);
    if (r.ok) setKeys(r.value);
    else setError(r.error);
  };

  return (
    <div className={`flex flex-col gap-3 border-t ${RULE} pt-4`} data-testid="ms-passkeys">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[15px] font-semibold ${INK}`}>Logg inn uten e-post</p>
          <p className={`text-sm ${MUTED_L}`}>Bruk fingeravtrykk, ansikt eller PIN på denne enheten.</p>
        </div>
        <button type="button" className={BTN_OUTLINE} disabled={busy} onClick={add}>
          Legg til
        </button>
      </div>
      {keys.length ? (
        <ul className="flex flex-col gap-2">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-3">
              <span className={`min-w-0 break-words text-sm ${INK}`}>{passkeyLabel(k)}</span>
              <button type="button" className={BTN_OUTLINE} disabled={busy} onClick={() => remove(k.id)} aria-label={`Fjern ${passkeyLabel(k)}`}>
                Fjern
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {added ? (
        <p role="status" className="text-sm text-[#146C43]">
          Nøkkelen er lagt til.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
