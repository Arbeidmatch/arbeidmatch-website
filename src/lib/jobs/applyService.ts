import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getJobBySlug as getJobBySlugFromRepository } from "@/lib/jobs/repository";

export { getSupabaseAdminClient };

export async function getJobBySlug(slug: string) {
  return getJobBySlugFromRepository(slug);
}
