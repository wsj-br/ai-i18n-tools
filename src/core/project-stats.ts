import fs from "fs";
import { parse } from "csv-parse/sync";
import type { TranslationCache } from "./cache.js";
import { pluralTranslatedLocaleHasContent } from "./plural-forms.js";
import { isPluralStringsEntry } from "./types.js";

export type UiStringsStats = {
  available: boolean;
  totalEntries: number;
  plainTotal: number;
  pluralTotal: number;
  plainByLocale: { locale: string; translated: number; missing: number }[];
  pluralByLocale: { locale: string; complete: number; incomplete: number }[];
  byModel: { model: string; count: number }[];
  byModelLocale: { model: string; locale: string; count: number }[];
};

export type GlossaryStats = {
  available: boolean;
  totalTerms: number;
  byLocale: { locale: string; count: number }[];
};

export type ProjectStatsPayload = {
  cache: ReturnType<TranslationCache["getDetailedStats"]>;
  uiStrings: UiStringsStats;
  glossary: GlossaryStats;
};

function readUserGlossaryRows(glossaryPath: string): string[][] {
  const raw = fs.readFileSync(glossaryPath, "utf8");
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Record<
    string,
    string
  >[];
  return records.map((r) => [
    r["Original language string"] ?? r["en"] ?? "",
    r["locale"] ?? "",
    r["Translation"] ?? r["translation"] ?? "",
    r["Force"] ?? r["force"] ?? "",
  ]);
}

/**
 * Aggregates documentation cache stats, strings.json UI stats, and glossary row counts — same payload as `GET /api/stats`.
 */
export function computeProjectStats(input: {
  cache: TranslationCache;
  stringsPath: string | null;
  glossaryPath: string | null;
  sourceLocale: string;
  targetLocales: string[];
}): ProjectStatsPayload {
  const cache = input.cache.getDetailedStats();
  const statsLocales = [...new Set([input.sourceLocale, ...input.targetLocales])];
  const { stringsPath, glossaryPath } = input;

  let uiStrings: UiStringsStats;
  if (stringsPath && fs.existsSync(stringsPath)) {
    const doc = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<
      string,
      Record<string, unknown>
    >;
    let plainTotal = 0;
    let pluralTotal = 0;
    for (const row of Object.values(doc)) {
      if (isPluralStringsEntry(row)) {
        pluralTotal++;
      } else {
        plainTotal++;
      }
    }
    const totalEntries = plainTotal + pluralTotal;

    const plainByLocale = statsLocales.map((locale) => {
      let translated = 0;
      for (const row of Object.values(doc)) {
        if (isPluralStringsEntry(row)) {
          continue;
        }
        const tr = (row.translated as Record<string, unknown> | undefined)?.[locale];
        if (typeof tr === "string" && tr.trim() !== "") {
          translated++;
        }
      }
      return {
        locale,
        translated,
        missing: plainTotal - translated,
      };
    });

    const pluralByLocale = statsLocales.map((locale) => {
      let complete = 0;
      for (const row of Object.values(doc)) {
        if (!isPluralStringsEntry(row)) {
          continue;
        }
        const tr = (row.translated as Record<string, unknown> | undefined)?.[locale];
        if (pluralTranslatedLocaleHasContent(tr as Record<string, unknown> | undefined, locale)) {
          complete++;
        }
      }
      return {
        locale,
        complete,
        incomplete: pluralTotal - complete,
      };
    });

    const modelCounts = new Map<string, number>();
    const modelLocaleCounts = new Map<string, number>();
    for (const row of Object.values(doc)) {
      const models = row.models as Record<string, string> | undefined;
      if (models) {
        for (const [locale, model] of Object.entries(models)) {
          const m = model?.trim() ? model.trim() : "(unknown)";
          modelCounts.set(m, (modelCounts.get(m) ?? 0) + 1);
          const mlKey = `${m}\0${locale}`;
          modelLocaleCounts.set(mlKey, (modelLocaleCounts.get(mlKey) ?? 0) + 1);
        }
      }
    }
    const byModel = [...modelCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([model, count]) => ({ model, count }));

    const byModelLocale = [...modelLocaleCounts.entries()].map(([key, count]) => {
      const [model, locale] = key.split("\0");
      return { model, locale, count };
    });

    uiStrings = {
      available: true,
      totalEntries,
      plainTotal,
      pluralTotal,
      plainByLocale,
      pluralByLocale,
      byModel,
      byModelLocale,
    };
  } else {
    uiStrings = {
      available: false,
      totalEntries: 0,
      plainTotal: 0,
      pluralTotal: 0,
      plainByLocale: [],
      pluralByLocale: [],
      byModel: [],
      byModelLocale: [],
    };
  }

  let glossary: GlossaryStats;
  if (glossaryPath && fs.existsSync(glossaryPath)) {
    const rows = readUserGlossaryRows(glossaryPath);
    const byLoc = new Map<string, number>();
    for (const row of rows) {
      const loc = row[1]?.trim() ? row[1].trim() : "(unknown)";
      byLoc.set(loc, (byLoc.get(loc) ?? 0) + 1);
    }
    const byLocale = [...byLoc.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([locale, count]) => ({ locale, count }));
    glossary = { available: true, totalTerms: rows.length, byLocale };
  } else {
    glossary = { available: false, totalTerms: 0, byLocale: [] };
  }

  return { cache, uiStrings, glossary };
}
