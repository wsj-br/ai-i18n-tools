import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  bundledMasterAvailable,
  isRunningInSea,
  readBundledMasterJson,
  readSeaAsset,
  readSeaText,
  readUiLocaleAsset,
} from "../../src/core/sea-assets.js";
import { createDashboardStaticMiddleware } from "../../src/server/translation-dashboard.js";

describe("SEA asset fallback", () => {
  it("reports a normal Node process as not a SEA binary", () => {
    expect(isRunningInSea()).toBe(false);
    expect(readSeaText("data/ui-languages-complete.json")).toBeNull();
    expect(readSeaAsset("dashboard-app/index.html")).toBeNull();
  });

  it("reads a master catalog from disk when the path exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sea-assets-"));
    const file = path.join(dir, "ui-languages-complete.json");
    fs.writeFileSync(file, '[{"code":"en-GB"}]\n', "utf8");
    try {
      expect(bundledMasterAvailable(file)).toBe(true);
      expect(readBundledMasterJson(file)).toContain("en-GB");
      expect(bundledMasterAvailable(path.join(dir, "missing.json"))).toBe(false);
      const locale = path.join(dir, "en.json");
      fs.writeFileSync(locale, '{"Hello":"Hello"}\n', "utf8");
      expect(readUiLocaleAsset("en.json", locale)).toContain("Hello");
      expect(readUiLocaleAsset("missing.json", path.join(dir, "nope.json"))).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("serves dashboard files from disk outside a SEA binary", () => {
    const middleware = createDashboardStaticMiddleware(path.join(os.tmpdir(), "missing-dashboard"));
    expect(typeof middleware).toBe("function");
  });
});
