import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function getOrCreateSubscription(email: string, source: string): Promise<string> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: existing } = await supabase
    .from("email_subscriptions")
    .select("unsubscribe_token")
    .eq("email", email)
    .single();
  if (existing) return existing.unsubscribe_token;

  const { data, error } = await supabase
    .from("email_subscriptions")
    .insert({ email, source })
    .select("unsubscribe_token")
    .single();
  if (error) throw new Error(error.message);
  return data.unsubscribe_token;
}

/**
 * The way off the list for a letter that never had one.
 *
 * The ArbeidMatch letter always carries one unless it is an internal notice, and
 * a link to "#" is a way off the list that goes nowhere. Some mails here had no
 * unsubscribe at all (a code, an access link, a partner decision), so they get
 * the same token link as the rest. The mail must still leave if the table cannot
 * be reached, so the fallback is a request to the office, which a person acts on.
 */
export async function unsubscribeUrlFor(email: string, source: string): Promise<string> {
  try {
    const token = await getOrCreateSubscription(email, source);
    return `https://arbeidmatch.no/api/unsubscribe?token=${encodeURIComponent(token)}`;
  } catch {
    return `mailto:post@arbeidmatch.no?subject=${encodeURIComponent(`Unsubscribe ${email}`)}`;
  }
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { data } = await supabase.from("email_subscriptions").select("subscribed").eq("email", email).single();
  if (!data) return false;
  return data.subscribed === false;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("email_subscriptions")
    .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select()
    .single();
  if (error || !data) return false;
  return true;
}
