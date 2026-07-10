import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { scaffoldVitepressInitFiles } from "../../src/cli/vitepress-init-scaffold.js";

describe("scaffoldVitepressInitFiles", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("writes config.mts and theme.en.json when missing", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitepress-init-scaffold-"));
    const written = scaffoldVitepressInitFiles(tmpDir);
    expect(written).toEqual(["docs/.vitepress/config.mts", "docs/.vitepress/i18n/theme.en.json"]);

    const config = fs.readFileSync(path.join(tmpDir, "docs/.vitepress/config.mts"), "utf8");
    expect(config).toContain("langMenuLabel: t.langMenuLabel");
    expect(config).toContain("skipToContentLabel: t.skipToContentLabel");

    const theme = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "docs/.vitepress/i18n/theme.en.json"), "utf8")
    ) as Record<string, unknown>;
    expect(theme.langMenuLabel).toBe("Change language");
    expect(theme.skipToContentLabel).toBe("Skip to content");
  });

  it("does not overwrite existing scaffold files", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitepress-init-scaffold-existing-"));
    fs.mkdirSync(path.join(tmpDir, "docs/.vitepress/i18n"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "docs/.vitepress/config.mts"), "// existing\n", "utf8");

    const written = scaffoldVitepressInitFiles(tmpDir);
    expect(written).toEqual(["docs/.vitepress/i18n/theme.en.json"]);
    expect(fs.readFileSync(path.join(tmpDir, "docs/.vitepress/config.mts"), "utf8")).toBe(
      "// existing\n"
    );
  });
});
