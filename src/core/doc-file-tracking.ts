import path from "path";

/**
 * Namespaces documentation file-tracking keys in the shared SQLite cache when multiple
 * `documentations` blocks exist, so the same relative path in different blocks does not collide.
 */
const PREFIX = "doc-block:";

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
  if (filepath.startsWith(PREFIX)) {
    const rest = filepath.slice(PREFIX.length);
    const idx = rest.indexOf(":");
    if (idx >= 0) {
      const rel = rest.slice(idx + 1);
      return path.resolve(projectRoot, rel);
    }
  }
  return path.resolve(projectRoot, filepath);
}
