export function logApiError(scope: string, error: unknown, context?: Record<string, string | number | boolean>) {
  const message = error instanceof Error ? error.message : "unknown_error";
  if (context) {
    console.error(`[${scope}] ${message}`, context);
    return;
  }
  console.error(`[${scope}] ${message}`);
}
