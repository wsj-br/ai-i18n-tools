/**
 * Node.js Single Executable Application assets, with a filesystem fallback
 * for `node` / `pnpm` runs. `node:sea` throws when the process is not a SEA
 * binary, so the require is guarded.
 */
import { createRequire } from "node:module";
import fs from "node:fs";

interface SeaApi {
  isSea: () => boolean;
  getAsset: (key: string) => ArrayBuffer;
}

let seaApi: SeaApi | null | undefined;

function loadSea(): SeaApi | null {
  if (seaApi !== undefined) {
    return seaApi;
  }
  try {
    const require = createRequire(import.meta.url);
    const sea = require("node:sea") as Partial<SeaApi>;
    if (typeof sea.isSea === "function" && sea.isSea() && typeof sea.getAsset === "function") {
      seaApi = sea as SeaApi;
    } else {
      seaApi = null;
    }
  } catch {
    seaApi = null;
  }
  return seaApi;
}

export function isRunningInSea(): boolean {
  return loadSea() !== null;
}

export function readSeaAsset(key: string): Buffer | null {
  const sea = loadSea();
  if (!sea) {
    return null;
  }
  try {
    return Buffer.from(sea.getAsset(key));
  } catch {
    return null;
  }
}

export function readSeaText(key: string): string | null {
  const bytes = readSeaAsset(key);
  return bytes ? bytes.toString("utf8") : null;
}

/** True when the bundled master catalog can be read from disk or from the SEA blob. */
export function bundledMasterAvailable(absPath: string): boolean {
  if (fs.existsSync(absPath)) {
    return true;
  }
  return readSeaText("data/ui-languages-complete.json") !== null;
}

export function readBundledMasterJson(absPath: string): string {
  if (fs.existsSync(absPath)) {
    return fs.readFileSync(absPath, "utf8");
  }
  const embedded = readSeaText("data/ui-languages-complete.json");
  if (embedded !== null) {
    return embedded;
  }
  return fs.readFileSync(absPath, "utf8");
}

export function readUiLocaleAsset(name: string, filesystemPath: string): string | null {
  const embedded = readSeaText(`i18n/locales/${name}`);
  if (embedded !== null) {
    return embedded;
  }
  try {
    return fs.readFileSync(filesystemPath, "utf8");
  } catch {
    return null;
  }
}
