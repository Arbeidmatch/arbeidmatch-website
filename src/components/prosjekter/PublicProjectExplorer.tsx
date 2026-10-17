"use client";

import { useEffect, useMemo, useState } from "react";
import { publicExplorer, subscriberExplorer } from "@/lib/prosjekter/explorer";
import { isOverview, type Overview } from "@/lib/prosjekter/types";
import type { AlertProject } from "@/lib/prosjekter/format";
import ProjectExplorer from "./ProjectExplorer";

export default function PublicProjectExplorer({ initial, subscriberProjects }: { initial?: Overview | null; subscriberProjects?: AlertProject[] }) {
  const [data, setData] = useState(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (initial) return;
    const controller = new AbortController();
    fetch("/api/prosjekter/overview", { signal: controller.signal }).then(async r => {
      const value: unknown = await r.json();
      if (!r.ok || !isOverview(value)) throw new Error("overview unavailable");
      setData(value);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [initial]);
  const projects = useMemo(() => subscriberProjects ? subscriberExplorer(subscriberProjects, data) : publicExplorer(data), [data, subscriberProjects]);
  return <ProjectExplorer projects={projects} syncFiltersToUrl={!subscriberProjects} subscriber={Boolean(subscriberProjects)} loading={!subscriberProjects && loading} failed={!subscriberProjects && failed} />;
}
