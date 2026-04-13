import fs from "fs";
import os from "os";
import path from "path";
import { isIgnored, loadTranslateIgnore } from "../../src/utils/ignore-parser.js";

describe("ignore-parser", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-ignore-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loadTranslateIgnore returns empty matcher when file missing", () => {
    const ig = loadTranslateIgnore(".translate-ignore", tmpDir);
    expect(ig.ignores("anything.txt")).toBe(false);
  });

  it("loadTranslateIgnore loads patterns and skips comments/blank", () => {
    const ignorePath = path.join(tmpDir, ".translate-ignore");
    fs.writeFileSync(
      ignorePath,
      `# comment
node_modules/
*.log

dist/
`,
      "utf8"
    );
    const ig = loadTranslateIgnore(".translate-ignore", tmpDir);
    expect(ig.ignores("node_modules/foo")).toBe(true);
    expect(ig.ignores("dist/a")).toBe(true);
    expect(ig.ignores("src/a.ts")).toBe(false);
  });

  it("loadTranslateIgnore accepts absolute path", () => {
    const ignorePath = path.join(tmpDir, "custom.ignore");
    fs.writeFileSync(ignorePath, "secret/\n", "utf8");
    const ig = loadTranslateIgnore(ignorePath, tmpDir);
    expect(ig.ignores("secret/x")).toBe(true);
  });

  it("isIgnored returns false for paths outside cwd", () => {
    const ig = loadTranslateIgnore(".translate-ignore", tmpDir);
    expect(isIgnored(ig, "/other/root/file.txt", tmpDir)).toBe(false);
  });

  it("isIgnored matches relative path under cwd", () => {
    const ignorePath = path.join(tmpDir, ".translate-ignore");
    fs.writeFileSync(ignorePath, "vendor/\n", "utf8");
    const ig = loadTranslateIgnore(".translate-ignore", tmpDir);
    const file = path.join(tmpDir, "vendor", "x.ts");
    expect(isIgnored(ig, file, tmpDir)).toBe(true);
  });
});
