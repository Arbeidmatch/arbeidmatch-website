"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type JobPayload = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  companyName: string;
  location: string;
};

export default function BoardJobEditClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobPayload | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This secure link is missing a token.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/employer/board-job/${jobId}?token=${encodeURIComponent(token)}`);
      const body = (await res.json().catch(() => ({}))) as { error?: string; job?: JobPayload };
      if (cancelled) return;
      if (!res.ok || !body.job) {
        setError(body.error || "Could not load this draft.");
        setLoading(false);
        return;
      }
      setJob(body.job);
      setTitle(body.job.title);
      setDescription(body.job.description);
      setRequirements(body.job.requirements);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, token]);

  async function handlePublish(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/employer/board-job/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, title, description, requirements }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean; slug?: string };
    if (!res.ok || !body.success || !body.slug) {
      setError(body.error || "Publish failed.");
      setSaving(false);
      return;
    }
    router.replace(`/jobs/${body.slug}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-white/70">
        <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" aria-hidden />
        <span className="text-sm">Loading draft...</span>
      </div>
    );
  }

  if (error && !job) {
    return (
      <section className="mx-auto max-w-xl rounded-[18px] border border-[#C9A84C]/25 bg-white/[0.03] p-6 text-center text-white/80">
        <p className="text-sm text-red-300">{error}</p>
        <Link href="/jobs" className="mt-4 inline-block text-sm font-semibold text-[#C9A84C] hover:underline">
          Back to jobs
        </Link>
      </section>
    );
  }

  if (!job) return null;

  return (
    <form onSubmit={handlePublish} className="mx-auto max-w-3xl space-y-5 rounded-[20px] border border-[#C9A84C]/25 bg-white/[0.03] p-6 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Employer review</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Publish your job once</h1>
        <p className="mt-2 text-sm text-white/70">
          {job.companyName} · {job.location}
        </p>
        <p className="mt-3 text-sm text-white/60">
          You can save a single time. After publishing, candidates can apply and you will receive secure review links per
          application.
        </p>
      </header>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/85">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-premium--dark min-h-[44px] rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/85">
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-premium--dark min-h-[200px] rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/85">
        <span>Requirements (plain text, one requirement per line is fine)</span>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="input-premium--dark min-h-[140px] rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
          required
        />
      </label>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-gold-premium min-h-[44px] rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-50"
        >
          {saving ? "Publishing..." : "Publish to job board"}
        </button>
        <Link
          href="/jobs"
          className="btn-outline-premium inline-flex min-h-[44px] items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/80"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
