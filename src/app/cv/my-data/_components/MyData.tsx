"use client";

import { useCallback, useEffect, useState } from "react";

interface Profile {
  email_normalized: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  headline: string | null;
  marketing_opt_in: boolean;
  created_at: string;
}

interface DataResponse {
  success: boolean;
  error?: string;
  profile?: Profile;
  documents?: Array<{ id: string; kind: string; template_id: string; created_at: string }>;
  consents?: Array<{ policy_version: string; created_at: string; consent_marketing: boolean }>;
}

const primaryButton =
  "rounded bg-[#C9A84C] px-5 py-3 font-bold text-[#0D1B2A] transition-colors hover:bg-[#B8913A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50";
const dangerButton =
  "rounded border border-[#B03A2E] px-5 py-3 font-bold text-[#B03A2E] transition-colors hover:bg-[#B03A2E] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50";

export function MyData({ token }: { token: string | null }) {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteStage, setDeleteStage] = useState<"idle" | "code" | "done">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setData({ success: false, error: "This link is missing its token." });
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/cv/my-data?token=${encodeURIComponent(token)}`);
      setData((await response.json()) as DataResponse);
    } catch {
      setData({ success: false, error: "Could not load your data. Try the link again." });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "arbeidmatch-my-data.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function requestDeleteCode() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/cv/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        setMessage(result.error ?? "Could not send the code.");
        return;
      }
      setDeleteStage("code");
      setMessage("We sent a code to your email. Enter it below to delete everything.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/cv/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        setMessage(result.error ?? "That code is not valid.");
        return;
      }
      setDeleteStage("done");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-[15px] text-[#55616D]">Loading your data...</p>;
  }

  if (deleteStage === "done") {
    return (
      <div className="rounded border border-[#E2E5EA] bg-white p-6">
        <h2 className="text-xl font-bold text-[#0D1B2A]">Everything has been deleted</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#55616D]">
          Your work profile and your documents are gone, and the PDF files have been removed
          from our storage. We keep only a record that you once gave consent, without your
          name attached to it, because we have to be able to show the basis on which we held
          your data.
        </p>
      </div>
    );
  }

  if (!data?.success || !data.profile) {
    return (
      <div className="rounded border border-[#E2E5EA] bg-white p-6">
        <h2 className="text-xl font-bold text-[#0D1B2A]">This link no longer works</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#55616D]">
          {data?.error ?? "Ask for a new link from the email we sent with your CV."}
        </p>
      </div>
    );
  }

  const profile = data.profile;

  return (
    <div className="space-y-6">
      <section className="rounded border border-[#E2E5EA] bg-white p-6">
        <h2 className="text-lg font-bold text-[#0D1B2A]">Your work profile</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["Name", [profile.first_name, profile.last_name].filter(Boolean).join(" ")],
            ["Headline", profile.headline],
            ["Email", profile.email_normalized],
            ["Phone", profile.phone],
            ["Location", [profile.city, profile.country].filter(Boolean).join(", ")],
            ["Job alerts by email", profile.marketing_opt_in ? "Yes" : "No"],
            ["Created", new Date(profile.created_at).toLocaleDateString("en-GB")],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-[13px] font-semibold uppercase tracking-wide text-[#8A929C]">{label}</dt>
              <dd className="text-[15px] text-[#0D1B2A]">{value || "Not set"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded border border-[#E2E5EA] bg-white p-6">
        <h2 className="text-lg font-bold text-[#0D1B2A]">Your documents</h2>
        {data.documents && data.documents.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {data.documents.map((document) => (
              <li key={document.id} className="text-[15px] text-[#55616D]">
                {document.kind === "cover_letter" ? "Cover letter" : "CV"}, layout {document.template_id},
                created {new Date(document.created_at).toLocaleDateString("en-GB")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[15px] text-[#55616D]">No documents.</p>
        )}
      </section>

      <section className="rounded border border-[#E2E5EA] bg-white p-6">
        <h2 className="text-lg font-bold text-[#0D1B2A]">Export</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#55616D]">
          Download everything we hold about you as a JSON file.
        </p>
        <button type="button" onClick={exportJson} className={`${primaryButton} mt-4`}>
          Download my data
        </button>
      </section>

      <section className="rounded border border-[#B03A2E]/40 bg-[#FDF3F2] p-6">
        <h2 className="text-lg font-bold text-[#B03A2E]">Delete everything</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[#7A2B22]">
          This removes your work profile and every document we generated for you. It cannot be
          undone, so it needs a fresh code from your email.
        </p>

        {deleteStage === "idle" ? (
          <button type="button" onClick={requestDeleteCode} disabled={busy} className={`${dangerButton} mt-4`}>
            {busy ? "Sending code..." : "Send me a deletion code"}
          </button>
        ) : (
          <div className="mt-4">
            <label htmlFor="delete-code" className="mb-1 block text-sm font-semibold text-[#7A2B22]">
              Code from your email
            </label>
            <input
              id="delete-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="w-40 rounded border border-[#E2E5EA] px-3 py-2.5 text-center text-xl tracking-[0.3em] outline-none focus:border-[#B03A2E] focus:ring-2 focus:ring-[#B03A2E]/40"
              placeholder="000000"
            />
            <div className="mt-3">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={code.length !== 6 || busy}
                className={dangerButton}
              >
                {busy ? "Deleting..." : "Delete everything permanently"}
              </button>
            </div>
          </div>
        )}

        {message ? (
          <p role="alert" className="mt-3 text-[14px] font-medium text-[#7A2B22]">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
