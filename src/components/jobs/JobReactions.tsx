"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, ThumbsDown, ThumbsUp } from "lucide-react";

type Counts = { likes: number; dislikes: number; views: number };
type FieldCounts = Record<"salary" | "location" | "rotation" | "contract_type", Record<"happy" | "neutral" | "concerned", number>>;
type UserState = {
  reaction: "like" | "dislike" | null;
  fieldReactions: Partial<Record<"salary" | "location" | "rotation" | "contract_type", "happy" | "neutral" | "concerned" | null>>;
};

function useAnimatedNumber(target: number, duration = 300): number {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const from = value;
    const delta = target - from;
    if (delta === 0) return;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(from + delta * t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

function getCandidateEmail(): string | null {
  try {
    const email = (window.localStorage.getItem("am_candidate_profile_email") || "").trim().toLowerCase();
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

function getViewerId(): string {
  try {
    const key = "am_job_reaction_viewer_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return "anonymous-viewer";
  }
}

export default function JobReactions({ jobId }: { jobId: string }) {
  const [counts, setCounts] = useState<Counts>({ likes: 0, dislikes: 0, views: 0 });
  const [fieldCounts, setFieldCounts] = useState<FieldCounts>({
    salary: { happy: 0, neutral: 0, concerned: 0 },
    location: { happy: 0, neutral: 0, concerned: 0 },
    rotation: { happy: 0, neutral: 0, concerned: 0 },
    contract_type: { happy: 0, neutral: 0, concerned: 0 },
  });
  const [user, setUser] = useState<UserState>({ reaction: null, fieldReactions: {} });
  const [candidateEmail, setCandidateEmail] = useState<string | null>(null);

  const likes = useAnimatedNumber(counts.likes);
  const dislikes = useAnimatedNumber(counts.dislikes);
  const views = useAnimatedNumber(counts.views);

  const headers = useMemo(() => {
    const h: HeadersInit = {};
    if (candidateEmail) h["x-candidate-email"] = candidateEmail;
    return h;
  }, [candidateEmail]);

  useEffect(() => {
    setCandidateEmail(getCandidateEmail());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/jobs/reactions?job_id=${encodeURIComponent(jobId)}`, { headers });
      const data = (await res.json().catch(() => ({}))) as { counts?: Counts; fieldCounts?: FieldCounts; user?: UserState };
      if (cancelled) return;
      if (data.counts) setCounts(data.counts);
      if (data.fieldCounts) setFieldCounts(data.fieldCounts);
      if (data.user) setUser(data.user);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [headers, jobId]);

  useEffect(() => {
    const key = `am_job_viewed_${jobId}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    void fetch("/api/jobs/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-viewer-id": getViewerId() },
      body: JSON.stringify({ job_id: jobId, action: "view" }),
    }).then(async (r) => {
      const data = (await r.json().catch(() => ({}))) as { counts?: Counts; fieldCounts?: FieldCounts };
      if (data.counts) setCounts(data.counts);
      if (data.fieldCounts) setFieldCounts(data.fieldCounts);
    });
  }, [jobId]);

  const submitJobReaction = async (reaction: "like" | "dislike") => {
    const email = getCandidateEmail();
    if (!email) return;
    setCandidateEmail(email);
    const res = await fetch("/api/jobs/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-candidate-email": email },
      body: JSON.stringify({ job_id: jobId, action: "job_reaction", reaction, premium_only_reactions: false }),
    });
    const data = (await res.json().catch(() => ({}))) as { counts?: Counts; fieldCounts?: FieldCounts; user?: UserState };
    if (data.counts) setCounts(data.counts);
    if (data.fieldCounts) setFieldCounts(data.fieldCounts);
    if (data.user) setUser(data.user);
  };

  const submitFieldReaction = async (
    fieldKey: "salary" | "location" | "rotation" | "contract_type",
    fieldReaction: "happy" | "neutral" | "concerned",
  ) => {
    const email = getCandidateEmail();
    if (!email) return;
    setCandidateEmail(email);
    const res = await fetch("/api/jobs/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-candidate-email": email },
      body: JSON.stringify({
        job_id: jobId,
        action: "field_reaction",
        field_key: fieldKey,
        field_reaction: fieldReaction,
        premium_only_reactions: false,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { counts?: Counts; fieldCounts?: FieldCounts; user?: UserState };
    if (data.counts) setCounts(data.counts);
    if (data.fieldCounts) setFieldCounts(data.fieldCounts);
    if (data.user) setUser(data.user);
  };

  return (
    <>
      <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
        <button
          type="button"
          onClick={() => void submitJobReaction("like")}
          className={`inline-flex items-center gap-1.5 transition-colors hover:text-white/80 ${user.reaction === "like" ? "text-white/80" : ""}`}
        >
          <ThumbsUp className="h-4 w-4" />
          <AnimatedCount value={likes} />
        </button>
        <button
          type="button"
          onClick={() => void submitJobReaction("dislike")}
          className={`inline-flex items-center gap-1.5 transition-colors hover:text-white/80 ${
            user.reaction === "dislike" ? "text-white/80" : ""
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
          <AnimatedCount value={dislikes} />
        </button>
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          <AnimatedCount value={views} />
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/55 sm:grid-cols-4">
        <FieldMicro
          label="Salary"
          fieldKey="salary"
          counts={fieldCounts.salary}
          active={user.fieldReactions.salary ?? null}
          onReact={submitFieldReaction}
        />
        <FieldMicro
          label="Location"
          fieldKey="location"
          counts={fieldCounts.location}
          active={user.fieldReactions.location ?? null}
          onReact={submitFieldReaction}
        />
        <FieldMicro
          label="Rotation"
          fieldKey="rotation"
          counts={fieldCounts.rotation}
          active={user.fieldReactions.rotation ?? null}
          onReact={submitFieldReaction}
        />
        <FieldMicro
          label="Contract"
          fieldKey="contract_type"
          counts={fieldCounts.contract_type}
          active={user.fieldReactions.contract_type ?? null}
          onReact={submitFieldReaction}
        />
      </div>
    </>
  );
}

function AnimatedCount({ value }: { value: number }) {
  return <span>{value}</span>;
}

function FieldMicro({
  label,
  fieldKey,
  counts,
  active,
  onReact,
}: {
  label: string;
  fieldKey: "salary" | "location" | "rotation" | "contract_type";
  counts: Record<"happy" | "neutral" | "concerned", number>;
  active: "happy" | "neutral" | "concerned" | null;
  onReact: (
    fieldKey: "salary" | "location" | "rotation" | "contract_type",
    fieldReaction: "happy" | "neutral" | "concerned",
  ) => Promise<void>;
}) {
  const happy = useAnimatedNumber(counts.happy);
  const neutral = useAnimatedNumber(counts.neutral);
  const concerned = useAnimatedNumber(counts.concerned);
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-white/45">{label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onReact(fieldKey, "happy")}
          className={`inline-flex items-center gap-1 hover:text-white/80 ${active === "happy" ? "text-white/80" : ""}`}
          aria-label={`${label} happy`}
        >
          <span>😊</span>
          <span>{happy}</span>
        </button>
        <button
          type="button"
          onClick={() => void onReact(fieldKey, "neutral")}
          className={`inline-flex items-center gap-1 hover:text-white/80 ${active === "neutral" ? "text-white/80" : ""}`}
          aria-label={`${label} neutral`}
        >
          <span>😐</span>
          <span>{neutral}</span>
        </button>
        <button
          type="button"
          onClick={() => void onReact(fieldKey, "concerned")}
          className={`inline-flex items-center gap-1 hover:text-white/80 ${active === "concerned" ? "text-white/80" : ""}`}
          aria-label={`${label} concerned`}
        >
          <span>😕</span>
          <span>{concerned}</span>
        </button>
      </div>
    </div>
  );
}
