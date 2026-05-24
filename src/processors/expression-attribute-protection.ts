/** JSX/HTML attribute names whose string values must not be translated. */
export const DEFAULT_PROTECTED_ATTRIBUTE_NAMES = [
  "class",
  "classname",
  "id",
  "style",
  "src",
  "href",
  "type",
  "role",
  "name",
  "for",
  "rel",
  "target",
  "key",
  "viewbox",
  "xmlns",
  "fill",
  "stroke",
  "width",
  "height",
  "x",
  "y",
  "d",
  "cx",
  "cy",
  "r",
  "transform",
  "slot",
  "part",
] as const;

/** Object property names whose quoted string values must not be translated. */
export const DEFAULT_PROTECTED_KEY_NAMES = [...DEFAULT_PROTECTED_ATTRIBUTE_NAMES] as const;

/** Static HTML / Astro template attributes that may be extracted when not protected. */
export const TRANSLATABLE_HTML_ATTRS = ["alt", "title", "aria-label", "placeholder"] as const;

/** MDX JSX attributes extracted for translation inside {@link protectMdx}. */
export const MDX_TRANSLATABLE_JSX_ATTRS = ["label", "tooltip", "aria-label"] as const;

/** Explicitly translatable attributes (overrides protected `aria-*` handling). */
export const EXPLICITLY_TRANSLATABLE_ATTR_NAMES = new Set<string>([
  ...TRANSLATABLE_HTML_ATTRS,
  ...MDX_TRANSLATABLE_JSX_ATTRS,
]);

export type ExpressionProtectionOptions = {
  /** Extra JSX/HTML attribute names merged with {@link DEFAULT_PROTECTED_ATTRIBUTE_NAMES}. */
  protectAttributes?: readonly string[];
  /** Extra object property names merged with {@link DEFAULT_PROTECTED_KEY_NAMES}. */
  protectKeys?: readonly string[];
};

export type ExpressionProtectionContext = {
  protectedAttributeNames: ReadonlySet<string>;
  protectedKeyNames: ReadonlySet<string>;
};

export function mergeExpressionProtectionContext(
  options?: ExpressionProtectionOptions
): ExpressionProtectionContext {
  const protectedAttributeNames = new Set<string>(DEFAULT_PROTECTED_ATTRIBUTE_NAMES);
  const protectedKeyNames = new Set<string>(DEFAULT_PROTECTED_KEY_NAMES);
  for (const name of options?.protectAttributes ?? []) {
    const trimmed = name.trim();
    if (trimmed) {
      protectedAttributeNames.add(trimmed.toLowerCase());
    }
  }
  for (const name of options?.protectKeys ?? []) {
    const trimmed = name.trim();
    if (trimmed) {
      protectedKeyNames.add(trimmed.toLowerCase());
    }
  }
  return { protectedAttributeNames, protectedKeyNames };
}

export function isProtectedAttributeName(
  attrName: string,
  protection: ExpressionProtectionContext
): boolean {
  const raw = attrName.toLowerCase();
  if (EXPLICITLY_TRANSLATABLE_ATTR_NAMES.has(raw) && !protection.protectedAttributeNames.has(raw)) {
    return false;
  }
  if (raw.startsWith("data-")) {
    return true;
  }
  if (raw.startsWith("aria-")) {
    return !EXPLICITLY_TRANSLATABLE_ATTR_NAMES.has(raw);
  }
  return protection.protectedAttributeNames.has(raw);
}

export function isProtectedObjectKeyName(
  keyName: string,
  protection: ExpressionProtectionContext
): boolean {
  return protection.protectedKeyNames.has(keyName.toLowerCase());
}
