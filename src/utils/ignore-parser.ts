import fs from "fs";
import path from "path";
import ignore from "ignore";

/**
 * Load gitignore-style patterns from `.translate-ignore` (or custom path).
 */
export function loadTranslateIgnore(
  ignoreFilePath: string,
  cwd = process.cwd()
): ReturnType<typeof ignore> {
  const ig = ignore();
  const resolved = path.isAbsolute(ignoreFilePath)
    ? ignoreFilePath
    : path.join(cwd, ignoreFilePath);
  if (!fs.existsSync(resolved)) {
    return ig;
  }
  const raw = fs.readFileSync(resolved, "utf8");
  ig.add(raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#")));
  return ig;
}

export function isIgnored(
  ig: ReturnType<typeof ignore>,
  filepath: string,
  cwd = process.cwd()
): boolean {
  const rel = path.relative(cwd, filepath).split(path.sep).join("/");
  if (rel.startsWith("..")) {
    return false;
  }
  return ig.ignores(rel);
}
