import path from "path";
import { normalizeLocale, parseLocaleList } from "./locale-utils.js";
import type { I18nConfig, I18nUiTranslateConfig, UiConfig } from "./types.js";

export interface ResolvedUiBlockPaths {
  stringsJson: string;
  flatOutputDir: string;
  languagesManifest: string;
}

export interface SelectedUiBlock {
  block: UiConfig;
  index: number;
  view: I18nUiTranslateConfig;
}

/** Single-block view so extract/translate keep reading `config.ui.sourceRoots`. */
export function toUiTranslateConfig(root: I18nConfig, block: UiConfig): I18nUiTranslateConfig {
  return { ...root, ui: block };
}

export function uiBlockHasSourceRoots(block: UiConfig): boolean {
  return block.sourceRoots.some((root) => root.trim().length > 0);
}

export function configHasUiWork(config: Pick<I18nConfig, "ui">): boolean {
  return config.ui.some(uiBlockHasSourceRoots);
}

export function configHasDocWork(config: Pick<I18nConfig, "docs">): boolean {
  return config.docs.some(
    (block) => block.contentPaths.length > 0 || Boolean(block.docusaurusCatalogDir?.trim())
  );
}

export function configHasJsonWork(config: Pick<I18nConfig, "json">): boolean {
  return config.json.some((block) => block.contentPaths.length > 0);
}

/** Catalog path relative to cwd, forward slashes, no leading `./`. */
export function normalizeConfigRelPath(value: string): string {
  return value.trim().split("\\").join("/").replace(/^\.\//, "").replace(/\/+$/, "");
}

export function resolveConfigPath(cwd: string, value: string): string {
  const trimmed = value.trim();
  return path.normalize(path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed));
}

/**
 * Manifest path for one block. Block 0 falls back to root `languagesManifestPath`
 * so docs language-switcher labels keep a single root path.
 */
export function effectiveUiManifestRel(
  config: Pick<I18nConfig, "languagesManifestPath">,
  block: UiConfig,
  index: number
): string {
  const own = block.languagesManifestPath?.trim();
  if (own) {
    return own;
  }
  if (index === 0) {
    const root = config.languagesManifestPath?.trim();
    if (root) {
      return root;
    }
  }
  return path.join(block.flatOutputDir, "ui-languages.json");
}

export function resolveUiBlockPaths(
  config: Pick<I18nConfig, "languagesManifestPath">,
  block: UiConfig,
  index: number,
  cwd: string
): ResolvedUiBlockPaths {
  return {
    stringsJson: resolveConfigPath(cwd, block.stringsJson),
    flatOutputDir: resolveConfigPath(cwd, block.flatOutputDir),
    languagesManifest: resolveConfigPath(cwd, effectiveUiManifestRel(config, block, index)),
  };
}

/** Absolute `strings.json` paths for blocks that contribute glossary hints. */
export function resolveUiGlossaryPaths(config: { ui?: UiConfig[] }, cwd: string): string[] {
  return (config.ui ?? [])
    .filter((block) => block.uiGlossary !== false)
    .map((block) => resolveConfigPath(cwd, block.stringsJson));
}

export function effectiveUiTargetLocales(
  config: Pick<I18nConfig, "targetLocales">,
  block: UiConfig
): string[] {
  if (block.targetLocales && block.targetLocales.length > 0) {
    return block.targetLocales;
  }
  return config.targetLocales;
}

/**
 * Locales for one UI block. Uses the block's `targetLocales` when set, otherwise root
 * `targetLocales`. With `--locale` / `-l`, keeps only codes in that set.
 */
export function resolveLocalesForUiBlock(
  config: Pick<I18nConfig, "sourceLocale" | "targetLocales">,
  block: UiConfig,
  _cwd: string,
  cliLocalesRaw?: string | null
): string[] {
  const src = normalizeLocale(config.sourceLocale);
  const allowed = new Set(effectiveUiTargetLocales(config, block).map((locale) => normalizeLocale(locale)));

  let list: string[];
  if (cliLocalesRaw?.trim()) {
    list = parseLocaleList(cliLocalesRaw).map((code) => normalizeLocale(code));
    list = list.filter((code) => allowed.has(code));
  } else {
    list = [...allowed];
  }

  return list.filter((code) => code !== src);
}

function selectorMatches(block: UiConfig, index: number, selector: string): boolean {
  if (/^\d+$/.test(selector) && Number(selector) === index) {
    return true;
  }
  if (block.description !== undefined && block.description === selector) {
    return true;
  }
  return normalizeConfigRelPath(block.stringsJson) === normalizeConfigRelPath(selector);
}

export function formatUiBlockLabel(index: number, block: UiConfig): string {
  const description = block.description?.trim();
  return description ? `ui[${index}] — ${description}` : `ui[${index}]`;
}

/**
 * Blocks to run. With no selector, skips blocks that have no `sourceRoots`.
 * A selector that names an empty block is an error.
 */
export function selectUiBlocks(config: I18nConfig, selector?: string | null): SelectedUiBlock[] {
  const all: SelectedUiBlock[] = config.ui.map((block, index) => ({
    block,
    index,
    view: toUiTranslateConfig(config, block),
  }));
  const raw = selector?.trim() ?? "";
  if (!raw) {
    return all.filter((item) => uiBlockHasSourceRoots(item.block));
  }
  const matches = all.filter((item) => selectorMatches(item.block, item.index, raw));
  if (matches.length === 0) {
    const known = all
      .map((item) => {
        const bits = [String(item.index), normalizeConfigRelPath(item.block.stringsJson)];
        if (item.block.description?.trim()) {
          bits.push(item.block.description);
        }
        return bits.join(" | ");
      })
      .join("; ");
    throw new Error(`Unknown --ui-block "${raw}". Known blocks: ${known}`);
  }
  if (matches.length > 1) {
    throw new Error(
      `--ui-block "${raw}" matches more than one UI block (${matches.map((item) => formatUiBlockLabel(item.index, item.block)).join(", ")}).`
    );
  }
  const chosen = matches[0]!;
  if (!uiBlockHasSourceRoots(chosen.block)) {
    throw new Error(
      `${formatUiBlockLabel(chosen.index, chosen.block)} has no sourceRoots. Add sourceRoots or choose another block.`
    );
  }
  return [chosen];
}

/** Union of target locales across the blocks a command would run. */
export function collectUiTargetLocales(
  config: I18nConfig,
  cwd: string,
  selector?: string | null,
  cliLocalesRaw?: string | null
): string[] {
  const selected = selectUiBlocks(config, selector);
  const out: string[] = [];
  for (const item of selected) {
    for (const locale of resolveLocalesForUiBlock(config, item.block, cwd, cliLocalesRaw)) {
      if (!out.includes(locale)) {
        out.push(locale);
      }
    }
  }
  return out;
}
