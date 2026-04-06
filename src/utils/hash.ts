import crypto from "crypto";

/**
 * Segment hash for cache lookup: normalized whitespace, SHA-256, first 16 hex chars
 * (aligned with Transrewrt `TranslationCache.computeHash`).
 */
export function computeSegmentHash(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
