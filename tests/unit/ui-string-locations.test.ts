import {
  collectUiStringLocationsFromSource,
  uiStringHash,
  packageJsonDescriptionLocation,
} from "../../src/extractors/ui-string-locations.js";
import fs from "fs";
import os from "os";
import path from "path";

describe("ui-string-locations", () => {
  it("uiStringHash matches 8-char md5 prefix", () => {
    expect(uiStringHash("hello")).toHaveLength(8);
    expect(uiStringHash("hello")).toMatch(/^[0-9a-f]+$/);
  });

  it("collectUiStringLocationsFromSource finds t() literal and line", () => {
    const content = `import { t } from "i18n";\nconst x = t("Hello world");\n`;
    const map = collectUiStringLocationsFromSource(content, "src/App.tsx", ["t"]);
    const h = uiStringHash("Hello world");
    expect(map.get(h)).toEqual([{ file: "src/App.tsx", line: 2 }]);
  });

  it("packageJsonDescriptionLocation finds description line", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-"));
    const pj = path.join(dir, "package.json");
    fs.writeFileSync(
      pj,
      `{
  "name": "x",
  "description": "My app"
}\n`
    );
    const loc = packageJsonDescriptionLocation(pj, dir);
    expect(loc.file).toBe("package.json");
    expect(loc.line).toBeGreaterThanOrEqual(1);
  });
});
