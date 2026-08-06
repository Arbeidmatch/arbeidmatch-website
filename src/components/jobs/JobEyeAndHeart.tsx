"use client";

import { useEffect, useState } from "react";

/**
 * How many looked, and how many liked it, on the website's cards.
 *
 * He asked for both on 6 August 2026: an eye with the view count above the apply button
 * and a heart that counts one press each. The count lives on the job in the ATS, so the
 * press posts there; this component is the same idea as the one in the ATS and stays a
 * separate file because the two repositories share no code.
 *
 * ONE PRESS PER BROWSER, remembered in `localStorage` and honest about being warm rather
 * than exact. Identifying visitors so a heart could be perfect is a consent question we
 * are not opening for a number nobody decides on.
 *
 * Inline SVG rather than an icon package: this repository does not carry one, and two
 * shapes are not worth a dependency.
 */
export function JobEyeAndHeart({
  jobId,
  views,
  likes,
  atsBaseUrl,
}: {
  jobId: string;
  views: number | null;
  likes: number | null;
  atsBaseUrl: string;
}) {
  const key = `am_liked_job_${jobId}`;
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number>(Number(likes) || 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setLiked(window.localStorage.getItem(key) === "1");
    } catch {
      /* storage off: they get to press again, which is a better failure than a dead heart */
    }
  }, [key]);

  async function press() {
    if (liked || busy) return;
    setBusy(true);
    setLiked(true);
    setCount((n) => n + 1);
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      /* nothing to do */
    }
    try {
      const res = await fetch(`${atsBaseUrl.replace(/\/$/, "")}/api/public/jobs/${encodeURIComponent(jobId)}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json().catch(() => null)) as { likes?: number } | null;
      if (typeof body?.likes === "number") setCount(body.likes);
    } catch {
      setLiked(false);
      setCount((n) => Math.max(0, n - 1));
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* nothing to do */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-3 text-xs text-text-secondary">
      {typeof views === "number" && views > 0 ? (
        <span className="inline-flex items-center gap-1" title="Views">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="tabular-nums">{views}</span>
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void press()}
        aria-pressed={liked}
        aria-label={liked ? "You liked this job" : "Like this job"}
        className="inline-flex items-center gap-1"
        style={{ color: liked ? "#e11d48" : undefined }}
      >
        <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
          <path d="M12 20s-7-4.3-7-9.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 7 3.7c0 5-7 9.3-7 9.3Z" />
        </svg>
        {count > 0 ? <span className="tabular-nums">{count}</span> : null}
      </button>
    </div>
  );
}
