import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { isNativeBinary } from "../../scripts/lib/spawn-package-manager.mjs";

const tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tmpFile(name: string, contents: Buffer | string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spawn-pm-"));
  tmpDirs.push(dir);
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, contents);
  return filePath;
}

describe("isNativeBinary", () => {
  it("detects ELF magic (pnpm-native on Linux CI)", () => {
    const elf = tmpFile("pnpm-native", Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0]));
    expect(isNativeBinary(elf)).toBe(true);
  });

  it("detects Windows PE / MZ magic", () => {
    const pe = tmpFile("pnpm-native.exe", Buffer.from([0x4d, 0x5a, 0x90, 0x00]));
    expect(isNativeBinary(pe)).toBe(true);
  });

  it("treats JS / shell placeholders as non-native", () => {
    const js = tmpFile("pnpm.mjs", 'console.log("ok");\n');
    const shell = tmpFile("pnpm", "# placeholder\nif ! command -v node; then exit 1; fi\n");
    expect(isNativeBinary(js)).toBe(false);
    expect(isNativeBinary(shell)).toBe(false);
  });

  it("returns false for missing paths", () => {
    const missing = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "definitely-missing-pnpm-native"
    );
    expect(isNativeBinary(missing)).toBe(false);
  });
});
