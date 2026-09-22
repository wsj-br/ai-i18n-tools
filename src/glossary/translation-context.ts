import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Glossary } from "./glossary.js";

/** Default concatenated size of `glossary.contextFiles` injected into prompts. */
export const DEFAULT_CONTEXT_MAX_CHARS = 12_000;

/** Absolute Zod / runtime ceiling for `glossary.contextMaxChars`. */
export const CONTEXT_MAX_CHARS_HARD_LIMIT = 100_000;

/** `file_tracking` key for UI catalog guidance (locale-wide). */
export const UI_STRINGS_TRACKING_KEY = "ui-strings";

const CONTEXT_FILE_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".text"]);

export interface TranslationContextLoadResult {
  /** Formatted text for `<translation-context>` (may be empty). */
  text: string;
  /** Stable hash of {@link text}, or `""` when there is no project context. */
  fingerprint: string;
  truncated: boolean;
  loadedPaths: string[];
}

export interface TranslationContextConfigSlice {
  glossary?: {
    contextFiles?: string[];
    contextMaxChars?: number;
  };
}

/**
 * Strip tags that would prematurely close glossary / context prompt blocks.
 */
export function sanitizePromptSupplementaryText(text: string): string {
  return text.replace(/<\/\s*glossary\s*>/gi, "").replace(/<\/\s*translation-context\s*>/gi, "");
}

function assertLocalContextPath(rawPath: string): void {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    throw new Error("glossary.contextFiles entries must be non-empty paths");
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    throw new Error(`glossary.contextFiles must be local files, not URLs: ${trimmed}`);
  }
}

function assertAllowedContextExtension(absPath: string, configured: string): void {
  const ext = path.extname(absPath).toLowerCase();
  if (!CONTEXT_FILE_EXTENSIONS.has(ext)) {
    throw new Error(
      `glossary.contextFiles only accepts Markdown or plain-text files (.md, .markdown, .txt): ${configured}`
    );
  }
}

function hashFingerprint(content: string): string {
  if (!content) {
    return "";
  }
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Load cwd-relative Markdown/plain-text context files, concatenate in order, and cap size.
 */
export function loadTranslationContext(options: {
  cwd: string;
  files?: readonly string[];
  maxChars?: number;
}): TranslationContextLoadResult {
  const files = options.files ?? [];
  const maxChars = Math.min(
    Math.max(1, options.maxChars ?? DEFAULT_CONTEXT_MAX_CHARS),
    CONTEXT_MAX_CHARS_HARD_LIMIT
  );
  if (files.length === 0) {
    return { text: "", fingerprint: "", truncated: false, loadedPaths: [] };
  }

  const sections: string[] = [];
  const loadedPaths: string[] = [];
  for (const raw of files) {
    assertLocalContextPath(raw);
    const abs = path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(options.cwd, raw);
    assertAllowedContextExtension(abs, raw);
    if (!fs.existsSync(abs)) {
      throw new Error(`glossary.contextFiles: file not found: ${raw}`);
    }
    let body: string;
    try {
      body = fs.readFileSync(abs, "utf8");
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      throw new Error(`glossary.contextFiles: cannot read ${raw}: ${detail}`);
    }
    const trimmed = body.replace(/^\uFEFF/, "").trim();
    if (!trimmed) {
      continue;
    }
    const label = path.relative(options.cwd, abs).split(path.sep).join("/") || path.basename(abs);
    sections.push(`### ${label}\n\n${trimmed}`);
    loadedPaths.push(label);
  }

  if (sections.length === 0) {
    return { text: "", fingerprint: "", truncated: false, loadedPaths: [] };
  }

  const joined = sanitizePromptSupplementaryText(sections.join("\n\n"));
  const truncated = joined.length > maxChars;
  const text = truncated ? `${joined.slice(0, maxChars).trimEnd()}\n…[truncated]` : joined;
  return {
    text,
    fingerprint: hashFingerprint(text),
    truncated,
    loadedPaths,
  };
}

export function loadTranslationContextFromConfig(
  config: TranslationContextConfigSlice,
  cwd: string
): TranslationContextLoadResult {
  return loadTranslationContext({
    cwd,
    files: config.glossary?.contextFiles,
    maxChars: config.glossary?.contextMaxChars,
  });
}

/**
 * Locale-specific fingerprint of term-level Context notes plus project-context file content.
 * Empty when neither source is present so legacy cache rows (empty hash) still hit.
 */
export function computeGuidanceFingerprint(
  glossary: Glossary,
  locale: string,
  projectContextFingerprint: string
): string {
  const notes = glossary.termContextFingerprintPayload(locale);
  const project = projectContextFingerprint.trim();
  if (!notes && !project) {
    return "";
  }
  return hashFingerprint(`${notes}\n${project}`);
}

export function translationContextClientOpts(text: string): { translationContext?: string } {
  const trimmed = text.trim();
  return trimmed ? { translationContext: trimmed } : {};
}
