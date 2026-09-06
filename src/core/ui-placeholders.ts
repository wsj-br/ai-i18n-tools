/**
 * Shared UI placeholder token extraction for proofread-ui and plural-form validation.
 */

/** Extract unique placeholder substrings that must survive any suggested rewrite (proofread). */
export function extractUiPlaceholderTokens(original: string): string[] {
  const found = new Set<string>();
  for (const re of [/\{\{[\s\S]*?\}\}/g, /\{\s*[0-9]+\s*\}/g, /%[sd]/g]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(original)) !== null) {
      found.add(m[0]);
    }
  }
  return [...found];
}

/**
 * Canonical family key for a placeholder token.
 * - `{{ count }}` / `{{count}}` → `count` (inner trim; case-sensitive)
 * - `{ 0 }` / `{0}` → `{0}`
 * - `%s` / `%d` → `%s` / `%d`
 */
export function canonicalPlaceholderFamily(rawToken: string): string {
  const mustache = rawToken.match(/^\{\{\s*([\s\S]*?)\s*\}\}$/);
  if (mustache) {
    return (mustache[1] ?? "").trim();
  }
  const positional = rawToken.match(/^\{\s*([0-9]+)\s*\}$/);
  if (positional) {
    return `{${positional[1]!}}`;
  }
  if (rawToken === "%s" || rawToken === "%d") {
    return rawToken;
  }
  return rawToken;
}

/**
 * Collect placeholder families with occurrence counts (order of first appearance).
 * Mustache names are trimmed for the family key; matching remains case-sensitive.
 */
export function collectPlaceholderFamilies(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const re of [/\{\{[\s\S]*?\}\}/g, /\{\s*[0-9]+\s*\}/g, /%[sd]/g]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const family = canonicalPlaceholderFamily(m[0]);
      if (family === "") {
        continue;
      }
      counts.set(family, (counts.get(family) ?? 0) + 1);
    }
  }
  return counts;
}

/** True when `family` is a quantity-style token (`count`, `%d`, `{n}`). */
export function isQuantityPlaceholderFamily(family: string): boolean {
  if (family === "count" || family === "%d") {
    return true;
  }
  return /^\{[0-9]+\}$/.test(family);
}

/** True when the source has no quantity placeholder and no ASCII digit. */
export function isNounOnlyPluralSource(source: string): boolean {
  if (/[0-9]/.test(source)) {
    return false;
  }
  for (const family of collectPlaceholderFamilies(source).keys()) {
    if (isQuantityPlaceholderFamily(family)) {
      return false;
    }
  }
  return true;
}
