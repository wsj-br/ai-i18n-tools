/**
 * Read and replace `glossary.labelCheckSkips` in the project config.
 * Other keys are left as they are. The previous file bytes are copied beside the config before a write.
 */

import fs from "fs";
import { writeAtomicUtf8 } from "../cli/helpers.js";
import { glossaryLabelCheckSkipSchema, type GlossaryLabelCheckSkip } from "./types.js";
import { configBackupPath } from "./apply-translation-models.js";

export class GlossaryLabelSkipsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlossaryLabelSkipsError";
  }
}

function readConfigRoot(configPath: string): Record<string, unknown> {
  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new GlossaryLabelSkipsError(`Could not read ${configPath}: ${msg}`);
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new GlossaryLabelSkipsError("Config root must be a JSON object");
  }
  return json as Record<string, unknown>;
}

/** Current `glossary.labelCheckSkips`, or an empty list when the key is absent. */
export function readLabelCheckSkips(configPath: string): GlossaryLabelCheckSkip[] {
  const root = readConfigRoot(configPath);
  const glossary = root.glossary;
  if (!glossary || typeof glossary !== "object" || Array.isArray(glossary)) {
    return [];
  }
  const raw = (glossary as Record<string, unknown>).labelCheckSkips;
  if (raw === undefined) {
    return [];
  }
  const parsed = glossaryLabelCheckSkipSchema.array().safeParse(raw);
  if (!parsed.success) {
    throw new GlossaryLabelSkipsError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  return parsed.data;
}

/**
 * Replace `glossary.labelCheckSkips`. Returns the backup path.
 * An empty list removes the key.
 */
export function writeLabelCheckSkips(
  configPath: string,
  skips: readonly GlossaryLabelCheckSkip[],
  now: Date = new Date()
): string {
  const parsed = glossaryLabelCheckSkipSchema.array().safeParse(skips);
  if (!parsed.success) {
    throw new GlossaryLabelSkipsError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const root = readConfigRoot(configPath);
  const glossaryRaw = root.glossary;
  const glossary =
    glossaryRaw && typeof glossaryRaw === "object" && !Array.isArray(glossaryRaw)
      ? (glossaryRaw as Record<string, unknown>)
      : {};
  if (parsed.data.length === 0) {
    delete glossary.labelCheckSkips;
  } else {
    glossary.labelCheckSkips = parsed.data;
  }
  root.glossary = glossary;
  const backupPath = configBackupPath(configPath, now);
  try {
    fs.copyFileSync(configPath, backupPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new GlossaryLabelSkipsError(`Could not back up ${configPath}: ${msg}`);
  }
  try {
    writeAtomicUtf8(configPath, `${JSON.stringify(root, null, 2)}\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new GlossaryLabelSkipsError(`Could not write ${configPath}: ${msg}`);
  }
  return backupPath;
}
