import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initConfigTemplates, parseI18nConfig } from "../../src/core/config.js";
import type { StringsJsonEntry } from "../../src/core/types.js";
import {
  RESX_CONTEXT_SEPARATOR,
  catalogEntriesToResx,
  ingestResxTranslations,
  parseResx,
  pluralResxKey,
  resxLocaleFromFileName,
  serializeResx,
} from "../../src/core/resx-codec.js";
import { flatLocaleFiles } from "../../src/cli/purge-locale.js";
import { renderDotnetResxHelper } from "../../src/cli/dotnet-init-scaffold.js";

const newlineKey = "Line1\nLine2";

describe("resx codec", () => {
  const strings: Record<string, StringsJsonEntry> = {
    a: {
      source: "Sign in",
      translated: { de: "Anmelden" },
      locations: [{ file: "Views/Main.axaml", line: 4 }],
    },
    b: {
      source: 'Say "hi" & bye',
      translated: { de: 'Sag "hallo" & tschüss' },
    },
    c: {
      source: newlineKey,
      translated: { de: "Zeile1\nZeile2" },
    },
    d: {
      source: "Open",
      context: "menu",
      translated: { de: "Öffnen" },
    },
    e: {
      plural: true,
      source: "1 sample",
      pluralSource: "{0} samples",
      translated: { de: { one: "1 Probe", other: "{0} Proben" } },
    },
  };

  it("round-trips keys that XML would otherwise rewrite", () => {
    const xml = serializeResx(catalogEntriesToResx(strings, "de", { neutral: false }));
    const parsed = parseResx(xml);
    const contextKey = `menu${RESX_CONTEXT_SEPARATOR}Open`;
    expect(parsed.map((row) => row.name).sort()).toEqual(
      [
        newlineKey,
        contextKey,
        'Say "hi" & bye',
        "Sign in",
        "1 sample[one]",
        "1 sample[other]",
      ].sort()
    );
    const byName = new Map(parsed.map((row) => [row.name, row]));
    expect(byName.get(newlineKey)?.value).toBe("Zeile1\nZeile2");
    expect(byName.get('Say "hi" & bye')?.value).toBe('Sag "hallo" & tschüss');
    expect(byName.get(contextKey)?.value).toBe("Öffnen");
    expect(byName.get("Sign in")?.comment).toContain("Views/Main.axaml:4");
    expect(byName.get(pluralResxKey("1 sample", "other"))?.value).toBe("{0} Proben");
    expect(xml).not.toContain("\u0004");
    expect(parseResx(serializeResx(parsed))).toEqual(
      parsed.map((row) => ({
        name: row.name,
        value: row.value,
        ...(row.comment ? { comment: row.comment } : {}),
      }))
    );
  });

  it("skips typed entries and ingests legacy named keys through the neutral value", () => {
    const neutral = serializeResx([
      { name: "LoginButton", value: "Sign in" },
      { name: "Icon", value: "", comment: "binary" },
    ]);
    const withType = neutral.replace(
      "</root>",
      '  <data name="Icon" type="System.Drawing.Bitmap" mimetype="application/x-microsoft.net.object.binary.base64"><value>AAAA</value></data>\n</root>\n'
    );
    const satellite = serializeResx([{ name: "LoginButton", value: "Anmelden" }]);
    const rows = ingestResxTranslations(satellite, "de", { neutral: parseResx(withType) });
    expect(rows).toEqual([
      expect.objectContaining({
        source: "Sign in",
        locale: "de",
        translation: "Anmelden",
        plural: false,
      }),
    ]);
    expect(parseResx(withType).some((row) => row.name === "Icon" && row.type)).toBe(true);
    expect(rows.some((row) => row.source === "AAAA")).toBe(false);
  });

  it("names satellite files with .NET culture tags and leaves the neutral file alone", () => {
    expect(resxLocaleFromFileName("SharedResource", "SharedResource.resx")).toBeNull();
    expect(resxLocaleFromFileName("SharedResource", "SharedResource.pt-BR.resx")).toBe("pt-BR");
    expect(resxLocaleFromFileName("SharedResource", "SharedResource.pt_BR.resx")).toBe("pt-BR");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "resx-purge-"));
    const resxDir = path.join(dir, "Resources");
    fs.mkdirSync(resxDir);
    fs.writeFileSync(path.join(resxDir, "SharedResource.resx"), "<root></root>");
    fs.writeFileSync(path.join(resxDir, "SharedResource.de.resx"), "<root></root>");
    const config = parseI18nConfig({
      ...initConfigTemplates.uiDotnetResx(),
      provider: "openrouter",
      providers: { openrouter: { translationModels: ["test-model"] } },
    });
    const files = flatLocaleFiles(config, dir, "de");
    expect(files.map((file) => path.basename(file))).toEqual(["SharedResource.de.resx"]);
  });
});

describe("ui-dotnet-resx template", () => {
  it("parses and stamps the resource base name", () => {
    const parsed = parseI18nConfig({
      ...initConfigTemplates.uiDotnetResx(),
      provider: "openrouter",
      providers: { openrouter: { translationModels: ["test-model"] } },
    });
    expect(parsed.ui[0]?.flatOutput).toBe(false);
    expect(parsed.ui[0]?.resx?.baseName).toBe("SharedResource");
    expect(parsed.ui[0]?.resx?.localeFormat).toBe("bcp47");
    const helper = renderDotnetResxHelper({
      namespace: "CursorPace",
      resourceBaseName: "CursorPace.Resources.SharedResource",
    });
    expect(helper).toContain("namespace CursorPace");
    expect(helper).toContain('ResourceBaseName = "CursorPace.Resources.SharedResource"');
  });
});
