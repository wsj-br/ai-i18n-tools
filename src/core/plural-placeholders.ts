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
  type UiPlaceholderStyle,
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
  placeholderStyle?: UiPlaceholderStyle;
  /**
   * Source-locale forms being translated (Pass B).
   * A placeholder that exists only on one of these forms is required on the
   * matching target category and on categories that follow it, and is rejected
   * on a category whose source form does not have it.
   */
  sourceForms?: Partial<Record<CldrPluralForm, string>>;
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

const PLURAL_CATEGORIES_FOLLOWING_OTHER: ReadonlySet<CldrPluralForm> = new Set([
  "zero",
  "two",
  "few",
  "many",
  "other",
]);

/**
 * Source-locale text a target category should mirror.
 * `one` follows source `one` only. Other categories follow their own source
 * form, then source `other`, then source `one`.
 */
function referenceSourceText(
  form: CldrPluralForm,
  sourceForms: Partial<Record<CldrPluralForm, string>> | undefined
): string | undefined {
  if (!sourceForms) {
    return undefined;
  }
  const direct = sourceForms[form];
  if (typeof direct === "string" && direct.trim() !== "") {
    return direct;
  }
  if (PLURAL_CATEGORIES_FOLLOWING_OTHER.has(form)) {
    const other = sourceForms.other;
    if (typeof other === "string" && other.trim() !== "") {
      return other;
    }
    const one = sourceForms.one;
    if (typeof one === "string" && one.trim() !== "") {
      return one;
    }
  }
  return undefined;
}

/**
 * Families a target category must contain and may contain.
 * The original developer literal always applies. When Pass B supplies source
 * forms, the form this category follows adds its own families (for example
 * `{0}` on the English plural but not on the singular).
 */
function allowedFamiliesForForm(
  source: string,
  form: CldrPluralForm,
  style: UiPlaceholderStyle,
  sourceForms: Partial<Record<CldrPluralForm, string>> | undefined
): Map<string, number> {
  const allowed = new Map(collectPlaceholderFamilies(source, style));
  const reference = referenceSourceText(form, sourceForms);
  if (reference === undefined) {
    return allowed;
  }
  for (const [family, count] of collectPlaceholderFamilies(reference, style)) {
    allowed.set(family, Math.max(allowed.get(family) ?? 0, count));
  }
  return allowed;
}

/**
 * Compare each returned CLDR form to the original developer literal
 * (and to the source form that category follows, when Pass B supplies one).
 * - Missing: those families must appear at least as often (zero+zeroDigit may use digit 0 for quantity).
 * - Extra: form must not invent families that set lacks.
 * - Qty: noun-only sources must not gain digits or quantity tokens (except zero+zeroDigit → `0`).
 */
export function pluralFormPlaceholderIssues(
  source: string,
  forms: Partial<Record<CldrPluralForm, string>>,
  opts?: {
    zeroDigit?: boolean;
    placeholderStyle?: UiPlaceholderStyle;
    sourceForms?: Partial<Record<CldrPluralForm, string>>;
  }
): PluralFormPlaceholderIssue[] {
  const zeroDigit = opts?.zeroDigit === true;
  const style = opts?.placeholderStyle ?? "default";
  const nounOnly = isNounOnlyPluralSource(source, style);
  const issues: PluralFormPlaceholderIssue[] = [];

  for (const [formKey, value] of Object.entries(forms)) {
    if (typeof value !== "string") {
      continue;
    }
    const form = formKey as CldrPluralForm;
    const sourceFamilies = allowedFamiliesForForm(source, form, style, opts?.sourceForms);
    const formFamilies = collectPlaceholderFamilies(value, style);
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
  const issues = pluralFormPlaceholderIssues(source, forms, {
    zeroDigit: opts?.zeroDigit,
    placeholderStyle: opts?.placeholderStyle,
    sourceForms: opts?.sourceForms,
  });
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
