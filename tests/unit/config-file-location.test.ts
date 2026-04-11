import fs from "fs";
import os from "os";
import path from "path";
import {
  resolveConfigFileLocation,
} from "../../src/cli/helpers.js";
import { ConfigValidationError } from "../../src/core/errors.js";

describe("resolveConfigFileLocation", () => {
  let tmp: string;
  let child: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai18n-cfg-"));
    child = path.join(tmp, "nested");
    fs.mkdirSync(child, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("finds config in searchCwd when present", () => {
    const p = path.join(child, "ai-i18n-tools.config.json");
    fs.writeFileSync(p, "{}", "utf8");
    expect(resolveConfigFileLocation(undefined, child)).toBe(path.resolve(p));
  });

  it("finds default config in parent when missing in searchCwd", () => {
    const p = path.join(tmp, "ai-i18n-tools.config.json");
    fs.writeFileSync(p, "{}", "utf8");
    expect(resolveConfigFileLocation(undefined, child)).toBe(path.resolve(p));
  });

  it("throws with both paths when default name missing in cwd and parent", () => {
    expect(() => resolveConfigFileLocation(undefined, child)).toThrow(ConfigValidationError);
    try {
      resolveConfigFileLocation(undefined, child);
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigValidationError);
      expect((e as Error).message).toContain("also checked:");
    }
  });

  it("does not use parent when a relative path with directories is used", () => {
    const p = path.join(tmp, "ai-i18n-tools.config.json");
    fs.writeFileSync(p, "{}", "utf8");
    expect(() => resolveConfigFileLocation("sub/ai-i18n-tools.config.json", child)).toThrow(
      ConfigValidationError
    );
  });
});
