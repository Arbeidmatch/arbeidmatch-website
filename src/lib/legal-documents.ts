import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type LegalDocId = "privacy" | "terms" | "dpa";

export type LegalDoc = {
  id: string;
  title: string;
  content_md: string;
  last_updated: string;
  version: number;
};

function rowToLegalDoc(row: {
  id: string;
  title: string;
  content_md: string;
  last_updated: string;
  version: number;
}): LegalDoc {
  return {
    id: row.id,
    title: row.title,
    content_md: row.content_md,
    last_updated: row.last_updated,
    version: row.version,
  };
}

export async function getLegalDocument(id: LegalDocId): Promise<LegalDoc | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from("legal_documents")
    .select("id,title,content_md,last_updated,version")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  if (!data) return null;
  return rowToLegalDoc(data as LegalDoc);
}

export async function getAllLegalDocuments(): Promise<LegalDoc[]> {
  const client = getSupabaseAdminClient();
  if (!client) return [];

  const { data, error } = await client
    .from("legal_documents")
    .select("id,title,content_md,last_updated,version")
    .order("id", { ascending: true });

  if (error) return [];
  return (data ?? []).map((row) => rowToLegalDoc(row as LegalDoc));
}
