import { NextRequest, NextResponse } from "next/server";
import { z, ZodType } from "zod";

type Bucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function getRateLimitResult(
  request: NextRequest,
  scope: string,
  maxRequests: number,
  windowMs: number,
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${scope}:${ip}`;
  const existing = rateBuckets.get(key);

  if (!existing || now >= existing.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { limited: true, retryAfterSeconds };
  }

  existing.count += 1;
  rateBuckets.set(key, existing);
  return { limited: false, retryAfterSeconds: 0 };
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

export function noStoreJson(
  body: Record<string, unknown>,
  init?: {
    status?: number;
    headers?: Record<string, string>;
  },
) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      ...(init?.headers ?? {}),
    },
  });
}

export async function parseJsonBodyWithSchema<T extends ZodType>(
  request: NextRequest,
  schema: T,
  options?: { maxBytes?: number },
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<Record<string, unknown>> }
> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: noStoreJson(
        { success: false, error: "Content-Type must be application/json." },
        { status: 415 },
      ),
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  const maxBytes = options?.maxBytes ?? 32 * 1024;
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        response: noStoreJson(
          { success: false, error: "Payload too large." },
          { status: 413 },
        ),
      };
    }
  }

  const rawText = await request.text();
  if (Buffer.byteLength(rawText, "utf8") > maxBytes) {
    return {
      ok: false,
      response: noStoreJson(
        { success: false, error: "Payload too large." },
        { status: 413 },
      ),
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      response: noStoreJson(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      ok: false,
      response: noStoreJson(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
