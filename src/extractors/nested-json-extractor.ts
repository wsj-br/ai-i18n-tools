import { minimatch } from "minimatch";
import type { JsonKeyPolicyConfig } from "../core/types.js";
import type { Segment, SegmentTranslationMapValue } from "../core/types.js";
import { computeSegmentHash } from "../utils/hash.js";
import { segmentTranslationText } from "../core/types.js";

type LeafRecord = { path: string; value: string };

function pathMatchesPattern(dotPath: string, pattern: string): boolean {
  const lastKey = dotPath.includes(".") ? dotPath.split(".").pop()! : dotPath;
  return (
    pattern === dotPath ||
    pattern === lastKey ||
    minimatch(dotPath, pattern, { dot: true }) ||
    minimatch(lastKey, pattern, { dot: true })
  );
}

function pathAllowed(dotPath: string, policy: JsonKeyPolicyConfig): boolean {
  const inDeny = policy.skipKeys.some((p) => pathMatchesPattern(dotPath, p));
  const inAllow = policy.translateKeys.some((p) => pathMatchesPattern(dotPath, p));

  switch (policy.mode) {
    case "allowlist":
      return inAllow;
    case "denylist":
      return !inDeny;
    case "both":
      return inAllow && !inDeny;
    default: {
      const _exhaustive: never = policy.mode;
      return _exhaustive;
    }
  }
}

/**
 * Arbitrary nested JSON: translatable string leaves selected by {@link JsonKeyPolicyConfig}.
 */
export class NestedJsonExtractor {
  readonly name = "nested-json";

  private lastOriginalContent = "";
  private leaves: LeafRecord[] = [];

  canHandle(filepath: string): boolean {
    return filepath.toLowerCase().endsWith(".json");
  }

  extract(content: string, filepath: string, keyPolicy: JsonKeyPolicyConfig): Segment[] {
    this.lastOriginalContent = content;
    this.leaves = [];
    let json: unknown;
    try {
      json = JSON.parse(content) as unknown;
    } catch (e) {
      throw new Error(
        `Failed to parse JSON file ${filepath}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
    this.collectLeaves(json, "", keyPolicy);
    const segments: Segment[] = [];
    let i = 0;
    for (const leaf of this.leaves) {
      const hash = computeSegmentHash(`${leaf.path}\0${leaf.value}`);
      segments.push({
        id: `nested-json-${i++}`,
        type: "json",
        content: leaf.value,
        hash,
        translatable: true,
        startLine: 1,
        jsonKey: leaf.path,
      });
    }
    return segments;
  }

  private collectLeaves(value: unknown, prefix: string, policy: JsonKeyPolicyConfig): void {
    if (typeof value === "string") {
      if (prefix && pathAllowed(prefix, policy)) {
        this.leaves.push({ path: prefix, value });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const p = prefix ? `${prefix}.${index}` : String(index);
        this.collectLeaves(item, p, policy);
      });
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const p = prefix ? `${prefix}.${key}` : key;
        this.collectLeaves(child, p, policy);
      }
    }
  }

  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
    const originalContent = this.lastOriginalContent;
    if (!originalContent) {
      throw new Error("NestedJsonExtractor.reassemble: call extract() first");
    }
    const originalJson = JSON.parse(originalContent) as unknown;
    const merged = segments.map((s) => ({
      ...s,
      content: s.translatable
        ? (segmentTranslationText(translations.get(s.hash)) ?? s.content)
        : s.content,
    }));
    const byPath = new Map<string, string>();
    for (const seg of merged) {
      if (seg.jsonKey) {
        byPath.set(seg.jsonKey, seg.content);
      }
    }

    const setAtPath = (root: unknown, dotPath: string, text: string): void => {
      const parts = dotPath.split(".");
      let cur: unknown = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]!;
        if (Array.isArray(cur)) {
          cur = cur[Number(part)];
        } else if (cur && typeof cur === "object") {
          cur = (cur as Record<string, unknown>)[part];
        }
      }
      const last = parts[parts.length - 1]!;
      if (Array.isArray(cur)) {
        cur[Number(last)] = text;
      } else if (cur && typeof cur === "object") {
        (cur as Record<string, unknown>)[last] = text;
      }
    };

    const clone = structuredClone(originalJson) as unknown;
    for (const [p, text] of byPath) {
      setAtPath(clone, p, text);
    }
    return `${JSON.stringify(clone, null, 2)}\n`;
  }
}
