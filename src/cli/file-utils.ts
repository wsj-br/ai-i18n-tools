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
 * Collect files under `roots` (files or directories) matching `extensions` (e.g. ['.md', '.mdx']).
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

  const walk = (abs: string) => {
    if (!fs.existsSync(abs)) {
      return;
    }
    const st = fs.statSync(abs);
    if (st.isFile()) {
      const ext = path.extname(abs).toLowerCase();
      if (extSet.has(ext)) {
        out.push(path.relative(cwd, abs).split(path.sep).join("/"));
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

  for (const r of roots) {
    const abs = path.isAbsolute(r) ? r : path.join(cwd, r);
    walk(abs);
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
