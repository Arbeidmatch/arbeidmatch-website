"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./explorer.module.css";

export default function ProjectVersion({ modern, children, initialOld = false }: { modern: ReactNode; children: ReactNode; initialOld?: boolean }) {
  const [old, setOld] = useState(initialOld);
  useEffect(() => {
    const sync = () => setOld(new URLSearchParams(location.search).get("view") === "old");
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const choose = (value: boolean) => {
    setOld(value);
    const url = new URL(location.href);
    if (value) url.searchParams.set("view", "old"); else url.searchParams.delete("view");
    history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };
  return <div className={styles.versionRoot}><div className={styles.version}><span>Prosjektvisning</span><div role="group" aria-label="Velg versjon"><button type="button" onClick={() => choose(false)} aria-pressed={!old}>Ny</button><button type="button" onClick={() => choose(true)} aria-pressed={old}>Old</button></div></div>{old ? children : modern}</div>;
}
