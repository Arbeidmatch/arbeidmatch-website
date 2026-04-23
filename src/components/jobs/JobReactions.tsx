"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, ThumbsDown, ThumbsUp } from "lucide-react";

type FieldKey = "salary" | "location" | "rotation";
type FieldFeeling = "happy" | "neutral" | "sad";
type FieldCounts = Record<FieldKey, Record<FieldFeeling, number>>;
type ApiResponse = {
  likes: number;
  dislikes: number;
  field_reactions: FieldCounts;
  user_reaction: "like" | "dislike" | null;
  user_field_reactions: Partial<Record<FieldKey, FieldFeeling>>;
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

function emptyFieldCounts(): FieldCounts {
  return {
    salary: { happy: 0, neutral: 0, sad: 0 },
    location: { happy: 0, neutral: 0, sad: 0 },
    rotation: { happy: 0, neutral: 0, sad: 0 },
  };
}

export default function JobReactions({
  jobId,
  viewCount = 0,
  variant = "card",
}: {
  jobId: string;
  viewCount?: number;
  variant?: "card" | "detail";
}) {
  const [likesRaw, setLikesRaw] = useState(0);
  const [dislikesRaw, setDislikesRaw] = useState(0);
  const [viewsRaw, setViewsRaw] = useState(Math.max(0, viewCount));
  const [fieldCounts, setFieldCounts] = useState<FieldCounts>(emptyFieldCounts());
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [userFieldReactions, setUserFieldReactions] = useState<Partial<Record<FieldKey, FieldFeeling>>>({});
  const [candidateEmail, setCandidateEmail] = useState<string | null>(null);

  const likes = useAnimatedNumber(likesRaw);
  const dislikes = useAnimatedNumber(dislikesRaw);
  const views = useAnimatedNumber(viewsRaw);

  useEffect(() => {
    setCandidateEmail(getCandidateEmail());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const params = new URLSearchParams({ job_id: jobId });
      if (candidateEmail) params.set("candidate_email", candidateEmail);
      const res = await fetch(`/api/jobs/reactions?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as Partial<ApiResponse>;
      if (cancelled) return;
      setLikesRaw(Number(data.likes ?? 0));
      setDislikesRaw(Number(data.dislikes ?? 0));
      if (data.field_reactions) setFieldCounts(data.field_reactions);
      setUserReaction(data.user_reaction ?? null);
      setUserFieldReactions(data.user_field_reactions ?? {});
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [candidateEmail, jobId]);

  useEffect(() => {
    if (variant !== "detail") return;
    const key = `am_job_viewed_${jobId}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    void fetch(`/api/jobs/${jobId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_email: candidateEmail ?? undefined }),
    }).then(async (res) => {
      const data = (await res.json().catch(() => ({}))) as { view_count?: number };
      if (typeof data.view_count === "number") {
        setViewsRaw(data.view_count);
      }
    });
  }, [candidateEmail, jobId, variant]);

  const submitReaction = async (nextReactionType: "like" | "dislike", nextFieldReactions?: Partial<Record<FieldKey, FieldFeeling>>) => {
    const email = candidateEmail ?? getCandidateEmail();
    if (!email) return;
    setCandidateEmail(email);
    const res = await fetch("/api/jobs/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        reaction_type: nextReactionType,
        field_reactions: nextFieldReactions ?? userFieldReactions,
        candidate_email: email,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<ApiResponse>;
    setLikesRaw(Number(data.likes ?? likesRaw));
    setDislikesRaw(Number(data.dislikes ?? dislikesRaw));
    if (data.field_reactions) setFieldCounts(data.field_reactions);
    setUserReaction(data.user_reaction ?? null);
    setUserFieldReactions(data.user_field_reactions ?? {});
  };

  const submitFieldReaction = async (fieldKey: FieldKey, fieldFeeling: FieldFeeling) => {
    if (!candidateEmail) return;
    const next = { ...userFieldReactions, [fieldKey]: fieldFeeling };
    await submitReaction(userReaction ?? "like", next);
  };

  const reactTooltip = candidateEmail ? "React to this job (registered candidates only)" : "Create a profile to react";

  if (variant === "card") {
    return (
      <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-[14px] w-[14px]" />
          <AnimatedCount value={views} />
        </span>
        <button
          type="button"
          title="React to this job (registered candidates only)"
          onClick={() => void submitReaction("like")}
          className={`inline-flex items-center gap-1 transition-colors hover:text-white/70 ${userReaction === "like" ? "text-[#C9A84C]" : ""}`}
        >
          <ThumbsUp className="h-[14px] w-[14px]" />
          <AnimatedCount value={likes} />
        </button>
        <button
          type="button"
          title="React to this job (registered candidates only)"
          onClick={() => void submitReaction("dislike")}
          className={`inline-flex items-center gap-1 transition-colors hover:text-white/70 ${userReaction === "dislike" ? "text-[#C9A84C]" : ""}`}
        >
          <ThumbsDown className="h-[14px] w-[14px]" />
          <AnimatedCount value={dislikes} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-white">
          <Eye className="h-5 w-5 animate-pulse text-[#C9A84C]" />
          <span className="text-base font-semibold">
            <AnimatedCount value={views} /> views
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <button
            type="button"
            title={reactTooltip}
            onClick={() => void submitReaction("like")}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
              userReaction === "like" ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/15 hover:border-white/30"
            }`}
          >
            <ThumbsUp className="h-4 w-4" /> <AnimatedCount value={likes} />
          </button>
          <button
            type="button"
            title={reactTooltip}
            onClick={() => void submitReaction("dislike")}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
              userReaction === "dislike" ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/15 hover:border-white/30"
            }`}
          >
            <ThumbsDown className="h-4 w-4" /> <AnimatedCount value={dislikes} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-white/70 sm:grid-cols-3">
        <FieldMicro
          label="Salary"
          fieldKey="salary"
          counts={fieldCounts.salary}
          active={userFieldReactions.salary ?? null}
          canReact={Boolean(candidateEmail)}
          tooltip={reactTooltip}
          onReact={submitFieldReaction}
        />
        <FieldMicro
          label="Location"
          fieldKey="location"
          counts={fieldCounts.location}
          active={userFieldReactions.location ?? null}
          canReact={Boolean(candidateEmail)}
          tooltip={reactTooltip}
          onReact={submitFieldReaction}
        />
        <FieldMicro
          label="Rotation"
          fieldKey="rotation"
          counts={fieldCounts.rotation}
          active={userFieldReactions.rotation ?? null}
          canReact={Boolean(candidateEmail)}
          tooltip={reactTooltip}
          onReact={submitFieldReaction}
        />
      </div>
    </div>
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
  canReact,
  tooltip,
  onReact,
}: {
  label: string;
  fieldKey: FieldKey;
  counts: Record<FieldFeeling, number>;
  active: FieldFeeling | null;
  canReact: boolean;
  tooltip: string;
  onReact: (fieldKey: FieldKey, fieldReaction: FieldFeeling) => Promise<void>;
}) {
  const happy = useAnimatedNumber(counts.happy);
  const neutral = useAnimatedNumber(counts.neutral);
  const sad = useAnimatedNumber(counts.sad);
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-white/55">{label}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={tooltip}
          onClick={() => canReact && void onReact(fieldKey, "happy")}
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
            active === "happy" ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-transparent hover:border-white/20"
          }`}
          aria-label={`${label} happy`}
        >
          <span>😊</span>
          <span>{happy}</span>
        </button>
        <button
          type="button"
          title={tooltip}
          onClick={() => canReact && void onReact(fieldKey, "neutral")}
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
            active === "neutral" ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-transparent hover:border-white/20"
          }`}
          aria-label={`${label} neutral`}
        >
          <span>😐</span>
          <span>{neutral}</span>
        </button>
        <button
          type="button"
          title={tooltip}
          onClick={() => canReact && void onReact(fieldKey, "sad")}
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
            active === "sad" ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-transparent hover:border-white/20"
          }`}
          aria-label={`${label} sad`}
        >
          <span>😕</span>
          <span>{sad}</span>
        </button>
      </div>
    </div>
  );
}
