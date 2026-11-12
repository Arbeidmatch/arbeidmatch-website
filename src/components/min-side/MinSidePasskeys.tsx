"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { addPasskey, listPasskeys, passkeysSupported, removePasskey } from "@/lib/min-side/passkey-browser";
import { passkeyLabel, type ListedPasskey } from "@/lib/min-side/passkey";
import { BODY, GREY, GROUP, GROUP_HEAD, NAVY, PILL, ROW, SMALL } from "./ios";

/**
 * "Logg inn uten e-post" (ORDER 228): one press adds a passkey of this device
 * to the person's Min side, and each device it was added on is listed with
 * "Fjern". A browser without passkeys sees nothing of it. ORDER 273 moved it
 * out of Firma into its own section, Innlogging, as iOS rows.
 */

const noop = () => () => undefined;

export function usePasskeysSupported(): boolean {
  return useSyncExternalStore(noop, passkeysSupported, () => false);
}

export default function MinSidePasskeys({ token, onCount }: { token: string; onCount?: (n: number) => void }) {
  const supported = usePasskeysSupported();
  const [keys, setKeys] = useState<ListedPasskey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let live = true;
    void listPasskeys(token).then((list) => {
      if (live && list) {
        setKeys(list);
        onCount?.(list.length);
      }
    });
    return () => {
      live = false;
    };
    // onCount is the caller's setter; the list is fetched once per token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, token]);

  if (!supported) return <p className={`px-4 ${BODY} ${GREY}`}>Denne nettleseren kan ikke lagre en nøkkel. Dere logger inn med lenken på e-post.</p>;

  const add = async () => {
    setBusy(true);
    setError(null);
    setAdded(false);
    const r = await addPasskey(token);
    setBusy(false);
    if (r.ok) {
      setKeys(r.value);
      onCount?.(r.value.length);
      setAdded(true);
    } else if (!r.cancelled) setError(r.error);
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    setAdded(false);
    const r = await removePasskey(token, id);
    setBusy(false);
    if (r.ok) {
      setKeys(r.value);
      onCount?.(r.value.length);
    } else setError(r.error);
  };

  return (
    <div className="flex flex-col" data-testid="ms-passkeys">
      <p className={GROUP_HEAD}>Sikkerhetsnøkkel</p>
      <div className={GROUP}>
        {keys.length === 0 ? (
          <div className={ROW}>
            <span className={`min-w-0 flex-1 ${BODY} ${NAVY}`}>Passkey ikke aktivert</span>
          </div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className={ROW}>
              <span className={`min-w-0 flex-1 break-words ${BODY} ${NAVY}`}>{passkeyLabel(k)}</span>
              <button type="button" className={`${PILL} md:min-h-[2rem]`} disabled={busy} onClick={() => remove(k.id)} aria-label={`Fjern ${passkeyLabel(k)}`}>
                Fjern
              </button>
            </div>
          ))
        )}
        <div className={ROW}>
          <span className={`min-w-0 flex-1 ${SMALL} ${GREY}`}>Fingeravtrykk, ansikt eller PIN på denne enheten.</span>
          <button type="button" className={`${PILL} md:min-h-[2rem]`} disabled={busy} onClick={add}>
            {keys.length ? "Legg til" : "Lagre nøkkel"}
          </button>
        </div>
      </div>
      {added ? (
        <p role="status" className={`px-4 pt-1.5 ${SMALL} text-[#146C43]`}>
          Nøkkelen er lagret.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className={`px-4 pt-1.5 ${SMALL} text-[#C4231A]`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
