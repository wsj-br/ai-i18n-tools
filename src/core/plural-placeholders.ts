/**
 * Mechanical placeholder / quantity checks for cardinal plural LLM forms.
 * Failures throw {@link PluralFormsPlaceholderError} so the model-fallback loop retries.
 */

import type { CldrPluralForm } from "./types.js";
import { PromptParseError } from "./prompt-builder.js";
import {
  collectPlaceholderFamilies,
  isNounOnlyPluralSource,
  isQuantityPlaceholderFamily,
} from "./ui-placeholders.js";

export type PluralPlaceholderIssueKind = "missing" | "extra" | "qty";

export interface PluralFormPlaceholderIssue {
  form: CldrPluralForm;
  kind: PluralPlaceholderIssueKind;
  detail: string;
}

export class PluralFormsPlaceholderError extends PromptParseError {
  constructor(
    message: string,
    rawResponse: string,
    public readonly issues: PluralFormPlaceholderIssue[]
  ) {
    super(message, rawResponse);
    this.name = "PluralFormsPlaceholderError";
  }
}

export interface AssertPluralFormsPlaceholdersOptions {
  zeroDigit?: boolean;
  /** Raw model response for error context (defaults to JSON of forms). */
  rawResponse?: string;
}

function formAllowsLiteralZeroForQuantity(
  form: CldrPluralForm,
  zeroDigit: boolean,
  value: string
): boolean {
  if (form !== "zero" || !zeroDigit) {
    return false;
  }
  const digits = value.match(/[0-9]/g) ?? [];
  return digits.length > 0 && digits.every((d) => d === "0");
}

/**
 * Compare each returned CLDR form to the original developer literal.
 * - Missing: source families must appear at least as often (zero+zeroDigit may use digit 0 for quantity).
 * - Extra: form must not invent families the source lacks.
 * - Qty: noun-only sources must not gain digits or quantity tokens (except zero+zeroDigit → `0`).
 */
export function pluralFormPlaceholderIssues(
  source: string,
  forms: Partial<Record<CldrPluralForm, string>>,
  opts?: { zeroDigit?: boolean }
): PluralFormPlaceholderIssue[] {
  const zeroDigit = opts?.zeroDigit === true;
  const sourceFamilies = collectPlaceholderFamilies(source);
  const nounOnly = isNounOnlyPluralSource(source);
  const issues: PluralFormPlaceholderIssue[] = [];

  for (const [formKey, value] of Object.entries(forms)) {
    if (typeof value !== "string") {
      continue;
    }
    const form = formKey as CldrPluralForm;
    const formFamilies = collectPlaceholderFamilies(value);
    const zeroLiteralOk = formAllowsLiteralZeroForQuantity(form, zeroDigit, value);

    for (const [family, srcCount] of sourceFamilies) {
      const formCount = formFamilies.get(family) ?? 0;
      if (formCount >= srcCount) {
        continue;
      }
      if (zeroLiteralOk && isQuantityPlaceholderFamily(family)) {
        // zeroDigit: either keep {{count}}/%d/{n}, or use literal 0 in place of the quantity.
        continue;
      }
      issues.push({
        form,
        kind: "missing",
        detail: `missing placeholder family "${family}" (need ≥${srcCount}, got ${formCount})`,
      });
    }

    for (const [family] of formFamilies) {
      if (sourceFamilies.has(family)) {
        continue;
      }
      issues.push({
        form,
        kind: "extra",
        detail: `invented placeholder family "${family}"`,
      });
    }

    if (nounOnly) {
      const inventedQty = [...formFamilies.keys()].some(
        (f) => isQuantityPlaceholderFamily(f) && !sourceFamilies.has(f)
      );
      const hasDigit = /[0-9]/.test(value);
      if (inventedQty || (hasDigit && !zeroLiteralOk)) {
        issues.push({
          form,
          kind: "qty",
          detail: inventedQty
            ? "noun-only source: form injects a quantity placeholder"
            : "noun-only source: form injects a digit",
        });
      }
    }
  }

  return issues;
}

/** Throw {@link PluralFormsPlaceholderError} when any form fails placeholder/qty checks. */
export function assertPluralFormsPlaceholders(
  source: string,
  forms: Partial<Record<CldrPluralForm, string>>,
  opts?: AssertPluralFormsPlaceholdersOptions
): void {
  const issues = pluralFormPlaceholderIssues(source, forms, { zeroDigit: opts?.zeroDigit });
  if (issues.length === 0) {
    return;
  }
  let raw = opts?.rawResponse;
  if (raw === undefined) {
    try {
      raw = JSON.stringify(forms);
    } catch {
      raw = String(forms);
    }
  }
  const summary = issues.map((i) => `${i.form}:${i.kind}`).join(", ");
  throw new PluralFormsPlaceholderError(
    `Plural forms: placeholder validation failed (${summary})`,
    raw,
    issues
  );
}
