import type {
  IntlayerDictionaryExtract,
  IntlayerLeaf,
  UnsupportedIntlayerLeaf,
} from "../extractors/intlayer-content-extractor.js";
import type {
  IntlayerLeftover,
  ManualReviewReason,
  ManualReviewSite,
  SafeRewrite,
} from "../extractors/intlayer-usage-codemod.js";

export interface CatalogKeyChange {
  file: string;
  line: number;
  dictKey: string;
  dotPath?: string;
  seededSource: string;
  nextSource: string;
}

export interface RuntimeBootstrapReport {
  /** Bootstrap file to replace, relative to the project (`src/i18n.ts`). */
  file: string;
  code: string;
  uiLanguagesPath: string;
  stringsJsonPath: string;
}

export interface MigrationReportInvocation {
  /** Positional paths passed to the command. Empty when the scan used `ui.sourceRoots`. */
  paths: string[];
  reportPath: string;
  contentGlob?: string;
  tImport?: string;
}

export interface MigrationReportInput {
  written: boolean;
  leavesImported: number;
  dictionaries: IntlayerDictionaryExtract[];
  unsupportedLeaves: UnsupportedIntlayerLeaf[];
  rewrites: SafeRewrite[];
  reviews: ManualReviewSite[];
  interpolationConversions: Array<{
    dictKey: string;
    dotPath: string;
    tokens: string[];
    from: string;
    to: string;
  }>;
  filesChanged: number;
  filesScanned: number;
  stringsJsonPath: string;
  flatOutputDir: string;
  reportPath: string;
  contentFiles: string[];
  leftovers: IntlayerLeftover[];
  catalogKeyChanges: CatalogKeyChange[];
  runtime: RuntimeBootstrapReport;
  /** Trees the command scanned. Used by the closing TODO's verification command. */
  scanRoots: string[];
  /** How the command was invoked, so a dry-run TODO can print the `--write` re-run. */
  invocation?: MigrationReportInvocation;
}

export interface RuntimeBootstrapInput {
  sourceLocale: string;
  targetLocales: readonly string[];
  stringsImport: string;
  uiLanguagesImport: string;
  /** Directory import prefix, e.g. `./locales`. */
  localeDirImport: string;
}

/** i18next bootstrap the agent copies over the project's i18n module. */
export function renderRuntimeBootstrap(input: RuntimeBootstrapInput): string {
  const targets = input.targetLocales.map((locale) => JSON.stringify(locale)).join(", ");
  const localeDir = input.localeDirImport.replace(/\/$/, "");
  return `import i18n from "i18next";
import aiI18n from "ai-i18n-tools/runtime";
import stringsJson from ${JSON.stringify(input.stringsImport)};
import uiLanguages from ${JSON.stringify(input.uiLanguagesImport)};

export const SOURCE_LOCALE = ${JSON.stringify(input.sourceLocale)};
export const TARGET_LOCALES = [${targets}] as const;

void i18n.init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson: stringsJson as Record<string, { plural?: boolean; source?: string }>,
});

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages as Array<{ code: string }>,
  SOURCE_LOCALE,
  (code) => () => import(\`${localeDir}/\${code}.json\`)
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export const t = i18n.t.bind(i18n);
export function getLocale(): string {
  return i18n.language;
}
export default i18n;
`;
}

const REASON_HINT: Record<ManualReviewReason, string> = {
  "dynamic-member":
    "Computed key cannot be resolved statically. Rewrite each possible key to `t('<source text>')` (or a map of key → `t()`).",
  spread:
    "The dictionary object is spread into another object or JSX props. Resolve each leaf at the usage site (or in the child) with `t('<source text>')`.",
  "passed-as-value":
    "The Intlayer binding is passed or used without `.value`. Replace the consumer with `t('<source text>')` calls.",
  "chained-transform":
    "More than one `.replace()` / method is chained after `.value`. Rewrite as `t('… {{a}} … {{b}}', { a: …, b: … })`.",
  destructuring:
    "The dictionary is destructured. Replace each destructured leaf with `t('<source text>')`.",
  "unresolved-path":
    "The member path did not match a leaf in the `.content.ts` dictionary. Confirm the path or rewrite by hand.",
  "no-value":
    "The binding is read without a terminal `.value` (an intermediate object). Resolve the leaf and call `t('<source text>')`.",
};

function fence(code: string): string {
  const trimmed = code.trimEnd();
  return `\`\`\`ts\n${trimmed}\n\`\`\``;
}

function tImportLine(specifier: string): string {
  const quoted = specifier.includes("'") ? JSON.stringify(specifier) : `'${specifier}'`;
  return `import { t } from ${quoted};`;
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) {
    return value;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function countNoun(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function renderManualSite(site: ManualReviewSite, changes: CatalogKeyChange[]): string[] {
  const lines: string[] = [];
  const heading = site.dotPath
    ? `### \`${site.file}:${site.line}\` — \`${site.dictKey}.${site.dotPath}\``
    : `### \`${site.file}:${site.line}\` — \`${site.dictKey}\``;
  lines.push(heading);
  lines.push("");
  lines.push(`- **Reason:** \`${site.reason}\``);
  lines.push(`- **Hint:** ${REASON_HINT[site.reason]}`);
  if (site.tImportSpecifier) {
    lines.push("- **Import:**");
    lines.push("");
    lines.push(fence(tImportLine(site.tImportSpecifier)));
  }
  if (site.requiresDirectLiteral) {
    lines.push("");
    lines.push(
      "The literal must be a direct `t('…')` argument, built during render, so extract sees it and a locale change re-runs it."
    );
  }
  if (site.jsxElement) {
    const reads = (site.spreadProps ?? []).map((prop) =>
      prop.access ? `\`${prop.prop}.${prop.access}\`` : `\`${prop.prop}\``
    );
    lines.push("");
    lines.push(
      reads.length > 0
        ? `\`${site.jsxElement}\` expects ${joinAnd(reads)}. Pass translated strings for those props and read them in the child without \`.value\`.`
        : `The dictionary object is spread onto \`${site.jsxElement}\`. Pass each leaf as a prop with \`t('…')\`.`
    );
  }
  const siteChanges = changes.filter(
    (change) => change.file === site.file && change.line === site.line
  );
  for (const change of siteChanges) {
    lines.push("");
    lines.push(
      `Seeded text for this leaf is still \`${change.seededSource}\`. \`${change.nextSource}\` is a new source string, so the seeded translations do not apply. Do not edit \`strings.json\` or the flat locale files by hand. Run \`ai-i18n-tools extract\` then \`ai-i18n-tools translate-ui\`.`
    );
  }
  lines.push("");
  lines.push(fence(site.snippet));
  lines.push("");
  if (site.writeAs) {
    lines.push("Write:");
    lines.push("");
    lines.push(fence(site.writeAs));
    lines.push("");
    return lines;
  }
  if (site.suggestions.length > 0) {
    lines.push("Write:");
    lines.push("");
    for (const suggestion of site.suggestions) {
      const label = suggestion.label ?? suggestion.dotPath;
      lines.push(
        label ? `- \`${label}\` → \`${suggestion.replacement}\`` : `- \`${suggestion.replacement}\``
      );
    }
    lines.push("");
  }
  return lines;
}

function renderCatalogKeyChanges(changes: CatalogKeyChange[]): string[] {
  const lines = ["## New catalog keys", ""];
  lines.push(
    "Safe `.replace()` rewrites already store i18next `{{token}}` strings in the catalog (see **Interpolation conversions**). Those keys are not listed here."
  );
  lines.push("");
  if (changes.length === 0) {
    lines.push("_None._");
    lines.push("");
    return lines;
  }
  lines.push(
    "These manual rewrites change the source string. Seeded translations stay on the old string and do not apply. Do not patch `strings.json`, the flat locale bundles, or `ui-languages.json` by hand. After rewriting, run `ai-i18n-tools extract` then `ai-i18n-tools translate-ui`. `extract` records the new source string and writes `ui-languages.json`; `translate-ui` fills the new string."
  );
  lines.push("");
  for (const change of changes) {
    const leaf = change.dotPath ? `${change.dictKey}.${change.dotPath}` : change.dictKey;
    lines.push(
      `- \`${change.file}:${change.line}\` \`${leaf}\` — seeded \`${change.seededSource}\`. The new source string is \`${change.nextSource}\`.`
    );
  }
  lines.push("");
  return lines;
}

function renderCleanup(contentFiles: string[], leftovers: IntlayerLeftover[]): string[] {
  const lines = ["## Cleanup", ""];
  lines.push(
    "After every manual-review site is rewritten, remove these leftovers. The manual sites still read the dictionaries until then."
  );
  lines.push("");
  const hooks = leftovers.filter((leftover) => leftover.kind === "hook-import");
  const providers = leftovers.filter((leftover) => leftover.kind === "provider");
  if (hooks.length === 0 && providers.length === 0 && contentFiles.length === 0) {
    lines.push("_None._");
    lines.push("");
    return lines;
  }
  if (hooks.length > 0) {
    lines.push("Remove these Intlayer hook imports:");
    lines.push("");
    for (const hook of hooks) {
      lines.push(`- \`${hook.file}:${hook.line}\` \`${hook.name}\``);
    }
    lines.push("");
  }
  if (providers.length > 0) {
    lines.push("Remove `IntlayerProvider`. It is not rewritten automatically:");
    lines.push("");
    const byFile = new Map<string, number[]>();
    for (const provider of providers) {
      const lineList = byFile.get(provider.file) ?? [];
      lineList.push(provider.line);
      byFile.set(provider.file, lineList);
    }
    for (const [file, lineList] of byFile) {
      lines.push(
        `- \`${file}\` lines ${lineList.join(", ")} — delete the import and the \`<IntlayerProvider>\` wrapper`
      );
    }
    lines.push("");
  }
  if (contentFiles.length > 0) {
    lines.push("Then delete these unused `*.content.ts` files:");
    lines.push("");
    for (const file of contentFiles) {
      lines.push(`- \`${file}\``);
    }
    lines.push("");
  }
  return lines;
}

function renderRuntime(runtime: RuntimeBootstrapReport): string[] {
  return [
    "## Runtime bootstrap",
    "",
    `Replace \`${runtime.file}\` with:`,
    "",
    fence(runtime.code),
    "",
    `\`${runtime.stringsJsonPath}\`, the flat locale bundles, and \`${runtime.uiLanguagesPath}\` are generated. Do not edit them by hand. \`--write\` seeds the catalog and flat bundles. \`ai-i18n-tools extract\` (also \`generate-ui-languages\`) writes \`${runtime.uiLanguagesPath}\`; the bootstrap imports it, so run extract before compiling, even when no new copy was introduced.`,
    "",
    "`loadLocale` comes from `makeLoadLocale`. It adds the flat bundle for a target locale and returns immediately for the source locale. It does not change the active language.",
    "",
    "In the locale control handler, import the default `i18n` export from the same module as `loadLocale` and call both:",
    "",
    fence(`async function onChange(next: string) {
  await loadLocale(next);
  await i18n.changeLanguage(next);
}`),
    "",
    "Without `i18n.changeLanguage(next)`, the control moves and the strings stay on the previous language.",
    "",
  ];
}

interface TodoStep {
  /** Short label, rendered in bold after the step number. */
  title: string;
  /** Sentence that follows the bold label on the same checkbox. */
  detail?: string;
  /** Nested checkboxes for one unit of work inside the step. */
  items?: string[];
}

function renderWriteCommand(invocation: MigrationReportInvocation | undefined): string {
  const parts = ["ai-i18n-tools migrate-intlayer"];
  for (const scanPath of invocation?.paths ?? []) {
    parts.push(shellQuote(scanPath));
  }
  parts.push("--write");
  if (invocation && invocation.reportPath !== "migrate-intlayer-report.md") {
    parts.push("--report", shellQuote(invocation.reportPath));
  }
  if (invocation?.contentGlob && invocation.contentGlob !== "**/*.content.ts") {
    parts.push("--content-glob", shellQuote(invocation.contentGlob));
  }
  if (invocation?.tImport) {
    parts.push("--t-import", shellQuote(invocation.tImport));
  }
  return parts.join(" ");
}

function renderCleanupTodoDetail(input: MigrationReportInput): string | undefined {
  const hooks = input.leftovers.filter((leftover) => leftover.kind === "hook-import");
  const providers = input.leftovers.filter((leftover) => leftover.kind === "provider");
  const files = input.contentFiles;
  if (hooks.length === 0 && providers.length === 0 && files.length === 0) {
    return undefined;
  }
  const bits: string[] = [];
  if (hooks.length > 0) {
    bits.push(countNoun(hooks.length, "hook import", "hook imports"));
  }
  if (providers.length > 0) {
    const providerFiles = [...new Set(providers.map((provider) => provider.file))];
    const listed = providerFiles.map((file) => `\`${file}\``).join(", ");
    bits.push(`\`IntlayerProvider\` in ${listed}`);
  }
  const fileBit =
    files.length > 0
      ? `delete the ${countNoun(files.length, "`*.content.ts` file", "`*.content.ts` files")}`
      : "";
  let body = joinAnd(bits);
  if (fileBit && bits.length > 0) {
    body = `${body}, then ${fileBit}`;
  } else if (fileBit) {
    body = fileBit;
  }
  return `Under **Cleanup**: ${body}.`;
}

function renderVerifyCommand(roots: string[]): string {
  const args = roots.length > 0 ? roots : ["."];
  return `rg -n "intlayer" ${args.map(shellQuote).join(" ")}`;
}

function collectTodoSteps(input: MigrationReportInput): TodoStep[] {
  const steps: TodoStep[] = [];
  if (!input.written) {
    steps.push({
      title: "Re-run with `--write`.",
      detail: `Run \`${renderWriteCommand(input.invocation)}\`. The boxes below apply to the report that command regenerates.`,
    });
  }
  if (input.reviews.length > 0) {
    steps.push({
      title: `Rewrite the ${countNoun(input.reviews.length, "manual-review site", "manual-review sites")}.`,
      detail:
        "Use the exact `t('…')` or JSX and the `import { t }` line from **Manual review**. Add that import when `t` is not already imported. Do not invent English copy.",
      items: input.reviews.map((site) => {
        const leaf = site.dotPath ? `\`${site.dictKey}.${site.dotPath}\`` : `\`${site.dictKey}\``;
        const imp = site.tImportSpecifier
          ? ` Add \`${tImportLine(site.tImportSpecifier)}\` when \`t\` is not already imported.`
          : "";
        return `\`${site.file}:${site.line}\` — \`${site.reason}\` (${leaf}).${imp}`;
      }),
    });
  }
  if (input.unsupportedLeaves.length > 0) {
    steps.push({
      title: `Port the ${countNoun(input.unsupportedLeaves.length, "unsupported dictionary leaf", "unsupported dictionary leaves")}.`,
      detail:
        "**Unsupported dictionary leaves** lists leaves the extractor could not turn into a `t()` call. Rewrite each one by hand.",
    });
  }
  const cleanup = renderCleanupTodoDetail(input);
  if (cleanup) {
    steps.push({
      title: "Clear the Intlayer leftovers.",
      detail: cleanup,
    });
  }
  steps.push({
    title: `Replace \`${input.runtime.file}\`.`,
    detail: "Paste the module under **Runtime bootstrap**.",
  });
  steps.push({
    title: "Wire the locale control.",
    detail:
      "Call `await loadLocale(next)` and then `await i18n.changeLanguage(next)`. `loadLocale` only registers the flat bundle.",
  });
  steps.push({
    title: "Run `ai-i18n-tools extract`.",
    detail: `It records every \`t('…')\` literal and writes \`${input.runtime.uiLanguagesPath}\`, which the bootstrap imports. Run it before compiling, even when no new copy was introduced.`,
  });
  steps.push({
    title: "Run `ai-i18n-tools translate-ui`.",
    detail: "It will translate all new strings, if any.",
  });
  steps.push({
    title: "Verify.",
    detail: `\`${renderVerifyCommand(input.scanRoots)}\` returns nothing, and the app builds.`,
  });
  steps.push({
    title: "Remove the Intlayer packages.",
    detail: "Drop `intlayer` and `react-intlayer` once nothing imports them.",
  });
  return steps;
}

/** Ordered checklist an agent works after reading the report. Omitted steps are skipped and the numbers close up. */
function renderAgentTodo(input: MigrationReportInput): string[] {
  const lines = ["## Step-by-step TODO", ""];
  lines.push("Work these in order. Finish each box before starting the next.");
  lines.push("");
  for (const [index, step] of collectTodoSteps(input).entries()) {
    lines.push(`- [ ] **${index + 1}. ${step.title}**${step.detail ? ` ${step.detail}` : ""}`);
    for (const item of step.items ?? []) {
      lines.push(`  - [ ] ${item}`);
    }
  }
  lines.push("");
  lines.push(
    `Never edit \`${input.stringsJsonPath}\`, the flat locale bundles under \`${input.flatOutputDir}\`, or \`${input.runtime.uiLanguagesPath}\` by hand, and never write translations yourself. \`extract\` and \`translate-ui\` own those files.`
  );
  lines.push("");
  return lines;
}

/**
 * Build an AI-agent-ready markdown report for the remaining Intlayer migration work.
 */
export function buildMigrateIntlayerReport(input: MigrationReportInput): string {
  const lines: string[] = [];
  lines.push("# Intlayer → ai-i18n-tools migration report");
  lines.push("");
  lines.push("## Agent instructions");
  lines.push("");
  lines.push(
    'You are finishing a migration from Intlayer `.content.ts` dictionaries to ai-i18n-tools `t("English source")` calls (key-as-default).'
  );
  lines.push("");
  lines.push(
    "Work the **Step-by-step TODO** at the end of this report in order. Each box points at the section that has the exact text to write. Do not invent English copy. Do not edit `strings.json`, flat locale bundles, or `ui-languages.json` by hand."
  );
  lines.push("");
  lines.push(
    input.written
      ? "This report was generated with `--write`: catalog/flat bundles were seeded and safe call sites were rewritten."
      : "This report was generated as a **dry run**. Re-run with `--write` to apply catalog seeding and safe rewrites, then finish the manual-review sites."
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Dictionaries scanned: ${input.dictionaries.length}`);
  lines.push(`- Leaves imported into \`${input.stringsJsonPath}\`: ${input.leavesImported}`);
  lines.push(`- Flat locale dir: \`${input.flatOutputDir}\``);
  lines.push(`- Usage files scanned: ${input.filesScanned}`);
  lines.push(`- Files auto-rewritten: ${input.filesChanged}`);
  lines.push(`- Safe rewrites: ${input.rewrites.length}`);
  lines.push(`- Manual-review sites: ${input.reviews.length}`);
  lines.push(`- Unsupported dictionary leaves: ${input.unsupportedLeaves.length}`);
  lines.push("");

  lines.push("## Extracted dictionaries");
  lines.push("");
  if (input.dictionaries.length === 0) {
    lines.push("_No `*.content.ts` dictionaries found._");
    lines.push("");
  }
  for (const d of input.dictionaries) {
    lines.push(`### \`${d.file}\` (\`${d.dictKey}\`)`);
    lines.push("");
    if (d.leaves.length === 0) {
      lines.push("_No extractable leaves._");
      lines.push("");
      continue;
    }
    lines.push("| Dot path | Source | Locales seeded |");
    lines.push("| --- | --- | --- |");
    for (const leaf of d.leaves) {
      const locs = Object.keys(leaf.locales)
        .filter((k) => k !== Object.keys(leaf.locales)[0] || true)
        .join(", ");
      const src = leaf.sourceText.replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| \`${leaf.dotPath}\` | ${src} | ${locs} |`);
    }
    lines.push("");
  }

  if (input.interpolationConversions.length > 0) {
    lines.push("## Interpolation conversions");
    lines.push("");
    lines.push(
      "These leaves used Intlayer `{token}` placeholders paired with `.replace('{token}', …)` and were stored as i18next `{{token}}`. The catalog key is already the `{{token}}` form, so they are not listed under **New catalog keys**."
    );
    lines.push("");
    for (const c of input.interpolationConversions) {
      lines.push(
        `- \`${c.dictKey}\`.\`${c.dotPath}\` tokens \`${c.tokens.join(", ")}\`: \`${c.from}\` → \`${c.to}\``
      );
    }
    lines.push("");
  }

  lines.push("## Auto-rewrites");
  lines.push("");
  if (input.rewrites.length === 0) {
    lines.push("_None._");
    lines.push("");
  } else {
    for (const r of input.rewrites) {
      lines.push(
        `- \`${r.file}:${r.line}\` \`${r.snippet}\` → \`${r.replacement}\` (${r.kind}, \`${r.dictKey}.${r.dotPath}\`)`
      );
    }
    lines.push("");
  }

  lines.push("## Manual review");
  lines.push("");
  if (input.reviews.length === 0) {
    lines.push("_None — every detected call site was auto-rewritten._");
    lines.push("");
  } else {
    for (const review of input.reviews) {
      lines.push(...renderManualSite(review, input.catalogKeyChanges));
    }
  }

  lines.push(...renderCatalogKeyChanges(input.catalogKeyChanges));
  lines.push(...renderCleanup(input.contentFiles, input.leftovers));
  lines.push(...renderRuntime(input.runtime));

  if (input.unsupportedLeaves.length > 0) {
    lines.push("## Unsupported dictionary leaves");
    lines.push("");
    for (const u of input.unsupportedLeaves) {
      lines.push(
        `- \`${u.file}:${u.line}\` \`${u.dictKey}${u.dotPath ? `.${u.dotPath}` : ""}\` — \`${u.reason}\``
      );
    }
    lines.push("");
  }

  lines.push("## Catalog locations");
  lines.push("");
  lines.push(`- Report: \`${input.reportPath}\``);
  lines.push(
    `- \`strings.json\`: \`${input.stringsJsonPath}\` (generated by \`--write\` and refreshed by \`extract\`; do not edit)`
  );
  lines.push(
    `- Flat locale bundles: \`${input.flatOutputDir}\` (generated by \`--write\` and \`translate-ui\`; do not edit)`
  );
  lines.push(`- \`${input.runtime.uiLanguagesPath}\` (generated by \`extract\`; do not edit)`);
  lines.push("");
  lines.push(...renderAgentTodo(input));

  return `${lines.join("\n")}\n`;
}

export function leafLookup(leaves: IntlayerLeaf[]): Map<string, IntlayerLeaf> {
  const m = new Map<string, IntlayerLeaf>();
  for (const l of leaves) {
    m.set(`${l.dictKey}\0${l.dotPath}`, l);
  }
  return m;
}
