import path from "path";

/**
 * Namespaces documentation file-tracking keys in the shared SQLite cache when multiple
 * `docs` blocks exist, so the same relative path in different blocks does not collide.
 */
const PREFIX = "doc-block:";
const JSON_PREFIX = "json-block:";
const META_PREFIX = "nextra-meta:";
const FUMADOCS_META_PREFIX = "fumadocs-meta:";
const DICTIONARY_PREFIX = "nextra-dictionary:";
const VITEPRESS_THEME_PREFIX = "vitepress-theme:";
const FUMADOCS_UI_PREFIX = "fumadocs-ui:";

/**
 * @param relPath - Path segment after the block id: project-root-relative posix (e.g. markdown under
 *   `contentPaths`, or JSON sources as cwd-relative paths so cleanup can resolve them next to `jsonSource`).
 */
export function documentationFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${PREFIX}${blockIndex}:${p}`;
}

/** Resolve a stored filepath key to an absolute path under project root for existence checks. */
export function resolveDocTrackingKeyToAbs(projectRoot: string, filepath: string): string {
  for (const prefix of [
    PREFIX,
    JSON_PREFIX,
    META_PREFIX,
    FUMADOCS_META_PREFIX,
    DICTIONARY_PREFIX,
    VITEPRESS_THEME_PREFIX,
    FUMADOCS_UI_PREFIX,
  ]) {
    if (filepath.startsWith(prefix)) {
      const rest = filepath.slice(prefix.length);
      const idx = rest.indexOf(":");
      if (idx >= 0) {
        const rel = rest.slice(idx + 1);
        return path.resolve(projectRoot, rel);
      }
    }
  }
  return path.resolve(projectRoot, filepath);
}

/**
 * For editor / server console links: `doc-block:{n}:rel/path` → `rel/path`; returns `filepath` unchanged
 * when it is not a documentation file-tracking key (e.g. plain paths, `svg-files:…`).
 */
export function metaFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${META_PREFIX}${blockIndex}:${p}`;
}

export function dictionaryFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${DICTIONARY_PREFIX}${blockIndex}:${p}`;
}

export function vitepressThemeFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${VITEPRESS_THEME_PREFIX}${blockIndex}:${p}`;
}

export function fumadocsMetaFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${FUMADOCS_META_PREFIX}${blockIndex}:${p}`;
}

export function fumadocsUiFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${FUMADOCS_UI_PREFIX}${blockIndex}:${p}`;
}

export function jsonBlockFileTrackingKey(blockIndex: number, relPath: string): string {
  const p = relPath.split("\\").join("/");
  return `${JSON_PREFIX}${blockIndex}:${p}`;
}

export function docBlockFileTrackingKeyToRelPath(filepath: string): string {
  if (!filepath.startsWith(PREFIX)) return filepath;
  const rest = filepath.slice(PREFIX.length);
  const idx = rest.indexOf(":");
  if (idx < 0) return filepath;
  return rest.slice(idx + 1);
}
