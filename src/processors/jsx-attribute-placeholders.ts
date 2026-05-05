/**
 * Extracts translatable attribute values from JSX components for translation.
 * Currently supports: label, tooltip, aria-label attributes.
 *
 * Note: The main implementation is in mdx-placeholders.ts.
 * This file is kept for potential future use or direct API access.
 */

const PLACEHOLDER_PREFIX = "{{JXA_";
const PLACEHOLDER_SUFFIX = "}}";

/** Allowed attribute names for extraction */
type JsxAttributeName = "label" | "tooltip" | "aria-label";

/** Regex patterns for extracting specific translatable attributes */
const ATTRIBUTE_PATTERNS: Record<JsxAttributeName, RegExp> = {
  label: /label\s*=\s*["']([^"']+)["']/g,
  tooltip: /tooltip\s*=\s*["']([^"']+)["']/g,
  "aria-label": /aria-label\s*=\s*["']([^"']+)["']/g,
};

export interface ProtectedJsxAttributesResult {
  protected: string;
  attributeMap: string[];
  attributeMetadata: Array<{
    attributeName: JsxAttributeName;
    originalValue: string;
    placeholderIndex: number;
  }>;
}

function makePlaceholder(idx: number): string {
  return `${PLACEHOLDER_PREFIX}${idx}${PLACEHOLDER_SUFFIX}`;
}

/**
 * Extract translatable attribute values from JSX content.
 */
export function protectJsxAttributes(text: string): ProtectedJsxAttributesResult {
  const attributeMap: string[] = [];
  const attributeMetadata: ProtectedJsxAttributesResult["attributeMetadata"] = [];

  let result = text;

  // Extract each type of translatable attribute
  for (const [attributeName, pattern] of Object.entries(ATTRIBUTE_PATTERNS) as [
    JsxAttributeName,
    RegExp,
  ][]) {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(result)) !== null) {
      const attributeValue = match[1];

      if (shouldSkipAttribute(attributeValue)) {
        continue;
      }

      const placeholder = makePlaceholder(attributeMap.length);
      attributeMap.push(attributeValue);

      attributeMetadata.push({
        attributeName,
        originalValue: attributeValue,
        placeholderIndex: attributeMap.length - 1,
      });

      // Replace the attribute value with placeholder
      result = result.replace(match[0], placeholder);

      // Reset regex index to avoid infinite loops with overlapping matches
      pattern.lastIndex = 0;
    }
  }

  return {
    protected: result,
    attributeMap,
    attributeMetadata,
  };
}

/**
 * Restore translated attribute values back into JSX content.
 */
export function restoreJsxAttributes(text: string, attributeMap: string[]): string {
  if (attributeMap.length === 0) {
    return text;
  }

  let restored = text;

  for (let i = attributeMap.length - 1; i >= 0; i--) {
    // Support both {{JXA_N}} and {{JXA-N}} formats (lenient matching)
    const flexiblePattern = new RegExp(`{{\\s*JXA[-_]${i}\\s*}}`, "g");
    restored = restored.replace(flexiblePattern, () => attributeMap[i]!);
  }

  return restored;
}

/**
 * Determines if an attribute value should be skipped from translation.
 */
function shouldSkipAttribute(value: string): boolean {
  const trimmed = value.trim();

  // Skip empty or whitespace-only values
  if (!trimmed) {
    return true;
  }

  // Skip values that look like technical identifiers, numbers, or boolean flags
  if (/^\d+$/.test(trimmed)) {
    return true;
  }

  // Skip boolean-like values
  if (trimmed.toLowerCase() === "true" || trimmed.toLowerCase() === "false") {
    return true;
  }

  // Skip CSS class names (usually non-translatable)
  // (removed - not needed since we only process specific attributes)

  // Skip values that look like technical keys or IDs
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    // Allow some common user-facing technical terms
    const allowedTechnical = ["id", "value"];
    if (!allowedTechnical.includes(trimmed.toLowerCase())) {
      return true;
    }
  }

  // Skip values with technical characters (urls, selectors, etc.)
  if (
    trimmed.includes("://") ||
    trimmed.includes(".") ||
    trimmed.includes("#") ||
    trimmed.startsWith("@")
  ) {
    return true;
  }

  // Skip very short values that are likely to be technical
  if (trimmed.length <= 2 && !/[a-zA-Z]/.test(trimmed)) {
    return true;
  }

  // Allow all other values for translation
  return false;
}

/**
 * Extract attribute metadata for translation context.
 */
export function getAttributeMetadataForPrompt(
  attributeMetadata: ProtectedJsxAttributesResult["attributeMetadata"]
): string[] {
  return attributeMetadata.map((meta) => `${meta.attributeName}: "${meta.originalValue}"`);
}
