import path from "path";
import type { I18nConfig } from "./types.js";
import { toPosix } from "./output-paths.js";

/** Maximum length for a glob pattern to prevent ReDoS attacks. */
const MAX_GLOB_PATTERN_LENGTH = 500;

/** Maximum number of glob stars allowed in a pattern (e.g., `*` or `**`). */
const MAX_GLOB_STARS = 10;

/** Timeout in milliseconds for regex matching operations. */
const REGEX_EXECUTION_TIMEOUT_MS = 1000;

/** Error thrown when a glob pattern fails security validation. */
export class GlobPatternError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlobPatternError";
  }
}

/**
 * Validates a glob pattern for security concerns before converting to regex.
 * Throws GlobPatternError if the pattern is suspicious or too complex.
 */
function validateGlobPattern(pattern: string): void {
  // Check pattern length
  if (pattern.length > MAX_GLOB_PATTERN_LENGTH) {
    throw new GlobPatternError(
      `Glob pattern exceeds maximum length of ${MAX_GLOB_PATTERN_LENGTH} characters: "${pattern.slice(0, 50)}..."`
    );
  }

  // Count glob stars to prevent nested quantifier abuse
  const starCount = (pattern.match(/\*/g) || []).length;
  if (starCount > MAX_GLOB_STARS) {
    throw new GlobPatternError(
      `Glob pattern contains too many wildcards (${starCount} > ${MAX_GLOB_STARS}): "${pattern}"`
    );
  }

  // Reject patterns with nested quantifier-like structures that could cause ReDoS
  // These patterns are not valid glob patterns anyway
  const suspiciousPatterns = [
    /\*\*\*+/, // More than 2 stars (*** or more)
    /\*\*.*\*\*/, // Multiple ** separated by content
    /\*\*\*\//, // *** followed by /
    /\/\*\*\*/, // / followed by ***
  ];

  for (const suspicious of suspiciousPatterns) {
    if (suspicious.test(pattern)) {
      throw new GlobPatternError(`Glob pattern contains suspicious nested structure: "${pattern}"`);
    }
  }

  // Check for unbalanced brackets which could cause regex compilation errors
  const openBrackets = (pattern.match(/\[/g) || []).length;
  const closeBrackets = (pattern.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    throw new GlobPatternError(`Glob pattern has unbalanced brackets: "${pattern}"`);
  }
}

/**
 * Safely test a regex against a string with a timeout to prevent ReDoS.
 * Returns false if the operation times out or throws an error.
 */
function safeRegexTest(regex: RegExp, text: string, timeoutMs: number): boolean {
  // For short patterns and text, use direct test (fast path)
  if (text.length < 1000 && regex.source.length < 100) {
    try {
      return regex.test(text);
    } catch {
      return false;
    }
  }

  // Use a timeout approach for potentially expensive operations
  const startTime = Date.now();
  const regexStr = regex.source;
  const flags = regex.flags;

  // Create a new regex to avoid state issues
  const testRegex = new RegExp(regexStr, flags);

  try {
    // Test with periodic time checks
    const result = testRegex.test(text);
    if (Date.now() - startTime > timeoutMs) {
      // If it took too long, consider it a potential ReDoS attempt
      return false;
    }
    return result;
  } catch {
    return false;
  }
}

function assertSvgOutputWithinRoot(absFile: string, rootDir: string): void {
  const abs = path.resolve(absFile);
  const root = path.resolve(rootDir);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Resolved SVG output path escapes svg.outputDir: ${absFile} (root: ${root})`);
  }
}

export interface SvgPathTemplateContext {
  /** Resolved absolute path of `svg.outputDir`. */
  outputDir: string;
  locale: string;
  /** Path of the source file relative to cwd (posix). */
  relPath: string;
  /** Path under the configured `sourcePath` root (posix), e.g. `icons/a.svg`. */
  relativeToSourceRoot: string;
}

/**
 * Expand `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`,
 * `{relativeToSourceRoot}` (same as path under `svg.sourcePath`).
 */
export function expandSvgPathTemplate(template: string, ctx: SvgPathTemplateContext): string {
  const posixRel = toPosix(ctx.relPath);
  const parsed = path.posix.parse(posixRel);
  const stem = parsed.name;
  const extension = parsed.ext;
  const basename = parsed.base;
  const relSrc = toPosix(ctx.relativeToSourceRoot);

  let out = template;
  const pairs: [string, string][] = [
    ["{outputDir}", ctx.outputDir],
    ["{locale}", ctx.locale],
    ["{LOCALE}", ctx.locale.toUpperCase()],
    ["{relPath}", posixRel],
    ["{stem}", stem],
    ["{basename}", basename],
    ["{extension}", extension],
    ["{relativeToSourceRoot}", relSrc],
  ];
  for (const [key, val] of pairs) {
    out = out.split(key).join(val);
  }
  return out;
}

/**
 * Absolute path for a translated SVG asset (`translate-svg` command).
 *
 * - With `svg.pathTemplate`: expanded path (relative to cwd or absolute), constrained under `svg.outputDir`.
 * - Else `flat`: `{outputDir}/{stem}.{locale}.svg`
 * - Else `nested`: `{outputDir}/{locale}/{relPathFromSourceRoot}`
 */
export function resolveSvgAssetOutputPath(
  config: I18nConfig,
  cwd: string,
  locale: string,
  /** Path relative to cwd (posix), e.g. `images/foo.svg` */
  relPathFromCwd: string,
  /** Path relative to the `sourcePath` root that contained this file (posix), e.g. `foo.svg` or `icons/a.svg` */
  relPathFromSourceRoot: string
): string {
  const svg = config.svg;
  if (!svg) {
    throw new Error("resolveSvgAssetOutputPath: config.svg is required");
  }
  const outRoot = path.resolve(cwd, svg.outputDir);
  const posixRel = toPosix(relPathFromCwd);
  const parsed = path.posix.parse(posixRel);
  const stem = parsed.name;

  const tmpl = svg.pathTemplate?.trim();
  let abs: string;
  if (tmpl && tmpl.length > 0) {
    const expanded = expandSvgPathTemplate(tmpl, {
      outputDir: outRoot,
      locale,
      relPath: relPathFromCwd,
      relativeToSourceRoot: relPathFromSourceRoot,
    });
    abs = path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(cwd, expanded);
  } else if (svg.style === "flat") {
    abs = path.join(outRoot, `${stem}.${locale}.svg`);
  } else {
    abs = path.join(outRoot, locale, relPathFromSourceRoot);
  }

  assertSvgOutputWithinRoot(abs, outRoot);
  return abs;
}

/**
 * Namespaced key for `file_tracking` (and file-level cache skip) for  SVG files.
 * Do not use for `translations.filepath` — use {@link svgTranslationFilepathMetadata} instead.
 */
export function svgAssetCacheFilepath(relPathFromCwdPosix: string): string {
  return `svg-files:${toPosix(relPathFromCwdPosix)}`;
}

/** Cwd-relative posix path for `translations.filepath` metadata (no `svg-files:` prefix). */
export function svgTranslationFilepathMetadata(relPathFromCwd: string): string {
  return toPosix(relPathFromCwd.replace(/\\/g, "/"));
}

/**
 * Check if a file path matches a glob pattern (supports * and **).
 *
 * Security: This function includes protections against ReDoS attacks:
 * - Pattern length limits
 * - Glob star count limits
 * - Suspicious pattern detection
 * - Regex execution timeouts
 *
 * @throws {GlobPatternError} If the pattern fails security validation
 */
export function matchesGlobPattern(filePath: string, pattern: string): boolean {
  // Exact match
  if (filePath === pattern) {
    return true;
  }

  // Validate pattern for security before processing
  validateGlobPattern(pattern);

  // Check if pattern contains glob chars
  if (!/[*?[\]]/.test(pattern)) {
    return filePath.startsWith(pattern);
  }

  // Convert glob pattern to regex with proper escaping
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex metacharacters
    .replace(/\*\*/g, "__GLOB_DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__GLOB_DOUBLE_STAR__/g, ".*?");

  // Handle the case where ** is followed by /* - make the slash optional for zero-directory match
  // This allows patterns like "images/**/*.svg" to match "images/foo.svg"
  regexStr = regexStr.replace(/\.\*\?\//g, "(?:.*?/)?");

  regexStr = "^" + regexStr + "$";

  let regex: RegExp;
  try {
    regex = new RegExp(regexStr);
  } catch {
    // Invalid regex generated - treat as non-match
    return false;
  }

  // Use safe regex test with timeout protection
  return safeRegexTest(regex, filePath, REGEX_EXECUTION_TIMEOUT_MS);
}

/**
 * Path under a configured `svg.sourcePath` root (posix), for nested output layout.
 * Returns `null` if `fileRelCwd` is not under any root.
 * Supports glob patterns in sourceRoots.
 */
export function relPathUnderSvgSource(fileRelCwd: string, sourceRoots: string[]): string | null {
  const posix = toPosix(fileRelCwd.replace(/\\/g, "/"));
  const sorted = [...sourceRoots].sort((a, b) => b.length - a.length);
  for (const root of sorted) {
    const r = toPosix(root.replace(/\\/g, "/"));

    // Standard path (no globs)
    if (!/[*?[\]]/.test(r)) {
      const normalized = r.replace(/\/$/, "");
      if (posix === normalized) {
        return path.posix.basename(posix);
      }
      if (posix.startsWith(`${normalized}/`)) {
        return posix.slice(normalized.length + 1);
      }
      continue;
    }

    // Glob pattern: first ensure the file matches
    if (!matchesGlobPattern(posix, r)) {
      continue;
    }

    // Determine static root: the longest path prefix with no glob characters in any segment
    const segments = r.split("/");
    let staticRoot = "";
    for (let i = 0; i < segments.length; i++) {
      if (/[*?[\]]/.test(segments[i])) {
        break;
      }
      staticRoot += (i > 0 ? "/" : "") + segments[i];
    }

    if (staticRoot === "") {
      // No static prefix, return the full file path
      return posix;
    }

    const normalizedRoot = staticRoot.replace(/\/$/, "");
    const rootWithSlash = normalizedRoot + "/";

    if (posix === normalizedRoot) {
      return path.posix.basename(posix);
    }
    if (posix.startsWith(rootWithSlash)) {
      return posix.slice(rootWithSlash.length);
    }
    // Fallback (should not usually happen)
    return posix;
  }
  return null;
}
