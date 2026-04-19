import { NextRequest } from "next/server";
import { getRateLimitResult, hasHoneypotValue } from "@/lib/apiSecurity";

export function isRateLimited(
  request: NextRequest,
  scope: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  return getRateLimitResult(request, scope, maxRequests, windowMs).limited;
}

export { hasHoneypotValue };
