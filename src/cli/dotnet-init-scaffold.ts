/**
 * Copies assets/dotnet/I18n.cs into a project and stamps namespace, source locale, and locale names.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadUiLanguagesMaster,
  resolveBundledUiLanguagesCompletePath,
} from "../core/ui-languages-catalog.js";
import { normalizeManifestLocaleKey } from "../core/locale-utils.js";
import { readSeaText } from "../core/sea-assets.js";

export const DOTNET_I18N_MARKER = "ai-i18n-tools-i18n-cs: 1";

export interface DotnetLocaleStamp {
  code: string;
  nativeName: string;
  englishName: string;
}

export interface DotnetI18nScaffoldOptions {
  namespace: string;
  sourceLocale: string;
  locales: DotnetLocaleStamp[];
}

const NAMESPACE_RE = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

export function readDotnetHelperTemplate(): string {
  return readAsset("I18n.cs");
}

export function readDotnetResxHelperTemplate(): string {
  return readAsset("I18nResx.cs");
}

function readAsset(fileName: string): string {
  const embedded = readSeaText(`assets/dotnet/${fileName}`);
  if (embedded !== null) {
    return embedded;
  }
  const abs = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "assets",
    "dotnet",
    fileName
  );
  return fs.readFileSync(abs, "utf8");
}

export function renderDotnetI18nHelper(options: DotnetI18nScaffoldOptions): string {
  const namespaceName = NAMESPACE_RE.test(options.namespace) ? options.namespace : "AiI18n";
  const source = csharpString(options.sourceLocale.trim() || "en");
  let text = readDotnetHelperTemplate();
  text = text.replace("namespace AiI18n", `namespace ${namespaceName}`);
  text = text.replace(
    'public const string SourceLocale = "en";',
    `public const string SourceLocale = ${source};`
  );
  const rows = options.locales
    .map(
      (locale) =>
        `            new LocaleInfo(${csharpString(locale.code)}, ${csharpString(locale.nativeName)}, ${csharpString(locale.englishName)}),`
    )
    .join("\n");
  text = text.replace(
    /\/\/ ai-i18n-tools-locales: start[\s\S]*?\/\/ ai-i18n-tools-locales: end/,
    `// ai-i18n-tools-locales: start
        private static readonly LocaleInfo[] BuiltInLocales = new LocaleInfo[]
        {
${rows}
        };
        // ai-i18n-tools-locales: end`
  );
  return text;
}

export function discoverDotnetNamespace(cwd: string): string {
  let names: string[];
  try {
    names = fs.readdirSync(cwd).filter((name) => name.endsWith(".csproj"));
  } catch {
    return "AiI18n";
  }
  if (names.length !== 1) {
    return "AiI18n";
  }
  const file = names[0]!;
  let xml: string;
  try {
    xml = fs.readFileSync(path.join(cwd, file), "utf8");
  } catch {
    return "AiI18n";
  }
  const declared = xml.match(/<RootNamespace>\s*([^<]+?)\s*<\/RootNamespace>/);
  const candidate = declared?.[1]?.trim() || file.replace(/\.csproj$/, "");
  return NAMESPACE_RE.test(candidate) ? candidate : "AiI18n";
}

export function localeStampsFor(codes: string[]): DotnetLocaleStamp[] {
  let master: ReturnType<typeof loadUiLanguagesMaster> | undefined;
  try {
    master = loadUiLanguagesMaster(resolveBundledUiLanguagesCompletePath());
  } catch {
    master = undefined;
  }
  const seen = new Set<string>();
  const out: DotnetLocaleStamp[] = [];
  for (const code of codes) {
    const trimmed = code.trim();
    if (!trimmed) {
      continue;
    }
    const key = normalizeManifestLocaleKey(trimmed);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const row = master?.get(key);
    out.push({
      code: trimmed,
      nativeName: row?.label ?? trimmed,
      englishName: row?.englishName ?? trimmed,
    });
  }
  return out;
}

export function renderDotnetResxHelper(options: {
  namespace: string;
  resourceBaseName: string;
}): string {
  const namespaceName = NAMESPACE_RE.test(options.namespace) ? options.namespace : "AiI18n";
  const baseName = options.resourceBaseName.trim() || "SharedResource";
  let text = readDotnetResxHelperTemplate();
  text = text.replace("namespace AiI18n", `namespace ${namespaceName}`);
  text = text.replace(
    'public const string ResourceBaseName = "SharedResource";',
    `public const string ResourceBaseName = ${csharpString(baseName)};`
  );
  return text;
}

export function dotnetResourceBaseName(
  namespaceName: string,
  outputDir: string,
  baseName: string
): string {
  const ns = NAMESPACE_RE.test(namespaceName) ? namespaceName : "AiI18n";
  const folder = outputDir.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
  const parts = [ns];
  if (folder && folder !== ".") {
    parts.push(...folder.split("/").filter((part) => part.length > 0 && part !== "."));
  }
  parts.push(baseName.trim() || "SharedResource");
  return parts.join(".");
}

function csharpString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
