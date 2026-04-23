import { redirect } from "next/navigation";

import TermsUpdateClient from "./TermsUpdateClient";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ version?: string; type?: string; email?: string; user_type?: string }>;
};

export default async function TermsUpdatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const version = params.version?.trim() || "";
  const type = params.type === "privacy" ? "privacy" : "terms";
  const email = params.email?.trim().toLowerCase() || "";
  const userType = params.user_type === "candidate" || params.user_type === "partner" ? params.user_type : "employer";

  if (!version) {
    redirect(type === "privacy" ? "/privacy" : "/terms");
  }

  let summary = "We improved clarity, legal wording, and data processing details.";
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const versionRes = await supabase
      .from("terms_versions")
      .select("summary_of_changes")
      .eq("type", type)
      .eq("version", version)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!versionRes.error && versionRes.data?.summary_of_changes) {
      summary = versionRes.data.summary_of_changes;
    }
  }

  return <TermsUpdateClient version={version} type={type} summary={summary} initialEmail={email} initialUserType={userType} />;
}
