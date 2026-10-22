import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runExtract } from "../../src/cli/extract-strings.js";
import {
  pythonScaffoldOptionsForTemplate,
  renderPythonI18nHelper,
} from "../../src/cli/python-init-scaffold.js";
import { loadI18nConfigFromFile } from "../../src/core/config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const examples = ["python-streamlit", "python-flask", "python-fastapi", "python-gettext"] as const;

function copyExample(name: string): string {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  fs.cpSync(path.join(root, "examples", name), dest, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.translation-cache`),
  });
  return dest;
}

describe("Python examples", () => {
  it("keeps scaffolded i18n.py aligned with the JSON helper", () => {
    const helper = renderPythonI18nHelper(pythonScaffoldOptionsForTemplate("ui-python"));
    for (const name of ["python-streamlit", "python-flask", "python-fastapi"] as const) {
      const file = path.join(root, "examples", name, "i18n.py");
      expect(fs.readFileSync(file, "utf8")).toBe(helper);
    }
  });

  it("re-extracts committed catalogs without rewriting them", () => {
    for (const name of examples) {
      const dest = copyExample(name);
      const catalog = path.join(dest, "locales/strings.json");
      const before = fs.readFileSync(catalog, "utf8");
      const config = loadI18nConfigFromFile(path.join(dest, "ai-i18n-tools.config.json"), dest);
      runExtract(config, dest);
      expect(fs.readFileSync(catalog, "utf8")).toBe(before);
    }
  });
});
