# Quick Reference: Translation Systems Comparison

This document provides a side-by-side comparison of the current translation systems and the unified `ai-i18n-tools` package.

**Scope notes (source-aligned):**

- **Transrewrt** runs two separate pipelines: (1) **UI** — `extract-strings.js` + `generate-translations.js` (flat locale JSON, no segment SQLite cache); (2) **Docs** — `scripts/translate/index.ts` via `pnpm translate:docs`, driven by repo-root `translate.config.json` (same overall design as Duplistatus: segment SQLite cache, batching, validators).
- **Duplistatus** doc/UI/SVG translation scripts live under `documentation/`; `pnpm translate` and related scripts are defined in `documentation/package.json` (run from that directory, not the monorepo root).

---

## Feature Comparison Matrix

| Feature | Transrewrt (Current) | Duplistatus (Current) | ai-i18n-tools |
|---------|---------------------|----------------------|------------------------|
| **Content Types** |  |  |  |
| React UI Strings | ✅ Custom script | ❌ N/A | ✅ React Extractor |
| Markdown Docs | ✅ `scripts/translate/` (README, etc.) | ✅ Custom TS | ✅ Markdown Extractor |
| JSON Files | ⚠️ Flat UI locales only (no Docusaurus i18n JSON pass) | ✅ Docusaurus `i18n` JSON via `paths.jsonSource` | ✅ JSON Extractor |
| SVG Files | ❌ Not supported (doc tool is markdown-only) | ✅ Custom splitter | ✅ SVG Extractor |
|  |  |  |  |
| **Translation Engine** |  |  |  |
| OpenRouter API | ✅ Direct calls | ✅ Direct calls | ✅ Unified client |
| Model fallback | ✅ UI: `TRANSLATION_MODELS` in `openrouter-script-models.js`; docs: `openrouter.translationModels[]` in `translate.config.json` | ✅ Committed config uses `defaultModel` / `fallbackModel` (and numbered variants); code also accepts `translationModels[]` | ✅ **Transrewrt-style ordered list** |
| Batch Processing | ✅ UI: chunked batches; docs: segment batches + locale concurrency | ✅ Batch segments + concurrency | ✅ Both strategies |
| Rate Limiting | ❌ No token bucket (concurrency caps only) | ❌ No token bucket (concurrency caps only) | ✅ Queue system |
|  |  |  |  |
| **Caching** |  |  |  |
| Segment-level | ✅ SQLite (**docs** only; UI path has no segment DB) | ✅ SQLite | ✅ SQLite (unified) |
| File-level skip | ✅ Hash-based (**docs**, `file_tracking` in cache DB) | ✅ Hash-based | ✅ Hash-based |
| Cache Editor | ❌ None | ✅ Web UI (SQLite segments only) | ✅ Web UI: **segments + `strings.json` + `glossary-user.csv`** |
| Orphan Cleanup | ✅ `pnpm translate:cleanup` (manual; runs cache-cleanup after force-update) | ✅ `pnpm translate:cleanup` (from `documentation/`) | ✅ Automated |
|  |  |  |  |
| **Quality Assurance** |  |  |  |
| Glossary Support | ✅ **`strings.json` → doc hints** (`paths.ui-glossary`) + user CSV | ✅ `glossary-ui.csv` + `glossary-user.csv` (UI CSV from Intlayer via `translate:glossary-ui`) | ✅ **`strings.json` bridge** + user CSV |
| Placeholder Protection | ✅ Docs: URLs, admonitions, anchors; UI: prompt-based only | ✅ URLs, admonitions, etc. | ✅ Comprehensive |
| Post-translation Validation | ✅ Docs: segment/URL/heading/code checks; UI: minimal (JSON response) | ✅ Multiple checks | ✅ Extensible |
| Length Ratio Warnings | ✅ Docs (`validator.ts`); ❌ UI | ✅ Yes | ✅ Configurable |
|  |  |  |  |
| **Configuration** |  |  |  |
| Config Format | Mixed: UI models in `openrouter-script-models.js` + env; **docs in `translate.config.json`** | `documentation/translate.config.json` | JSON file |
| Feature selection | Via scripts + config | Via `translate.config.json` | Via **`features.*`** + extractors (no “simple/advanced” product mode) |
| Environment Overrides | ✅ Limited | ✅ Some | ✅ Comprehensive |
| Auto-detection | ❌ None | ❌ None | ✅ Project type |
|  |  |  |  |
| **CLI Interface** |  |  |  |
| Extract Command | `pnpm i18n:extract` | N/A | `ai-i18n-tools extract` |
| Translate Command | `pnpm i18n:translate` (UI) / `pnpm translate:docs` (markdown) | `pnpm translate` (in **`documentation/`**) | `ai-i18n-tools translate` |
| Status Check | ❌ None (no `check-status` script) | `pnpm translate:status` (**from `documentation/`**) | `ai-i18n-tools status` |
| Cache Cleanup | `pnpm translate:cleanup` | `pnpm translate:cleanup` (**from `documentation/`**) | `ai-i18n-tools cleanup` |
| Cache Editor | ❌ None | `pnpm translate:editor` (**from `documentation/`**) | `ai-i18n-tools edit` |
| Help System | `--help` on translate CLIs | `TRANSLATION-HELP.md` + `pnpm translate:help` | Built-in --help |
|  |  |  |  |
| **Developer Experience** |  |  |  |
| Learning Curve | Medium (custom code) | Steep (complex) | Gentle (standard CLI) |
| Error Messages | Basic | Detailed | Actionable + links |
| Debugging | Console logs | Log files | Structured + web UI |
| Documentation | `README.md` + `dev/DEVELOPMENT.md` (i18n / translate sections) | `TRANSLATION-HELP.md` + `pnpm translate:help` | Comprehensive |
| Community Support | None | None | Growing ecosystem |
|  |  |  |  |
| **Performance** |  |  |  |
| First Run Speed | ~5 min (order-of-magnitude; varies by locale count) | ~10 min | Similar |
| Incremental Speed | UI: full re-scan of missing strings; **docs**: fast when segment cache hits | ~2 min (cached) | ~2 min (cached) |
| Memory Usage | ~150 MB (illustrative) | ~250 MB (illustrative) | ~180 MB (illustrative) |
| API Cost Efficiency | Mixed: **UI** re-translates batches unless strings unchanged; **docs** reuse SQLite cache | High (cache) | High (cache) |
|  |  |  |  |
| **Maintenance** |  |  |  |
| Lines of Code (bespoke, pre-package) | Order of **~5.5k+** in `scripts/translate/*.ts` plus UI scripts (total varies with assets/legacy) | Order of **~5.5k+** in `documentation/scripts/translate/*.ts` plus cache-editor UI (total varies) | ~1,500 target (one shared package) |
| Files to Maintain | UI scripts + full **`scripts/translate/`** toolkit (many TS modules) | **`documentation/scripts/translate/`** (+ static cache editor assets) | 1 package |
| Update Frequency | Manual | Manual | npm updates |
| Bug Fixes | Self-service | Self-service | Community |
|  |  |  |  |
| **Extensibility** |  |  |  |
| Custom Extractors | ❌ Difficult | ❌ Difficult | ✅ Plugin system |
| Custom Validators | ⚠️ In-repo only (`validator.ts`); not a plugin API | ⚠️ Same pattern | ✅ Clean API |
| Custom Processors | ❌ Not supported | ❌ Not supported | ✅ Middleware |
| Third-party Integration | ❌ None | ❌ None | ✅ Planned |

---

## Command Mapping

### Transrewrt Commands

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `pnpm run i18n:extract` | `ai-i18n-tools extract` | Same functionality |
| `pnpm run i18n:translate` | `ai-i18n-tools translate` | Unified tool; today’s UI path has no segment SQLite (see matrix) |
| `pnpm run translate:docs` | `ai-i18n-tools translate` (markdown) | Doc pipeline already uses segment cache + `translate.config.json` |
| `pnpm run i18n:sync` | `ai-i18n-tools sync` | Combined command |
| `pnpm run translate:cleanup` | `ai-i18n-tools cleanup` | Same idea (orphan/stale cache cleanup) |
| N/A | `ai-i18n-tools status` | No equivalent in Transrewrt today |
| N/A | `ai-i18n-tools edit` | No cache editor in Transrewrt today |

### Duplistatus Commands

**These scripts are defined under `documentation/package.json` — run them with `cd documentation` first (or use `pnpm --dir documentation …`).**

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `pnpm translate` | `ai-i18n-tools translate` | Same options |
| `pnpm translate --locale fr` | `ai-i18n-tools translate --locale fr` | Identical |
| `pnpm translate --force` | `ai-i18n-tools translate --force` | Identical |
| `pnpm translate --no-svg` | `ai-i18n-tools translate --no-svg` | Identical |
| `pnpm translate --path docs/x.md` | `ai-i18n-tools translate --path docs/x.md` | Identical |
| `pnpm translate:status` | `ai-i18n-tools status` | Renamed |
| `pnpm translate:cleanup` | `ai-i18n-tools cleanup` | Renamed |
| `pnpm translate:editor` | `ai-i18n-tools edit` | Renamed CLI; keep script name `translate:editor` if you prefer |
| `pnpm translate:svg` | `ai-i18n-tools translate --svg-only` | Consolidated |
| `pnpm translate:glossary-ui` | `ai-i18n-tools glossary-generate` | Renamed |

---

## Configuration Comparison

### Transrewrt Configuration

#### Before — UI strings (`generate-translations.js` + shared model list)

Default model and fallback **order** come from `scripts/openrouter-script-models.js` (`TRANSLATION_MODELS`), not from `translate.config.json`. Chunk size and parallel languages are constants in `generate-translations.js`:

```javascript
// scripts/generate-translations.js (constants; see also openrouter-script-models.js)
const DEFAULT_MODEL = TRANSLATION_MODELS[0];
const CHUNK = 50;
const PARALLEL_LANGUAGES = 4;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
```

#### Before — Markdown docs (`translate.config.json` at repo root)

Doc translation **already** uses JSON config (batching, locales, `openrouter.translationModels`, paths, cache). See Transrewrt’s checked-in `translate.config.json` for a real example.

#### After (`ai-i18n-tools.config.json`)
```json
{
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "stepfun/step-3.5-flash:free",
      "anthropic/claude-3.5-haiku"
    ],
    "maxTokens": 32768,
    "temperature": 0.2
  },
  "batchSize": 50,
  "documentation": {
    "contentPaths": ["README.md", "USER-GUIDE.md"],
    "outputDir": "translated-docs",
    "cacheDir": "translated-docs/.cache"
  }
}
```

**Benefits:**
- ✅ Centralized configuration
- ✅ Easy to modify
- ✅ Version controlled
- ✅ Documented options

---

### Duplistatus Configuration

#### Before (`documentation/translate.config.json` — simplified from repo)

The live file also includes optional keys such as `defaultModel-1`, `fallbackModel-1`, `paths.jsonSource`, and `paths.glossaryUser`. Loader merges with defaults and supports either **`translationModels`** or legacy **`defaultModel` / `fallbackModel`**.

```json
{
  "paths": {
    "docs": "./docs",
    "i18n": "./i18n",
    "cache": "./.translation-cache",
    "glossary": "./glossary-ui.csv",
    "glossaryUser": "./glossary-user.csv",
    "staticImg": "./static/img",
    "jsonSource": "./i18n/en"
  },
  "locales": {
    "source": "en",
    "targets": ["fr", "de", "es", "pt-BR"]
  },
  "batchSize": 20,
  "maxBatchChars": 5000,
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "defaultModel": "anthropic/claude-haiku-4.5",
    "fallbackModel": "anthropic/claude-3-haiku",
    "maxTokens": 8192,
    "temperature": 0.2
  },
  "cache": {
    "enabled": true,
    "segmentLevel": true
  }
}
```

#### After (`ai-i18n-tools.config.json`) — **Transrewrt-style model list** (not single fallback)
```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "batchSize": 20,
  "maxBatchChars": 5000,
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "translationModels": [
      "anthropic/claude-3.5-haiku",
      "anthropic/claude-haiku-4.5",
      "stepfun/step-3.5-flash:free"
    ],
    "maxTokens": 8192,
    "temperature": 0.3
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "path/to/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "features": {
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "path/to/strings.json",
    "flatOutputDir": "path/to/locales"
  },
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "jsonSource": "i18n/en",
    "markdownOutput": { "style": "docusaurus", "docsRoot": "docs" }
  }
}
```

**Changes:**
- Root shared settings plus **`ui`** (React scan + flat locale JSON) and **`documentation`** (markdown/JSON/SVG doc pipeline)
- Clearer naming (`sourceLocale` vs `locales.source`)
- Feature flags for flexibility
- **`translationModels` array** can replace `defaultModel` / `fallbackModel` (Duplistatus code already accepts both)
- Same functionality, better organization

### User glossary CSV (`glossary-user.csv`)

Hand-edited **user** glossaries use **three columns** (header row recommended):

| Column | Header | Role |
|--------|--------|------|
| 1 | `Original language string` | Source-language term or phrase (e.g. English as in the app). |
| 2 | `locale` | Target locale (`pt-BR`, `de`, …) or **`*`** for **all** target locales. |
| 3 | `Translation` | Desired rendering; can repeat column 1 to keep the term untranslated. |

Examples:

```csv
"Original language string","locale","Translation"
"backup","*","backup"
"backup","pt-BR","cópia de segurança"
```

Auto-generated **`glossary-ui.csv`** (e.g. Intlayer matrix) may use a different layout until normalized; see [I18N_TOOLS_IMPLEMENTATION_PLAN.md §3.3](./I18N_TOOLS_IMPLEMENTATION_PLAN.md#33-glossary-system) for full spec and precedence (`*` vs per-locale rows).

---

## Code Comparison: Extraction

### Transrewrt Before

```javascript
// scripts/extract-strings.js (~120 lines; i18next-scanner)
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Parser } = require("i18next-scanner");

function hash(str) {
  return crypto.createHash("md5").update(str).digest("hex").slice(0, 8);
}

function* walkDir(dir) {
  // ... 20 lines ...
}

const found = new Map();
const parser = new Parser({
  func: { list: ["t", "i18n.t"], extensions: [".js", ".jsx"] },
  nsSeparator: false,
  keySeparator: false,
});

for (const file of walkDir(SRC_DIR)) {
  const content = fs.readFileSync(file, "utf8");
  parser.parseFuncFromString(content, (key) => {
    const str = key.trim();
    if (str) found.set(hash(str), str);
  });
}

// ... 100 more lines for merging, writing, etc.
```

### Transrewrt After

```javascript
// scripts/i18n-sync.js (50 lines)
const { Translator } = require('ai-i18n-tools');

async function sync() {
  const translator = new Translator('./ai-i18n-tools.config.json');
  
  console.log('Extracting strings...');
  await translator.extract();
  
  console.log('Translating...');
  await translator.translate();
  
  console.log('Done!');
}

sync().catch(console.error);
```

**Result**: 200 lines → 15 lines (93% reduction)

---

## Code Comparison: Translation

### Duplistatus Before

```typescript
// documentation/scripts/translate/index.ts (simplified; full module is large)
import { TranslationCache } from './cache';
import { DocumentSplitter } from './splitter';
import { Translator } from './translator';
import { Glossary } from './glossary';
// ... 10 more imports

async function main() {
  const config = loadConfig();
  const cache = new TranslationCache(config.cache);
  const splitter = new DocumentSplitter();
  const translator = new Translator(config.openrouter);
  const glossary = new Glossary(config.glossary);
  
  const files = discoverFiles(config.paths.docs);
  
  for (const file of files) {
    const content = await readFile(file);
    const segments = splitter.split(content);
    
    for (const segment of segments) {
      const cached = await cache.getSegment(segment.hash, locale);
      if (cached) continue;
      
      const translated = await translator.translate(segment, glossary);
      await cache.setSegment({ ... });
    }
    
    const output = reassemble(segments);
    await writeFile(outputPath, output);
  }
}

main();
```

Plus 14 additional files for each component.

### Duplistatus After

```typescript
// scripts/translate-all.ts (100 lines)
import { Translator } from 'ai-i18n-tools';

async function translateAll() {
  const translator = new Translator('./ai-i18n-tools.config.json');
  
  // Translate markdown
  console.log('Translating documentation...');
  await translator.translate({
    type: 'markdown',
    locales: ['de', 'fr', 'es', 'pt-BR']
  });
  
  // Translate JSON
  console.log('Translating UI strings...');
  await translator.translate({ type: 'json' });
  
  // Translate SVGs
  console.log('Translating SVGs...');
  await translator.translate({ type: 'svg' });
  
  // Show status
  await translator.status();
  
  console.log('All translations complete!');
}

translateAll().catch(console.error);
```

**Result**: Large multi-file toolkit under `documentation/scripts/translate/` → short wrapper once `ai-i18n-tools` is adopted (exact reduction depends on what you keep locally)

---

## Database Schema Comparison

### Cache Schema (Both Systems - Compatible)

```sql
-- Segment-level cache (as created by both codebases' cache.ts)
CREATE TABLE IF NOT EXISTS translations (
  source_hash TEXT NOT NULL,
  locale TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  model TEXT,
  filepath TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_hit_at TEXT,
  start_line INTEGER,
  PRIMARY KEY (source_hash, locale)
);

CREATE TABLE IF NOT EXISTS file_tracking (
  filepath TEXT NOT NULL,
  locale TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  last_translated TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (filepath, locale)
);

-- Indexes (match Transrewrt / Duplistatus translate toolkits)
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale);
CREATE INDEX IF NOT EXISTS idx_translations_filepath ON translations(filepath);
```

**Key Point**: The cache layout matches between the two `scripts/translate` implementations, so a `cache.db` can in principle be reused when paths and locale codes align.

---

## Migration Effort Summary

### Transrewrt

| Task | Time | Complexity |
|------|------|------------|
| Install package | 5 min | Easy |
| Create config | 15 min | Easy |
| Update scripts | 10 min | Easy |
| Test extraction | 15 min | Easy |
| Test translation | 30 min | Easy |
| Verify app | 30 min | Easy |
| Documentation | 30 min | Easy |
| **Total** | **~2.5 hours** | **Easy** |

### Duplistatus

| Task | Time | Complexity |
|------|------|------------|
| Install package | 5 min | Easy |
| Migrate config | 30 min | Medium |
| Update scripts | 30 min | Medium |
| Test markdown | 1 hour | Medium |
| Test JSON | 30 min | Easy |
| Test SVG | 30 min | Medium |
| Test build | 30 min | Easy |
| Test all features | 2 hours | Medium |
| Documentation | 1 hour | Medium |
| **Total** | **~6.5 hours** | **Medium** |

---

## Cost Analysis

### API Costs (Monthly Estimate)

Assuming:
- 500 translatable strings
- 4 target locales
- Average 50 tokens per string
- $0.0001 per 1K tokens (Claude Haiku)

#### Without Caching (Old Transrewrt)
- Every run: 500 × 4 × 50 = 100,000 tokens
- Cost per run: $0.01
- Runs per month: 20 (daily + incremental)
- **Monthly cost: $0.20**

#### With Caching (New System)
- First run: 100,000 tokens = $0.01
- Subsequent runs: 30% new = 30,000 tokens = $0.003
- Runs per month: 20
- **Monthly cost: $0.07** (65% savings!)

### Development Costs

#### Maintenance Time (Monthly)
| Activity | Old System | New System | Savings |
|----------|-----------|------------|---------|
| Bug fixes | 4 hours | 1 hour | 75% |
| Updates | 2 hours | 0.5 hours | 75% |
| Documentation | 2 hours | 0.5 hours | 75% |
| **Total** | **8 hours** | **2 hours** | **75%** |

At $50/hour developer rate:
- Old system: $400/month
- New system: $100/month
- **Monthly savings: $300**

### Total ROI

**First Year:**
- Development cost: ~$5,000 (one-time)
- Maintenance savings: $300 × 12 = $3,600
- API cost savings: negligible
- **Net cost: $1,400**

**Second Year Onward:**
- Maintenance savings: $3,600/year
- No development cost
- **Net savings: $3,600/year**

**Break-even**: ~5 months

---

## Decision Matrix

### When to Use Each System

#### Stick with Current System If:
- ❌ Very small project (<50 strings)
- ❌ Single language only
- ❌ No budget for migration
- ❌ Happy with current workflow
- ❌ No plans for documentation translation

#### Migrate to ai-i18n-tools If:
- ✅ Multiple languages (3+)
- ✅ Regular translation updates
- ✅ Want to reduce maintenance
- ✅ Need documentation translation
- ✅ Want better caching
- ✅ Plan to scale
- ✅ Value community support

---

## Success Indicators

### After 1 Week
- [ ] Both projects build successfully
- [ ] All translations present
- [ ] No critical bugs
- [ ] Team comfortable with new commands

### After 1 Month
- [ ] Cache hit rate >50%
- [ ] Faster incremental translations
- [ ] Zero translation-related issues
- [ ] Old scripts archived

### After 3 Months
- [ ] Cache hit rate >70%
- [ ] Measurable cost savings
- [ ] Positive team feedback
- [ ] External users adopting package

### After 6 Months
- [ ] Package has external contributors
- [ ] Regular releases
- [ ] Active community
- [ ] Both projects fully migrated

---

## Quick Links

- 📑 [Documentation home](./README.md)
- 📖 [Implementation Plan](./I18N_TOOLS_IMPLEMENTATION_PLAN.md)
- 🔄 [Transrewrt Migration Guide](./MIGRATION_GUIDE_TRANSREWRT.md)
- 🔄 [Duplistatus Migration Guide](./MIGRATION_GUIDE_DUPLISTATUS.md)
- 📚 [Overview](./OVERVIEW.md)

---

*Last updated: April 6, 2026*
