import fs from "fs";
import path from "path";

/** Patterns `init` writes that do not depend on `cacheDir`. */
export const FIXED_GITIGNORE_PATTERNS = [
  "benchmark-scores.json",
  ".env",
  ".env.local",
  ".env.*.local",
  "*.tmp",
  "*.backup.*",
] as const;

const GITIGNORE_SECTIONS: readonly { comment: string; patterns: readonly string[] }[] = [
  {
    comment: "# Cache",
    patterns: [".translation-cache/*", "!.translation-cache/cache.db", "benchmark-scores.json"],
  },
  {
    comment: "# Environment",
    patterns: [".env", ".env.local", ".env.*.local"],
  },
  {
    comment: "# Temporary files",
    patterns: ["*.tmp", "*.backup.*"],
  },
];

/** Block `init` writes when `.gitignore` is absent. Templates use `cacheDir` `.translation-cache`. */
export const DEFAULT_GITIGNORE_BLOCK = `${GITIGNORE_SECTIONS.map((section) =>
  [section.comment, ...section.patterns].join("\n")
).join("\n\n")}\n`;

export type ProjectGitignoreResult = "created" | "updated" | "unchanged";

/** Trim, use forward slashes, and drop a trailing slash. An empty value is the default cache directory. */
export function normalizeCacheDir(cacheDir: string): string {
  const normalized = cacheDir.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  return normalized.length > 0 ? normalized : ".translation-cache";
}

export function cacheGitignorePatterns(cacheDir: string): {
  directory: string;
  contents: string;
  keepDatabase: string;
} {
  const directory = normalizeCacheDir(cacheDir);
  return {
    directory,
    contents: `${directory}/*`,
    keepDatabase: `!${directory}/cache.db`,
  };
}

/** Inclusion and exclusion lines `doctor` requires. Comments are not included. */
export function requiredGitignorePatterns(cacheDir: string): string[] {
  const cache = cacheGitignorePatterns(cacheDir);
  return [cache.contents, cache.keepDatabase, ...FIXED_GITIGNORE_PATTERNS];
}

/**
 * Directory rules that ignore `cache.db` even when `!<cacheDir>/cache.db` is present.
 * Git does not re-include a file under an excluded directory.
 */
export function cacheDirectoryIgnorePatterns(cacheDir: string): string[] {
  const directory = normalizeCacheDir(cacheDir);
  return [directory, `${directory}/`];
}

/** Non-comment, non-empty lines, trimmed. Inline comments are not stripped; gitignore has none. */
export function gitignorePatternSet(text: string): Set<string> {
  const patterns = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }
    patterns.add(line);
  }
  return patterns;
}

/**
 * Create `.gitignore`, or append only the default patterns that are not already present.
 * Existing lines, order, and newline style are kept. A second call does not rewrite the file.
 */
export function ensureProjectGitignore(dir: string): ProjectGitignoreResult {
  const file = path.join(dir, ".gitignore");
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, DEFAULT_GITIGNORE_BLOCK, "utf8");
    return "created";
  }
  const text = fs.readFileSync(file, "utf8");
  const present = gitignorePatternSet(text);
  const nl = text.includes("\r\n") ? "\r\n" : "\n";
  const chunks: string[] = [];
  for (const section of GITIGNORE_SECTIONS) {
    const missing = section.patterns.filter((pattern) => !present.has(pattern));
    if (missing.length === 0) {
      continue;
    }
    chunks.push([section.comment, ...missing].join(nl));
  }
  if (chunks.length === 0) {
    return "unchanged";
  }
  let prefix = text;
  if (prefix.length > 0 && !prefix.endsWith(nl)) {
    prefix += nl;
  }
  if (prefix.length > 0 && !prefix.endsWith(nl + nl)) {
    prefix += nl;
  }
  fs.writeFileSync(file, `${prefix}${chunks.join(nl + nl)}${nl}`, "utf8");
  return "updated";
}
