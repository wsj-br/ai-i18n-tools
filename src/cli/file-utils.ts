import fs from "fs";
import path from "path";

export function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path contains glob special characters (*, ?, []).
 */
export function isGlobPattern(p: string): boolean {
  return /[*?[\]]/.test(p);
}

/**
 * Match a filepath against a simple glob pattern (supports * and **).
 * The pattern must match the full path from the start.
 */
export function matchGlob(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // Escape special regex characters except our glob wildcards
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "__GLOB_DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__GLOB_DOUBLE_STAR__/g, ".*");

  // Ensure the pattern matches the whole string
  regexStr = "^" + regexStr + "$";

  const regex = new RegExp(regexStr);
  return regex.test(filePath);
}

/**
 * Collect files under `roots` (files or directories, with optional glob patterns)
 * matching `extensions` (e.g. ['.md', '.mdx']).
 */
export function collectFilesByExtension(
  roots: string[],
  extensions: string[],
  cwd: string
): string[] {
  const extSet = new Set(
    extensions.map((e) => (e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`))
  );
  const out: string[] = [];
  const seen = new Set<string>();

  // Helper to add a file if it matches extensions
  const addFile = (abs: string, relFromCwd: string) => {
    if (seen.has(relFromCwd)) {
      return;
    }
    if (extSet.has(path.extname(abs).toLowerCase())) {
      seen.add(relFromCwd);
      out.push(relFromCwd);
    }
  };

  // Walk a directory recursively
  const walk = (abs: string) => {
    if (!fs.existsSync(abs)) {
      return;
    }
    const st = fs.statSync(abs);
    if (st.isFile()) {
      addFile(abs, path.relative(cwd, abs).split(path.sep).join("/"));
      return;
    }
    if (!st.isDirectory()) {
      return;
    }
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".git") {
        continue;
      }
      walk(path.join(abs, ent.name));
    }
  };

  // Handle glob patterns - find matching files
  const handleGlob = (globPattern: string) => {
    const absGlobRoot = path.isAbsolute(globPattern) ? globPattern : path.join(cwd, globPattern);

    // If it's just a directory path (no glob chars), walk it normally
    if (!isGlobPattern(globPattern)) {
      walk(absGlobRoot);
      return;
    }

    // It has glob patterns - need to find matches
    // Split into directory part and pattern part
    const lastSlash = absGlobRoot.lastIndexOf(path.sep);
    let dirPart: string;
    let filePattern: string;

    if (lastSlash === -1) {
      dirPart = ".";
      filePattern = globPattern;
    } else {
      dirPart = absGlobRoot.substring(0, lastSlash) || ".";
      filePattern = absGlobRoot.substring(lastSlash + 1);
    }

    // If directory doesn't exist, skip
    if (!fs.existsSync(dirPart)) {
      return;
    }

    // If it's a ** pattern, we need to walk recursively
    if (filePattern.includes("**")) {
      const walkWithGlob = (dir: string) => {
        if (!fs.existsSync(dir)) {
          return;
        }
        const st = fs.statSync(dir);
        if (!st.isDirectory()) {
          return;
        }
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
          if (ent.name === "node_modules" || ent.name === ".git") {
            continue;
          }
          const fullPath = path.join(dir, ent.name);
          const relFromCwd = path.relative(cwd, fullPath).split(path.sep).join("/");
          if (ent.isDirectory()) {
            walkWithGlob(fullPath);
          } else {
            // Check if file matches the pattern
            if (
              matchGlob(ent.name, filePattern) ||
              matchGlob(path.basename(fullPath), filePattern)
            ) {
              addFile(fullPath, relFromCwd);
            }
          }
        }
      };
      walkWithGlob(dirPart);
    } else {
      // Simple pattern - just match in the directory
      if (fs.existsSync(dirPart)) {
        const st = fs.statSync(dirPart);
        if (st.isDirectory()) {
          for (const ent of fs.readdirSync(dirPart, { withFileTypes: true })) {
            if (ent.name === "node_modules" || ent.name === ".git") {
              continue;
            }
            const fullPath = path.join(dirPart, ent.name);
            const relFromCwd = path.relative(cwd, fullPath).split(path.sep).join("/");
            if (ent.isFile() && matchGlob(ent.name, filePattern)) {
              addFile(fullPath, relFromCwd);
            }
          }
        } else if (st.isFile() && matchGlob(path.basename(dirPart), filePattern)) {
          const relFromCwd = path.relative(cwd, dirPart).split(path.sep).join("/");
          addFile(dirPart, relFromCwd);
        }
      }
    }
  };

  for (const r of roots) {
    handleGlob(r);
  }

  return [...new Set(out)].sort();
}

/**
 * Paths relative to `root` (posix slashes), for JSON/SVG roots that are not cwd.
 */
export function collectFilesRelativeToRoot(root: string, extensions: string[]): string[] {
  const extSet = new Set(
    extensions.map((e) => (e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`))
  );
  const absRoot = path.resolve(root);
  const out: string[] = [];

  const walk = (abs: string) => {
    if (!fs.existsSync(abs)) {
      return;
    }
    const st = fs.statSync(abs);
    if (st.isFile()) {
      const ext = path.extname(abs).toLowerCase();
      if (extSet.has(ext)) {
        out.push(path.relative(absRoot, abs).split(path.sep).join("/"));
      }
      return;
    }
    if (!st.isDirectory()) {
      return;
    }
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".git") {
        continue;
      }
      walk(path.join(abs, ent.name));
    }
  };

  walk(absRoot);
  return [...new Set(out)].sort();
}
