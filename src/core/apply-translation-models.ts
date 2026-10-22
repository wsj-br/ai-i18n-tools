/**
 * Replace one provider's `translationModels` in the config file.
 * Other keys, including `uiModels` and `localeModels`, are left as they are.
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

export function replaceProviderTranslationModels(
  configPath: string,
  provider: string,
  modelIds: readonly string[]
): void {
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
  (entry as Record<string, unknown>).translationModels = ids;
  try {
    writeAtomicUtf8(resolved, `${JSON.stringify(root, null, 2)}\n`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new TranslationModelsApplyError(`Could not write ${resolved}: ${msg}`);
  }
}
