/**
 * Norwegian organisation numbers (Enhetsregisteret): nine digits, the last a
 * modulus 11 check digit with the weights 3 2 7 6 5 4 3 2.
 */

const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Digits only, or "" when the input is not nine digits once spaces are gone. */
export function normalizeOrgNumber(input: string): string {
  const digits = input.replace(/[\s.]/g, "");
  return /^\d{9}$/.test(digits) ? digits : "";
}

export function isValidOrgNumber(input: string): boolean {
  const digits = normalizeOrgNumber(input);
  if (!digits) return false;
  const sum = WEIGHTS.reduce((acc, weight, i) => acc + weight * Number(digits[i]), 0);
  const remainder = sum % 11;
  const check = remainder === 0 ? 0 : 11 - remainder;
  return check !== 10 && check === Number(digits[8]);
}

/** "935667089" as "935 667 089". */
export function formatOrgNumber(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
}
