import path from "path";
import { resolveDocTrackingKeyToAbs } from "./doc-file-tracking.js";

/** Namespace prefix for standalone SVG asset rows in `translations.filepath` / `file_tracking.filepath`. */
export const SVG_ASSETS_PREFIX = "svg-assets:";

/**
 * Resolve a cache key stored in `translations.filepath` or `file_tracking.filepath` to an absolute
 * path on disk for existence checks (`cleanup`, orphan pruning).
 *
 * - `doc-block:*` — documentation file tracking (see {@link resolveDocTrackingKeyToAbs})
 * - `svg-assets:*` — SVG source path relative to project root
 * - any other string — treated as a path relative to project root
 */
export function resolveCacheTrackingKeyToAbs(projectRoot: string, key: string): string {
  if (key.startsWith(SVG_ASSETS_PREFIX)) {
    const rel = key.slice(SVG_ASSETS_PREFIX.length);
    return path.resolve(projectRoot, rel);
  }
  return resolveDocTrackingKeyToAbs(projectRoot, key);
}
