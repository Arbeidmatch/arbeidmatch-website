import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, Bucket>();

function getForwardedIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function isRateLimited(
  request: NextRequest,
  scope: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const ip = getForwardedIp(request);
  const key = `${scope}:${ip}`;
  const existing = rateBuckets.get(key);

  if (!existing || now >= existing.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existing.count >= maxRequests) {
    return true;
  }

  existing.count += 1;
  rateBuckets.set(key, existing);
  return false;
}

export function hasHoneypotValue(
  payload: Record<string, unknown>,
  fields: string[] = ["website", "company_website", "honeypot"],
): boolean {
  return fields.some((field) => {
    const value = payload[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}
