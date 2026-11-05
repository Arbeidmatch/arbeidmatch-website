"use client";

import {
  ARBEIDSTILSYNET_MINSTELONN_URL,
  BENEFITS,
  EQUAL_TREATMENT_TEXT,
  formatKroner,
  payFieldErrors,
  PAY_MESSAGES,
  type Benefit,
} from "@/lib/pay-conditions";

import { InlineError, inputClass, inputClassDark, labelClass, labelClassDark, Tile, TileGrid, type Tone } from "./ui";

/**
 * Pay and conditions (ORDER 224, the owner, 5 November 2026), the same block
 * on the popup's step 7 and on the detailed wizard's last step:
 *
 *   - the equal-treatment confirmation, required (arbeidsmiljøloven § 14-12 a);
 *   - the hourly range, Fra and Til in kr, refused inline under the floor;
 *   - the floor line with the link to Arbeidstilsynet's page on minimum pay,
 *     or the link alone when RecOS holds no floor for the trade;
 *   - the optional benefits as tiles.
 *
 * The checks themselves are in src/lib/pay-conditions.ts, shared with the save route.
 */
export type PayAndConditionsProps = {
  idPrefix: string;
  tone?: Tone;
  floor: number | null;
  equalTreatment: boolean;
  onEqualTreatment: (value: boolean) => void;
  payFrom: string;
  payTo: string;
  onPayFrom: (value: string) => void;
  onPayTo: (value: string) => void;
  benefits: readonly string[];
  onToggleBenefit: (benefit: Benefit) => void;
  /** Set after a press on the primary button while the confirmation is missing. */
  showConfirmError?: boolean;
  /** A refusal of the range as a whole (missing on the detailed variant), shown after a press. */
  rangeError?: string | null;
};

export default function PayAndConditions({
  idPrefix,
  tone = "light",
  floor,
  equalTreatment,
  onEqualTreatment,
  payFrom,
  payTo,
  onPayFrom,
  onPayTo,
  benefits,
  onToggleBenefit,
  showConfirmError = false,
  rangeError = null,
}: PayAndConditionsProps) {
  const dark = tone === "dark";
  const fieldErrors = payFieldErrors({ from: payFrom, to: payTo, floor });
  const input = dark ? inputClassDark : inputClass;
  const label = dark ? labelClassDark : labelClass;
  const text = dark ? "text-white/85" : "text-[#14202F]";
  const mist = dark ? "text-white/60" : "text-[#6B7382]";
  const link = dark
    ? "font-medium text-white underline decoration-[#C9A84C] underline-offset-4 hover:decoration-2"
    : "font-medium text-[#0D1B2A] underline decoration-[#C9A84C] underline-offset-4 hover:decoration-2";
  const confirmErrorId = `${idPrefix}-confirm-error`;

  return (
    <div className="space-y-6">
      <div>
        <label className={`flex cursor-pointer items-start gap-3 text-[14.5px] leading-relaxed ${text}`}>
          <input
            type="checkbox"
            id={`${idPrefix}-equal-treatment`}
            checked={equalTreatment}
            onChange={(e) => onEqualTreatment(e.target.checked)}
            required
            aria-invalid={showConfirmError && !equalTreatment ? true : undefined}
            aria-describedby={showConfirmError && !equalTreatment ? confirmErrorId : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[#0D1B2A]"
          />
          <span>{EQUAL_TREATMENT_TEXT}</span>
        </label>
        {showConfirmError && !equalTreatment ? (
          <InlineError id={confirmErrorId} tone={tone}>
            {PAY_MESSAGES.confirm}
          </InlineError>
        ) : null}
      </div>

      <fieldset>
        <legend className={label}>Lønn per time</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-pay-from`} className={`mb-1 block text-[13.5px] ${mist}`}>
              Fra (kr)
            </label>
            <input
              id={`${idPrefix}-pay-from`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              maxLength={8}
              value={payFrom}
              onChange={(e) => onPayFrom(e.target.value.replace(/[^\d,.]/g, ""))}
              aria-invalid={fieldErrors.from ? true : undefined}
              aria-describedby={fieldErrors.from ? `${idPrefix}-pay-from-error` : undefined}
              className={input}
            />
            {fieldErrors.from ? (
              <InlineError id={`${idPrefix}-pay-from-error`} tone={tone}>
                {fieldErrors.from}
              </InlineError>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${idPrefix}-pay-to`} className={`mb-1 block text-[13.5px] ${mist}`}>
              Til (kr)
            </label>
            <input
              id={`${idPrefix}-pay-to`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              maxLength={8}
              value={payTo}
              onChange={(e) => onPayTo(e.target.value.replace(/[^\d,.]/g, ""))}
              aria-invalid={fieldErrors.to ? true : undefined}
              aria-describedby={fieldErrors.to ? `${idPrefix}-pay-to-error` : undefined}
              className={input}
            />
            {fieldErrors.to ? (
              <InlineError id={`${idPrefix}-pay-to-error`} tone={tone}>
                {fieldErrors.to}
              </InlineError>
            ) : null}
          </div>
        </div>
        {rangeError && !fieldErrors.from && !fieldErrors.to ? <InlineError tone={tone}>{rangeError}</InlineError> : null}
        <p className={`mt-3 text-[13.5px] ${mist}`}>
          {floor !== null ? <>Minstelønn for faget: {formatKroner(floor)} kr per time. </> : null}
          <a href={ARBEIDSTILSYNET_MINSTELONN_URL} target="_blank" rel="noopener noreferrer" className={link}>
            Arbeidstilsynet: minstelønn
          </a>
        </p>
      </fieldset>

      <fieldset>
        <legend className={label}>Tillegg (valgfritt)</legend>
        <div className="mt-2">
          <TileGrid>
            {BENEFITS.map((b) => (
              <Tile key={b} multi tone={tone} selected={benefits.includes(b)} onClick={() => onToggleBenefit(b)}>
                {b}
              </Tile>
            ))}
          </TileGrid>
        </div>
      </fieldset>
    </div>
  );
}
