/**
 * Spawn the active package manager (pnpm/npm/yarn) with the given args.
 *
 * During lifecycle scripts, `npm_execpath` points at the package manager entry.
 * Older JS CLIs need `node <path> …`; pnpm 12 may set a native ELF/PE binary
 * (`pnpm-native`) which must be executed directly — `node` on that path throws
 * `SyntaxError: Invalid or unexpected token` (ELF magic bytes).
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export function isNativeBinary(filePath) {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(4);
    const n = fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    if (n < 2) {
      return false;
    }
    // ELF
    if (n >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
      return true;
    }
    // Windows PE (MZ)
    if (buf[0] === 0x4d && buf[1] === 0x5a) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * @param {string[]} args
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 * @returns {import("node:child_process").SpawnSyncReturns<Buffer | string>}
 */
export function spawnPackageManager(args, options = {}) {
  const execPath = process.env.npm_execpath;
  if (execPath) {
    if (isNativeBinary(execPath)) {
      return spawnSync(execPath, args, options);
    }
    return spawnSync(process.execPath, [execPath, ...args], options);
  }

  return spawnSync(`pnpm ${args.join(" ")}`, {
    ...options,
    shell: true,
  });
}
