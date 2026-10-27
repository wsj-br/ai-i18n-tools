/**
 * Spawn the active package manager (pnpm/npm/yarn) with the given args.
 *
 * During lifecycle scripts, `npm_execpath` points at the package manager entry.
 * Older JS CLIs need `node <path> …`; pnpm 12 may set a native binary
 * (`pnpm-native`) which must be executed directly — `node` on that path throws
 * `SyntaxError: Invalid or unexpected token`. Linux is ELF, Windows is PE,
 * and macOS is Mach-O.
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
    // Mach-O (macOS). Thin 64-bit little-endian is what corepack ships for
    // Apple Silicon and modern Intel. Fat binaries use CA FE BA BE, which is
    // also the Java class magic; npm_execpath is never a .class file.
    if (
      n >= 4 &&
      ((buf[0] === 0xcf && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) ||
        (buf[0] === 0xce && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) ||
        (buf[0] === 0xfe && buf[1] === 0xed && buf[2] === 0xfa && buf[3] === 0xcf) ||
        (buf[0] === 0xfe && buf[1] === 0xed && buf[2] === 0xfa && buf[3] === 0xce) ||
        (buf[0] === 0xca && buf[1] === 0xfe && buf[2] === 0xba && buf[3] === 0xbe))
    ) {
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
