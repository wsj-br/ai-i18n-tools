/**
 * Replace one provider's `translationModels` in the config file.
 * Other keys, including `uiModels` and `localeModels`, are left as they are.
 * The previous file bytes are copied beside the config before the write.
 */

import fs from "fs";
import path from "path";
import { writeAtomicUtf8 } from "../cli/helpers.js";

export class TranslationModelsApplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationModelsApplyError";
  }
}

/** Filesystem-safe ISO timestamp (`:` and `.` become `-`). */
export function configBackupTimestamp(now: Date): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

/**
 * Sibling path `basename.{timestamp}.backup.json`. A collision adds `-2`, `-3`, …
 * before `.backup.json`. Matches the repo gitignore rule `*.backup.*`.
 */
export function configBackupPath(configPath: string, now: Date = new Date()): string {
  const resolved = path.resolve(configPath);
  const dir = path.dirname(resolved);
  const ext = path.extname(resolved);
  const base = ext.length > 0 ? path.basename(resolved, ext) : path.basename(resolved);
  const stem = `${base}.${configBackupTimestamp(now)}`;
  let name = `${stem}.backup.json`;
  let n = 2;
  while (fs.existsSync(path.join(dir, name))) {
    name = `${stem}-${n}.backup.json`;
    n += 1;
    if (n > 1000) {
      throw new TranslationModelsApplyError(`Could not choose a backup path for ${resolved}`);
    }
  }
  return path.join(dir, name);
}

/**
 * Copy the current config, then replace `providers.<provider>.translationModels`.
 * Returns the backup path. A failed copy leaves the config unchanged.
 */
export function replaceProviderTranslationModels(
  configPath: string,
  provider: string,
  modelIds: readonly string[],
  now: Date = new Date()
): string {
  const ids = modelIds.map((id) => id.trim()).filter((id) => id.length > 0);
  if (ids.length === 0 || ids.length !== modelIds.length) {
    throw new TranslationModelsApplyError(
      "translationModels must be a non-empty list of model ids"
    );
  }
  const resolved = path.resolve(configPath);
  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(resolved, "utf8")) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new TranslationModelsApplyError(`Could not read ${resolved}: ${msg}`);
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new TranslationModelsApplyError("Config root must be a JSON object");
  }
  const root = json as Record<string, unknown>;
  const providers = root.providers;
  if (!providers || typeof providers !== "object" || Array.isArray(providers)) {
    throw new TranslationModelsApplyError("Config has no providers object");
  }
  const entry = (providers as Record<string, unknown>)[provider];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new TranslationModelsApplyError(`providers.${provider} is not configured`);
  }
  const backupPath = configBackupPath(resolved, now);
  try {
    fs.copyFileSync(resolved, backupPath);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new TranslationModelsApplyError(`Could not back up ${resolved}: ${msg}`);
  }
  (entry as Record<string, unknown>).translationModels = ids;
  try {
    writeAtomicUtf8(resolved, `${JSON.stringify(root, null, 2)}\n`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new TranslationModelsApplyError(`Could not write ${resolved}: ${msg}`);
  }
  return backupPath;
}
