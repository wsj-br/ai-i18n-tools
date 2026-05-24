import fs from "fs";
import path from "path";
import { Minimatch, minimatch } from "minimatch";
import { ConfigValidationError } from "./errors.js";

export type ResolveContentPathOptions = {
  /** File extensions to include (e.g. `.json`, `.md`). Include leading dot. */
  extensions: readonly string[];
  /** Project root for resolving relative paths. */
  projectRoot: string;
};

function hasGlobMagic(p: string): boolean {
  return new Minimatch(p, { nobrace: false, noext: false }).hasMagic();
}

function extMatches(filePath: string, extensions: readonly string[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return extensions.some((e) => e.toLowerCase() === ext);
}

function walkDirForExtensions(dir: string, extensions: readonly string[], out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkDirForExtensions(full, extensions, out);
    } else if (ent.isFile() && extMatches(full, extensions)) {
      out.push(full);
    }
  }
}

function toProjectRelative(projectRoot: string, absPath: string): string {
  return path.relative(projectRoot, absPath).split(path.sep).join("/");
}

function walkGlobFrom(
  projectRoot: string,
  pattern: string,
  extensions: readonly string[]
): string[] {
  const results: string[] = [];
  const absPattern = path.isAbsolute(pattern) ? pattern : path.join(projectRoot, pattern);
  const relPattern = path.relative(projectRoot, absPattern).split(path.sep).join("/");

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const rel = toProjectRelative(projectRoot, full);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && extMatches(full, extensions)) {
        if (minimatch(rel, relPattern, { dot: true })) {
          results.push(rel);
        }
      }
    }
  }
  walk(projectRoot);
  return results;
}

/**
 * Resolve `contentPaths` entries to project-relative posix paths.
 * Each entry may be a file, directory, or glob pattern (minimatch).
 */
export function resolveContentPathEntries(
  entries: string[],
  options: ResolveContentPathOptions
): string[] {
  const { projectRoot, extensions } = options;
  const seen = new Set<string>();
  const out: string[] = [];

  const addAbs = (abs: string): void => {
    if (!extMatches(abs, extensions)) {
      return;
    }
    const rel = toProjectRelative(projectRoot, abs);
    if (!rel || rel.startsWith("..")) {
      return;
    }
    if (!seen.has(rel)) {
      seen.add(rel);
      out.push(rel);
    }
  };

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }

    if (hasGlobMagic(trimmed)) {
      const matched = walkGlobFrom(projectRoot, trimmed, extensions);
      if (matched.length === 0) {
        throw new ConfigValidationError(`contentPaths glob matched no files: ${trimmed}`);
      }
      for (const rel of matched) {
        if (!seen.has(rel)) {
          seen.add(rel);
          out.push(rel);
        }
      }
      continue;
    }

    const abs = path.isAbsolute(trimmed) ? trimmed : path.join(projectRoot, trimmed);
    if (!fs.existsSync(abs)) {
      throw new ConfigValidationError(`contentPaths entry not found: ${trimmed}`);
    }
    const stat = fs.statSync(abs);
    if (stat.isFile()) {
      addAbs(abs);
    } else if (stat.isDirectory()) {
      const collected: string[] = [];
      walkDirForExtensions(abs, extensions, collected);
      if (collected.length === 0) {
        throw new ConfigValidationError(
          `contentPaths directory "${trimmed}" contains no files with extensions: ${extensions.join(", ")}`
        );
      }
      for (const f of collected) {
        addAbs(f);
      }
    }
  }

  out.sort();
  return out;
}
