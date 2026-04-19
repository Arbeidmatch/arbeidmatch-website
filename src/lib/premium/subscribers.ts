import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseServiceClient } from "@/lib/supabaseService";

export type PremiumPlan = "monthly" | "annual";
export type PremiumStatus = "trialing" | "active" | "canceled" | "past_due";

export interface PremiumSubscriberRow {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PremiumPlan | null;
  status: PremiumStatus | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscribed_at: string | null;
  canceled_at: string | null;
  created_at: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function fetchSubscriberByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<PremiumSubscriberRow | null> {
  const e = normalizeEmail(email);
  const { data, error } = await supabase.from("premium_subscribers").select("*").eq("email", e).maybeSingle();
  if (error) {
    console.error("[premium_subscribers] fetch", error.message);
    return null;
  }
  return data as PremiumSubscriberRow | null;
}

export function computeHasAccess(row: PremiumSubscriberRow | null): boolean {
  if (!row?.status) return false;
  const now = Date.now();
  if (row.status === "active") return true;
  if (row.status === "trialing" && row.trial_ends_at) {
    return new Date(row.trial_ends_at).getTime() > now;
  }
  return false;
}

export async function insertTrialSubscriber(email: string): Promise<PremiumSubscriberRow | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const e = normalizeEmail(email);
  const trialEnds = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("premium_subscribers")
    .insert({
      email: e,
      status: "trialing",
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEnds,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[premium_subscribers] insert trial", error.message);
    return null;
  }
  return data as PremiumSubscriberRow;
}

export async function upsertSubscriberAfterCheckout(params: {
  email: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: PremiumPlan;
}): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  const e = normalizeEmail(params.email);
  const { error } = await supabase.from("premium_subscribers").upsert(
    {
      email: e,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      plan: params.plan,
      status: "active" as PremiumStatus,
      subscribed_at: new Date().toISOString(),
      canceled_at: null,
    },
    { onConflict: "email" },
  );
  if (error) {
    console.error("[premium_subscribers] upsert checkout", error.message);
    return false;
  }
  return true;
}

export async function updateSubscriberByEmail(
  email: string,
  patch: Partial<
    Pick<
      PremiumSubscriberRow,
      | "stripe_customer_id"
      | "stripe_subscription_id"
      | "plan"
      | "status"
      | "trial_started_at"
      | "trial_ends_at"
      | "subscribed_at"
      | "canceled_at"
    >
  >,
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  const e = normalizeEmail(email);
  const { error } = await supabase.from("premium_subscribers").update(patch).eq("email", e);
  if (error) {
    console.error("[premium_subscribers] update", error.message);
    return false;
  }
  return true;
}

export async function updateSubscriberBySubscriptionId(
  subscriptionId: string,
  patch: Partial<
    Pick<
      PremiumSubscriberRow,
      | "stripe_customer_id"
      | "stripe_subscription_id"
      | "plan"
      | "status"
      | "subscribed_at"
      | "canceled_at"
    >
  >,
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  const { error } = await supabase.from("premium_subscribers").update(patch).eq("stripe_subscription_id", subscriptionId);
  if (error) {
    console.error("[premium_subscribers] update by sub", error.message);
    return false;
  }
  return true;
}

export async function fetchSubscriberBySubscriptionId(
  supabase: SupabaseClient,
  subscriptionId: string,
): Promise<PremiumSubscriberRow | null> {
  const { data, error } = await supabase
    .from("premium_subscribers")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (error) {
    console.error("[premium_subscribers] fetch by sub", error.message);
    return null;
  }
  return data as PremiumSubscriberRow | null;
}
