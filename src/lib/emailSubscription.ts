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
