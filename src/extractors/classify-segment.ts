import type { SegmentType } from "../core/types.js";

/**
 * Lightweight line/block classifier (plan §2.3 reference). For full markdown splitting use {@link MarkdownExtractor}.
 */
export function classifySegmentType(text: string): SegmentType {
  const t = text.trim();
  if (/^#{1,6}\s/.test(t)) {
    return "heading";
  }
  if (/^!\[.*\]\(.*\)/.test(t)) {
    return "other";
  }
  if (/^import /.test(t)) {
    return "other";
  }
  if (/^</.test(t)) {
    return "other";
  }
  return "paragraph";
}
