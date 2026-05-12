import fs from "fs";
import crypto from "crypto";

/** Cached file content with precomputed hash and mtime. */
interface CachedFileContent {
  content: string;
  hash: string;
  mtimeMs: number;
}

/**
 * Deduplication cache for file content reads across locales.
 * Caches file content, SHA-256 hash, and mtime to avoid redundant syscalls.
 * Invalidates entries when file mtime changes.
 */
export class FileContentCache {
  private cache = new Map<string, CachedFileContent>();

  /**
   * Read file content with caching.
   * Returns cached result if mtime matches, otherwise re-reads from disk.
   */
  readFile(absPath: string): { content: string; hash: string; mtime: string } {
    const stat = fs.statSync(absPath);
    const mtimeMs = stat.mtimeMs;
    const cached = this.cache.get(absPath);

    if (cached && cached.mtimeMs === mtimeMs) {
      return {
        content: cached.content,
        hash: cached.hash,
        mtime: stat.mtime.toISOString(),
      };
    }

    const content = fs.readFileSync(absPath, "utf8");
    const hash = crypto.createHash("sha256").update(content, "utf8").digest("hex");

    this.cache.set(absPath, { content, hash, mtimeMs });

    return {
      content,
      hash,
      mtime: stat.mtime.toISOString(),
    };
  }

  /** Clear all cached entries. */
  clear(): void {
    this.cache.clear();
  }

  /** Get current cache size for debugging/monitoring. */
  get size(): number {
    return this.cache.size;
  }
}
