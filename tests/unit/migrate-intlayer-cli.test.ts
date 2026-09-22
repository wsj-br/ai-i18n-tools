import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { I18nConfig } from "../../src/core/types.js";
import { runMigrateIntlayer } from "../../src/cli/migrate-intlayer.js";
import {
  buildMigrateIntlayerReport,
  renderRuntimeBootstrap,
  type MigrationReportInput,
} from "../../src/cli/migrate-intlayer-report.js";

function writeTree(root: string, files: Record<string, string>): void {
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body, "utf8");
  }
}

function configFor(_root: string): I18nConfig {
  return {
    sourceLocale: "en",
    targetLocales: ["de", "fr"],
    cacheDir: ".translation-cache",
    features: { translateUIStrings: true, translateDocs: false, translateJson: false },
    ui: {
      sourceRoots: ["src"],
      stringsJson: "src/locales/strings.json",
      flatOutputDir: "src/locales",
    },
  } as unknown as I18nConfig;
}

const CONTENT = `import { t, type Dictionary } from 'intlayer';

export default {
  key: 'app-header',
  content: {
    title: t({ en: 'Dashboard', de: 'Dashboard', fr: 'Tableau de bord' }),
    helpFor: t({ en: 'Help for {pageName}', de: 'Hilfe für {pageName}' }),
  },
} satisfies Dictionary;
`;

const HEADER = `import { useIntlayer } from 'react-intlayer';

export function Header({ pageName }: { pageName: string }) {
  const content = useIntlayer('app-header');
  return (
    <header>
      <h1>{content.title.value}</h1>
      <p>{content.helpFor.value.replace('{pageName}', pageName)}</p>
    </header>
  );
}
`;

const DYNAMIC = `import { useIntlayer } from 'react-intlayer';

export function DynamicLabel({ statusKey }: { statusKey: 'title' }) {
  const content = useIntlayer('app-header');
  return <span>{content[statusKey].value}</span>;
}
`;

describe("renderRuntimeBootstrap", () => {
  it("builds the i18next bootstrap from config paths", () => {
    const code = renderRuntimeBootstrap({
      sourceLocale: "en",
      targetLocales: ["de", "fr", "es", "pt-BR"],
      stringsImport: "./locales/strings.json",
      uiLanguagesImport: "./locales/ui-languages.json",
      localeDirImport: "./locales",
    });
    expect(code).toContain('import stringsJson from "./locales/strings.json"');
    expect(code).toContain('import uiLanguages from "./locales/ui-languages.json"');
    expect(code).toContain('export const SOURCE_LOCALE = "en"');
    expect(code).toContain('export const TARGET_LOCALES = ["de", "fr", "es", "pt-BR"] as const');
    expect(code).toContain("export const loadLocale = aiI18n.makeLoadLocale");
    expect(code).toContain("import(`./locales/${code}.json`)");
  });
});

describe("runMigrateIntlayer", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
    vi.restoreAllMocks();
  });

  it("dry-run writes a report and does not modify source or catalog", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-intlayer-dry-"));
    dirs.push(dir);
    writeTree(dir, {
      "src/i18n.ts": "export function t(s: string) { return s; }\n",
      "src/content/app-header.content.ts": CONTENT,
      "src/components/Header.tsx": HEADER,
      "src/components/DynamicLabel.tsx": DYNAMIC,
    });
    const sum = runMigrateIntlayer({
      cwd: dir,
      config: configFor(dir),
      write: false,
      reportPath: "migrate-intlayer-report.md",
    });
    expect(sum.written).toBe(false);
    expect(sum.leavesImported).toBe(2);
    expect(sum.rewrites).toBe(2);
    expect(sum.reviews).toBe(1);
    expect(fs.existsSync(path.join(dir, "src/locales/strings.json"))).toBe(false);
    expect(fs.readFileSync(path.join(dir, "src/components/Header.tsx"), "utf8")).toBe(HEADER);
    const report = fs.readFileSync(path.join(dir, "migrate-intlayer-report.md"), "utf8");
    expect(report).toContain("Agent instructions");
    expect(report).toContain("Manual review");
    expect(report).toContain("dynamic-member");
    expect(report).toContain("dry run");
    expect(report).toContain("## Step-by-step TODO");
    expect(report.indexOf("## Catalog locations")).toBeLessThan(
      report.indexOf("## Step-by-step TODO")
    );
    expect(report).toContain("**1. Re-run with `--write`.**");
    expect(report).toContain("`ai-i18n-tools migrate-intlayer --write`");
    expect(report).toContain("`src/components/DynamicLabel.tsx:5` — `dynamic-member`");
  });

  it("write seeds strings.json / flat files and rewrites safe call sites", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-intlayer-write-"));
    dirs.push(dir);
    writeTree(dir, {
      "src/i18n.ts": "export function t(s: string) { return s; }\n",
      "src/content/app-header.content.ts": CONTENT,
      "src/components/Header.tsx": HEADER,
      "src/components/DynamicLabel.tsx": DYNAMIC,
    });
    const sum = runMigrateIntlayer({
      cwd: dir,
      config: configFor(dir),
      write: true,
    });
    expect(sum.written).toBe(true);
    const header = fs.readFileSync(path.join(dir, "src/components/Header.tsx"), "utf8");
    expect(header).toContain("t('Dashboard')");
    expect(header).toContain("t('Help for {{pageName}}', { pageName: pageName })");
    expect(header).not.toContain("useIntlayer");
    const dynamic = fs.readFileSync(path.join(dir, "src/components/DynamicLabel.tsx"), "utf8");
    expect(dynamic).toContain("useIntlayer");
    const catalog = JSON.parse(
      fs.readFileSync(path.join(dir, "src/locales/strings.json"), "utf8")
    ) as Record<
      string,
      { source: string; translated: Record<string, string>; models?: Record<string, string> }
    >;
    const dash = Object.values(catalog).find((e) => e.source === "Dashboard");
    expect(dash?.translated.de).toBe("Dashboard");
    expect(dash?.translated.fr).toBe("Tableau de bord");
    expect(dash?.models).toBeUndefined();
    const help = Object.values(catalog).find((e) => e.source.includes("pageName"));
    expect(help?.source).toBe("Help for {{pageName}}");
    const de = JSON.parse(fs.readFileSync(path.join(dir, "src/locales/de.json"), "utf8")) as Record<
      string,
      string
    >;
    expect(de["Dashboard"]).toBe("Dashboard");
  });

  it("report names concrete rewrites, new catalog keys, cleanup, and the runtime bootstrap", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-intlayer-report-"));
    dirs.push(dir);
    writeTree(dir, {
      "src/i18n.ts":
        "export function t(s: string) { return s; }\nexport async function loadLocale() {}\n",
      "src/content/app-header.content.ts": CONTENT,
      "src/content/greeting.content.ts": `import { t, type Dictionary } from 'intlayer';
export default {
  key: 'multi-placeholder',
  content: {
    greeting: t({ en: 'Hello {name}, you have {count} alerts', de: 'Hallo {name}, Sie haben {count} Hinweise' }),
  },
} satisfies Dictionary;
`,
      "src/components/Header.tsx": HEADER,
      "src/components/Banner.tsx": `import { useIntlayer } from 'react-intlayer';
export function Banner({ name, count }: { name: string; count: number }) {
  const content = useIntlayer('multi-placeholder');
  const text = content.greeting.value
    .replace("{name}", name)
    .replace("{count}", String(count));
  return <p>{text}</p>;
}
`,
      "src/app.tsx": `import { IntlayerProvider } from 'react-intlayer';
export function App() {
  return <IntlayerProvider locale="en"><p>Hi</p></IntlayerProvider>;
}
`,
    });
    runMigrateIntlayer({
      cwd: dir,
      config: configFor(dir),
      write: true,
    });
    const report = fs.readFileSync(path.join(dir, "migrate-intlayer-report.md"), "utf8");
    expect(report).toContain("import { t } from '../i18n';");
    expect(report).toContain(
      "t('Hello {{name}}, you have {{count}} alerts', { name: name, count: String(count) })"
    );
    expect(report).toContain('.replace("{count}", String(count))');
    expect(report).toContain("Hello {name}, you have {count} alerts");
    expect(report).not.toContain("be2ccc66");
    expect(report).not.toContain("| Hash |");
    expect(report).toContain("Do not edit `strings.json`");
    expect(report).toContain("ai-i18n-tools extract");
    expect(report).toContain("ai-i18n-tools translate-ui");
    expect(report).toContain("src/content/greeting.content.ts");
    expect(report).toContain("src/content/app-header.content.ts");
    expect(report).toContain("`useIntlayer`");
    expect(report).toContain("IntlayerProvider");
    expect(report).toContain("src/app.tsx");
    expect(report).toContain('import aiI18n from "ai-i18n-tools/runtime"');
    expect(report).toContain("await i18n.changeLanguage(next)");
    expect(report).toContain("makeLoadLocale");
    expect(report).toContain("ui-languages.json");
    expect(report).toContain("Replace `src/i18n.ts` with:");
    const pageNameSection = report.split("## New catalog keys")[1]?.split("## Cleanup")[0] ?? "";
    expect(pageNameSection).not.toContain("pageName");
    expect(pageNameSection).toContain("Hello {name}, you have {count} alerts");
    const todo = report.split("## Step-by-step TODO")[1] ?? "";
    expect(todo).toContain("**1. Rewrite the 1 manual-review site.**");
    expect(todo).toContain("`src/components/Banner.tsx:4` — `chained-transform`");
    expect(todo).toContain("Clear the Intlayer leftovers.");
    expect(todo).toContain("Run `ai-i18n-tools extract`.");
    expect(todo).toContain(
      "**6. Run `ai-i18n-tools translate-ui`.** It will translate all new strings, if any."
    );
    expect(todo).not.toContain("Re-run with");
    expect(report.indexOf("## Catalog locations")).toBeLessThan(
      report.indexOf("## Step-by-step TODO")
    );
  });
});

function reportInput(overrides: Partial<MigrationReportInput> = {}): MigrationReportInput {
  return {
    written: true,
    leavesImported: 0,
    dictionaries: [],
    unsupportedLeaves: [],
    rewrites: [],
    reviews: [],
    interpolationConversions: [],
    filesChanged: 0,
    filesScanned: 0,
    stringsJsonPath: "src/locales/strings.json",
    flatOutputDir: "src/locales",
    reportPath: "migrate-intlayer-report.md",
    contentFiles: [],
    leftovers: [],
    catalogKeyChanges: [],
    runtime: {
      file: "src/i18n.ts",
      code: "export {}",
      uiLanguagesPath: "src/locales/ui-languages.json",
      stringsJsonPath: "src/locales/strings.json",
    },
    scanRoots: ["src"],
    ...overrides,
  };
}

describe("buildMigrateIntlayerReport TODO", () => {
  it("drops steps that do not apply and keeps extract before verification", () => {
    const report = buildMigrateIntlayerReport(reportInput());
    const todo = report.split("## Step-by-step TODO")[1] ?? "";
    expect(todo).not.toContain("manual-review");
    expect(todo).not.toContain("leftovers");
    expect(todo).toContain(
      "**4. Run `ai-i18n-tools translate-ui`.** It will translate all new strings, if any."
    );
    expect(todo).not.toContain("unsupported");
    expect(todo).toContain("**1. Replace `src/i18n.ts`.**");
    expect(todo).toContain("**2. Wire the locale control.**");
    expect(todo).toContain("**3. Run `ai-i18n-tools extract`.**");
    expect(todo).toContain("**5. Verify.**");
    expect(todo).toContain('`rg -n "intlayer" src`');
    expect(todo).toContain("**6. Remove the Intlayer packages.**");
  });

  it("prints the scanned paths on a dry-run re-run command", () => {
    const report = buildMigrateIntlayerReport(
      reportInput({
        written: false,
        invocation: {
          paths: ["src", "packages/web"],
          reportPath: "tmp/report.md",
          tImport: "../i18n",
        },
        unsupportedLeaves: [
          {
            dictKey: "app",
            dotPath: "title",
            file: "src/content/app.content.ts",
            line: 4,
            reason: "function",
          },
        ],
      })
    );
    const todo = report.split("## Step-by-step TODO")[1] ?? "";
    expect(todo).toContain(
      "`ai-i18n-tools migrate-intlayer src packages/web --write --report tmp/report.md --t-import ../i18n`"
    );
    expect(todo).toContain("**2. Port the 1 unsupported dictionary leaf.**");
    expect(todo).not.toContain("manual-review");
  });
});
