import crypto from "crypto";

/**
 * Segment hash for cache lookup: normalize whitespace, SHA-256, first 16 hex chars.
 */
export function computeSegmentHash(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
