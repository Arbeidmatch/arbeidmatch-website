"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./explorer.module.css";

const KEY = "am-explorer-tour:v1";
function subscribe(notify: () => void) {
  window.addEventListener("am-explorer-tour", notify);
  return () => window.removeEventListener("am-explorer-tour", notify);
}
function snapshot() { try { return localStorage.getItem(KEY) === "done"; } catch { return false; } }
const serverSnapshot = () => true;

export default function ExplorerTour({ mobile, onView, onShowMap }: {
  mobile: boolean; onView: (view: "details" | "map") => void; onShowMap: () => void;
}) {
  const seen = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [override, setOverride] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const open = override ?? !seen;
  const steps = [
    { target: "domain", title: "Velg fagområde", text: "Trykk på feltet med Alle fagområder og velg faget du vil se. Antallet oppdateres, mens kartet blir på samme sted." },
    { target: mobile ? "mobile-project" : "projects", title: "Velg et prosjekt", text: mobile ? "Trykk på Velg prosjekt i det markerte feltet. Du kan også bruke Forrige og Neste under feltet." : "Trykk på et av de markerte prosjektkortene. Detaljene oppdateres, og kartet flytter seg til prosjektets område." },
    { target: "details", title: "Les prosjektdetaljene", text: "Se fase, verdi og fag i det markerte panelet. Med abonnement ser du også tilgjengelige prosjektnavn, aktører og dokumenter." },
    { target: "map", title: "Trykk på en kartboble", text: "Kartet er åpnet. Trykk på en farget boble: 1 betyr ett prosjekt, større tall betyr flere. Posisjonen viser et område, ikke en bekreftet byggeplass." },
    { target: "map", title: "Utforsk og finn tilbake", text: mobile ? "Dra med én finger for å flytte kartet, og bruk to fingre for å zoome. Trykk på Hele Norge for oversikten. Velg Detaljer over kartet for å gå tilbake." : "Rull med musen for å zoome, dra med venstre knapp for å flytte, og høyre knapp for å rotere. Trykk på Hele Norge for oversikten." },
  ];
  const target = steps[step].target;
  useEffect(() => {
    if (!open) return;
    const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    element?.classList.add(styles.tourTarget);
    if (step > 0) element?.scrollIntoView({ block: "center", behavior: "instant" });
    return () => element?.classList.remove(styles.tourTarget);
  }, [open, step, target]);
  function move(next: number) {
    onView(next >= 3 ? "map" : "details");
    if (next >= 3) onShowMap();
    setStep(next);
  }
  function close() {
    setOverride(false);
    try { localStorage.setItem(KEY, "done"); window.dispatchEvent(new Event("am-explorer-tour")); } catch { /* The guide can still be closed without storage. */ }
  }
  return <>
    <button type="button" className={styles.tourStart} onClick={() => { move(0); setOverride(true); }}>Vis veiledning</button>
    {open ? <aside className={styles.tour} aria-label="Trinnvis veiledning">
      <div aria-live="polite"><small>Trinn {step + 1} av {steps.length} · Følg den gule rammen</small><h3>{steps[step].title}</h3><p>{steps[step].text}</p></div>
      <div className={styles.tourActions}>
        <button type="button" onClick={close}>Lukk</button>
        {step > 0 ? <button type="button" onClick={() => move(step - 1)}>Tilbake</button> : null}
        <button type="button" onClick={() => step === steps.length - 1 ? close() : move(step + 1)}>{step === steps.length - 1 ? "Ferdig" : "Neste steg"}</button>
      </div>
    </aside> : null}
  </>;
}
