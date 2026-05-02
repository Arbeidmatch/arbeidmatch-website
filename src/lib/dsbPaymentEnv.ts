/** When not exactly `"true"`, all DSB guide payment flows are off (BETA). */
export function isDsbPaymentEnabled(): boolean {
  return process.env.DSB_PAYMENT_ENABLED === "true";
}
