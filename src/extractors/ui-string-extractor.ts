import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Parser } from "i18next-scanner";
import type { Segment, SegmentTranslationMapValue, UIStringExtractorConfig } from "../core/types.js";
import { segmentTranslationText } from "../core/types.js";
import { BaseExtractor } from "./base-extractor.js";

const DEFAULT_EXT = [".js", ".jsx", ".ts", ".tsx"];
const DEFAULT_FUNCS = ["t", "i18n.t"];

/**
 * UI string extraction via `i18next-scanner`. Scans any JS/TS source files for
 * `t("literal")` / `i18n.t("literal")` calls (configurable via `funcNames`).
 * Works in React, Next.js, Node.js, and any other JS/TS codebase using i18next.
 * Segment hashes are MD5 first 8 hex (keys in `strings.json`).
 */
export class UIStringExtractor extends BaseExtractor {
  readonly name = "ui-string";

  private readonly extensions: Set<string>;
  private readonly funcNames: string[];
  private readonly includePackageDescription: boolean;
  private readonly packageJsonPath: string;
  /** Locale key used when {@link reassemble} writes `translated` (single-locale snapshot). */
  private readonly defaultReassembleLocale: string;

  constructor(
    config?: Partial<UIStringExtractorConfig>,
    options: { cwd?: string; defaultReassembleLocale?: string } = {}
  ) {
    super();
    const cwd = options.cwd ?? process.cwd();
    const ext = config?.extensions ?? DEFAULT_EXT;
    this.extensions = new Set(
      ext.map((e) => (e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`))
    );
    this.funcNames = config?.funcNames ?? DEFAULT_FUNCS;
    this.includePackageDescription = config?.includePackageDescription ?? true;
    this.packageJsonPath = path.resolve(cwd, config?.packageJsonPath ?? "package.json");
    this.defaultReassembleLocale = options.defaultReassembleLocale ?? "en";
  }

  protected computeHash(content: string): string {
    return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
  }

  canHandle(filepath: string): boolean {
    const ext = path.extname(filepath).toLowerCase();
    return this.extensions.has(ext);
  }

  extract(content: string, filepath: string): Segment[] {
    void filepath;
    const found = new Map<string, string>();
    const parser = new Parser({
      func: { list: this.funcNames, extensions: Array.from(this.extensions) },
      nsSeparator: false,
      keySeparator: false,
    });

    parser.parseFuncFromString(content, (key: string) => {
      const str = key.trim();
      if (str) {
        found.set(this.computeHash(str), str);
      }
    });

    const segments: Segment[] = [];
    let i = 0;
    for (const [hash, text] of found) {
      segments.push({
        id: `ui-${i++}`,
        type: "ui-string",
        content: text,
        hash,
        translatable: true,
      });
    }
    return segments;
  }

  /** Optional `package.json` description as a UI string (About tab pattern). */
  packageDescriptionSegments(): Segment[] {
    if (!this.includePackageDescription || !fs.existsSync(this.packageJsonPath)) {
      return [];
    }
    try {
      const pkg = JSON.parse(fs.readFileSync(this.packageJsonPath, "utf8")) as {
        description?: unknown;
      };
      const desc = typeof pkg.description === "string" ? pkg.description.trim() : "";
      if (!desc) {
        return [];
      }
      return [
        {
          id: "ui-pkg-description",
          type: "ui-string",
          content: desc,
          hash: this.computeHash(desc),
          translatable: true,
        },
      ];
    } catch {
      return [];
    }
  }

  /**
   * Merge package description segments into a deduped list (by hash).
   */
  mergePackageDescription(fileSegments: Segment[]): Segment[] {
    const byHash = new Map<string, Segment>();
    for (const s of fileSegments) {
      byHash.set(s.hash, s);
    }
    for (const s of this.packageDescriptionSegments()) {
      if (!byHash.has(s.hash)) {
        byHash.set(s.hash, s);
      }
    }
    return Array.from(byHash.values());
  }

  /**
   * Build `strings.json` body: `{ [hash]: { source, translated: { [locale]: text } } }`.
   * Existing file is merged when `existingPath` exists.
   */
  buildStringsJson(
    segments: Segment[],
    translationsByLocale: Record<string, Map<string, SegmentTranslationMapValue>>,
    existingPath?: string
  ): string {
    let existing: Record<
      string,
      { source?: string; translated?: Record<string, string>; models?: Record<string, string> }
    > = {};
    if (existingPath && fs.existsSync(existingPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(existingPath, "utf8")) as typeof existing;
      } catch {
        /* ignore */
      }
    }

    const output: Record<
      string,
      { source: string; translated: Record<string, string>; models?: Record<string, string> }
    > = {};

    for (const [h, str] of segments.map((s) => [s.hash, s.content] as const)) {
      const prev = existing[h];
      const translated: Record<string, string> =
        prev && typeof prev.translated === "object" && prev.translated
          ? { ...prev.translated }
          : {};
      for (const [locale, map] of Object.entries(translationsByLocale)) {
        const raw = map.get(h);
        const t = segmentTranslationText(raw);
        if (t !== undefined && t !== "") {
          translated[locale] = t;
        }
      }
      const preservedModels =
        prev && typeof prev.models === "object" && prev.models ? { ...prev.models } : undefined;
      const base =
        prev && typeof prev === "object" && typeof prev.source === "string"
          ? { source: str, translated: { ...(prev.translated ?? {}), ...translated } }
          : { source: str, translated };
      output[h] =
        preservedModels && Object.keys(preservedModels).length > 0
          ? { ...base, models: preservedModels }
          : base;
    }

    return `${JSON.stringify(output, null, 2)}\n`;
  }

  /**
   * `ContentExtractor` reassemble: emit `strings.json` snapshot with one locale (`defaultReassembleLocale`).
   */
  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string {
    return this.buildStringsJson(segments, { [this.defaultReassembleLocale]: translations });
  }
}
