import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import chalk from "chalk";

/** Basenames matched by `find … \( -name '*.log' -o -name 'cache.db.backup*.sqlite' \)`. */
export function matchesCleanTempBasename(basename: string): boolean {
  if (basename.endsWith(".log")) return true;
  if (basename.endsWith(".tmp")) return true;
  if (basename.startsWith("cache.db.backup") && basename.endsWith(".sqlite")) return true;
  return false;
}

/** Print path like `find . -print` (posix-style `./…` under `rootAbs`). */
export function formatFindPrintLine(rootAbs: string, fileAbs: string): string {
  const rel = path.relative(rootAbs, fileAbs);
  const norm = rel.split(path.sep).join("/");
  if (norm === "" || norm === ".") return "./";
  return `[clean-temp]` + chalk.cyan(` ./${norm}`);
}

async function collectCleanTempFiles(rootAbs: string): Promise<string[]> {
  const out: string[] = [];

  async function visit(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isSymbolicLink()) {
        let st: fs.Stats;
        try {
          st = await fs.promises.lstat(full);
        } catch {
          continue;
        }
        if (st.isDirectory()) continue;
        if (matchesCleanTempBasename(ent.name)) out.push(full);
        continue;
      }
      if (ent.isDirectory()) {
        await visit(full);
      } else if (ent.isFile() && matchesCleanTempBasename(ent.name)) {
        out.push(full);
      }
    }
  }

  await visit(rootAbs);
  return out;
}

async function promptDeleteConfirmed(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(chalk.red("\nDelete these files? (y/n) "));
    return ans === "y";
  } finally {
    rl.close();
  }
}

export type RunCleanTempOptions = {
  rootDir: string;
  /** When true, skip the prompt and do not delete (list only). Overrides `force`. */
  dryRun?: boolean;
  /** When true, delete without prompting (after listing). Ignored when `dryRun` is true. */
  force?: boolean;
};

/**
 * Lists `*.log` and `cache.db.backup*.sqlite` under `rootDir`, prints paths like `find -print`,
 * then prompts unless `force` or there are no matches; deletes on exact `y`, or immediately when `force`.
 */
export async function runCleanTemp(opts: RunCleanTempOptions): Promise<void> {
  const rootAbs = path.resolve(opts.rootDir);
  if (!fs.existsSync(rootAbs)) {
    console.error(`Directory not found: ${rootAbs}`);
    process.exitCode = 1;
    return;
  }
  const st = await fs.promises.stat(rootAbs);
  if (!st.isDirectory()) {
    console.error(`Not a directory: ${rootAbs}`);
    process.exitCode = 1;
    return;
  }

  const files = await collectCleanTempFiles(rootAbs);
  for (const abs of files) {
    console.log(formatFindPrintLine(rootAbs, abs));
  }

  if (opts.dryRun) {
    if (files.length > 0) {
      console.log(chalk.gray("Dry run mode: no files will be deleted."));
    } else {
      console.log(chalk.green("Dry run mode: no files to delete."));
    }
    return;
  }

  if (files.length === 0) {
    console.log(chalk.green("No files to delete."));
    return;
  }

  const ok = opts.force ? true : await promptDeleteConfirmed();
  if (!ok) {
    return;
  }

  for (const abs of files) {
    try {
      await fs.promises.unlink(abs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Failed to delete ${formatFindPrintLine(rootAbs, abs)}: ${msg}`);
      process.exitCode = 1;
    }
  }
}
