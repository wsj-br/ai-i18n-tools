import masterJson from "./ui-languages-complete.json" with { type: "json" };
import { normalizeManifestLocaleKey } from "../core/locale-utils.js";

/** Compile-time bundle of `data/ui-languages-complete.json` (symlink under `src/runtime/`). */
const master = masterJson as unknown[];

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
