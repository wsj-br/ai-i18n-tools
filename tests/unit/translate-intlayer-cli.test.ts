import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { I18nConfig } from "../../src/core/types.js";
import {
  runTranslateIntlayer,
  type TranslateDelegateOptions,
} from "../../src/cli/translate-intlayer.js";

function writeTree(root: string, files: Record<string, string>): void {
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body, "utf8");
  }
}

function configFor(): I18nConfig {
  return {
    sourceLocale: "en",
    targetLocales: ["de", "fr"],
    cacheDir: ".translation-cache",
    features: { translateUIStrings: true, translateDocs: false, translateJson: false },
    ui: [
      {
        sourceRoots: ["src"],
        stringsJson: "src/locales/strings.json",
        flatOutputDir: "src/locales",
        uiGlossary: true,
      },
    ],
  } as unknown as I18nConfig;
}

const DICT = `import { t, type Dictionary } from "intlayer";

export default {
  key: "dashboard",
  content: {
    heading: t({
      en: "Overview",
      de: "Übersicht",
    }),
    servers: t({
      en: "Servers",
    }),
    help: t({ en: "Help for {pageName}" }),
  },
} satisfies Dictionary;
`;

/**
 * Fake translate delegate: reads the seeded strings.json, fills every requested locale with
 * `<locale>:<source>`, and writes it back — mirroring what `runTranslateUI` does to disk.
 */
function fakeTranslateFactory(dir: string) {
  return async (_config: I18nConfig, opts: TranslateDelegateOptions): Promise<void> => {
    const stringsPath = path.join(dir, "src/locales/strings.json");
    const strings = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
      string,
      { source: string; translated: Record<string, string> }
    >;
    for (const entry of Object.values(strings)) {
      entry.translated = entry.translated ?? {};
      for (const locale of opts.locales) {
        if (!entry.translated[locale]) {
          entry.translated[locale] = `${locale}:${entry.source}`;
        }
      }
    }
    fs.writeFileSync(stringsPath, `${JSON.stringify(strings, null, 2)}\n`, "utf8");
  };
}

describe("runTranslateIntlayer", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
    vi.restoreAllMocks();
  });

  function setup(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "translate-intlayer-"));
    dirs.push(dir);
    writeTree(dir, { "src/content/dashboard.content.ts": DICT });
    return dir;
  }

  it("dry run reports missing counts without writing", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    const sum = await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: true,
    });
    expect(sum.written).toBe(false);
    // heading: fr missing (de present). servers: de+fr missing. help: de+fr missing. => 5
    expect(sum.pairsTranslated).toBe(5);
    expect(sum.pairsMissing).toBe(5);
    expect(sum.pairsStale).toBe(0);
    expect(sum.localesTouched.sort()).toEqual(["de", "fr"]);
    // source file untouched
    expect(fs.readFileSync(path.join(dir, "src/content/dashboard.content.ts"), "utf8")).toBe(DICT);
  });

  it("dry run does not create the cache directory or catalog", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    await runTranslateIntlayer({ cwd: dir, config: configFor(), dryRun: true });
    expect(fs.existsSync(path.join(dir, ".translation-cache"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "src/locales/strings.json"))).toBe(false);
  });

  it("flags a human-authored translation as stale once its source changes", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    // First run baselines the existing human `heading.de` ("Übersicht").
    await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    const file = path.join(dir, "src/content/dashboard.content.ts");
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf8").replace(`en: "Overview",`, `en: "Summary",`),
      "utf8"
    );
    const sum = await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    // heading: de (human) and fr (generated) are both stale now.
    expect(sum.pairsStale).toBe(2);
    expect(fs.readFileSync(file, "utf8")).toContain(`de: "de:Summary"`);
  });

  it("passes the chosen ui block index to the translate delegate", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    const seen: Array<string | undefined> = [];
    const fake = fakeTranslateFactory(dir);
    await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: async (c, o) => {
        seen.push(o.uiBlock);
        await fake(c, o);
      },
    });
    expect(seen).toEqual(["0"]);
  });

  it("writes missing locales back into the dictionary", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    const sum = await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    expect(sum.written).toBe(true);
    expect(sum.filesChanged).toBe(1);
    expect(sum.pairsTranslated).toBe(5);
    const out = fs.readFileSync(path.join(dir, "src/content/dashboard.content.ts"), "utf8");
    // existing human translation untouched
    expect(out).toContain(`de: "Übersicht"`);
    // new leaves filled
    expect(out).toContain(`fr: "fr:Overview"`);
    expect(out).toContain(`de: "de:Servers"`);
    expect(out).toContain(`fr: "fr:Servers"`);
  });

  it("restores {token} placeholders on write-back", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    const out = fs.readFileSync(path.join(dir, "src/content/dashboard.content.ts"), "utf8");
    // catalog source was "Help for {{pageName}}" → written back as single-brace
    expect(out).toContain(`de: "de:Help for {pageName}"`);
    expect(out).not.toContain("{{pageName}}");
  });

  it("re-run after a complete fill translates nothing", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    const second = await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    expect(second.pairsTranslated).toBe(0);
    expect(second.filesChanged).toBe(0);
  });

  it("re-translates a leaf whose source text changed (stale)", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    // Edit the English source of the `servers` leaf.
    const file = path.join(dir, "src/content/dashboard.content.ts");
    const edited = fs.readFileSync(file, "utf8").replace(`en: "Servers",`, `en: "Server nodes",`);
    fs.writeFileSync(file, edited, "utf8");

    const sum = await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      translate: fakeTranslateFactory(dir),
    });
    // de+fr of `servers` are now stale.
    expect(sum.pairsStale).toBe(2);
    expect(sum.pairsMissing).toBe(0);
    const out = fs.readFileSync(file, "utf8");
    expect(out).toContain(`de: "de:Server nodes"`);
    expect(out).toContain(`fr: "fr:Server nodes"`);
  });

  it("honours the --locale filter", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = setup();
    const sum = await runTranslateIntlayer({
      cwd: dir,
      config: configFor(),
      dryRun: false,
      localeFilter: "fr",
      translate: fakeTranslateFactory(dir),
    });
    expect(sum.localesTouched).toEqual(["fr"]);
    const out = fs.readFileSync(path.join(dir, "src/content/dashboard.content.ts"), "utf8");
    expect(out).toContain(`fr: "fr:Servers"`);
    expect(out).not.toContain(`de: "de:Servers"`);
  });
});
