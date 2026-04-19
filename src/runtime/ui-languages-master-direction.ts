import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeManifestLocaleKey } from "../core/locale-utils.js";

/** Sync load avoids Node 20+ JSON import-attribute requirements when consumers use `module: Node16` builds. */
const masterPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "ui-languages-complete.json"
);
const master = JSON.parse(fs.readFileSync(masterPath, "utf8")) as unknown[];

const DIRECTION_BY_KEY = new Map<string, "ltr" | "rtl">();

for (const item of master) {
  if (item === null || typeof item !== "object") continue;
  const o = item as Record<string, unknown>;
  const code = typeof o.code === "string" ? o.code.trim() : "";
  if (!code) continue;
  const dir = o.direction;
  const direction: "ltr" | "rtl" = dir === "rtl" ? "rtl" : "ltr";
  DIRECTION_BY_KEY.set(normalizeManifestLocaleKey(code), direction);
}

/**
 * Text direction for `lng` from the bundled `data/ui-languages-complete.json` only (not from project `ui-languages.json`).
 */
export function getTextDirectionFromBundledCatalog(lng: string): "ltr" | "rtl" | undefined {
  if (!lng?.trim()) {
    return undefined;
  }
  return DIRECTION_BY_KEY.get(normalizeManifestLocaleKey(lng));
}
