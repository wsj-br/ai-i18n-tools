# ai-i18n-tools - Implementation Plan

**Documentation index:** [README.md](./README.md) (user guides and migration docs). This file is the **deep** roadmap: architecture, phases, glossary/editor specs, and checklist items for contributors.

## Overview

This document outlines the complete implementation plan for creating `ai-i18n-tools`, a unified internationalization package that consolidates:

1. **UI translation** — i18next / literal `t("…")` extraction and OpenRouter translation (Transrewrt pattern). This is the target for Duplistatus to **replace Intlayer** (`.content.ts` modules and Intlayer hooks), for simpler maintenance, RTL support, and fast language switching.
2. **Document translation** — **Foundation: Transrewrt** `scripts/translate/*.ts` (on the order of **~5.5k lines** of TypeScript in that tree today, plus deprecated `translate-docs.js` ~1,250 lines). This matches Duplistatus’s **`documentation/scripts/translate/`** architecture (segment SQLite cache, batching, validators) with **richer Transrewrt options** (`config.ts`, concurrency, anchor placeholders, etc.). The package **ports Transrewrt’s tree as the core** and **merges in** Duplistatus-only modules: Docusaurus JSON splitting, SVG translation, `check-status`, and the web cache editor.

   **OpenRouter config (aligned with [COMPARISON.md](./COMPARISON.md))** — **Canonical for the new package**: an ordered **`translationModels[]`** list (same semantics as Transrewrt’s **`translate.config.json`** doc pipeline). **Transrewrt UI** strings today still take their default model **chain** from **`scripts/openrouter-script-models.js`** (`TRANSLATION_MODELS`), not from `translate.config.json`; unifying that into one config file is part of adoption. **Duplistatus** committed **`documentation/translate.config.json`** uses **`defaultModel` / `fallbackModel`** (and optional numbered variants); its **`config.ts` already resolves either** `translationModels[]` **or** the legacy pair via `resolveTranslationModels`. New configs and migrations should prefer **`translationModels[]`**.

**Glossary bridge (terminology alignment)** — See [Glossary pipeline (first-class feature)](#glossary-pipeline-first-class-feature) below; implementation tasks live under [§3.3 Glossary System](#33-glossary-system).

**Rollout order** — (1) Implement and test `ai-i18n-tools` in this repo. (2) Integrate into **Transrewrt** first (smaller surface). (3) Integrate into **Duplistatus** (UI Intlayer migration + doc scripts). (4) Test locally. (5) **Publish to npm**. (6) Ship new releases of Transrewrt and Duplistatus that depend on the published package.

**Rough code inventory today** (to be absorbed or replaced by the package):

| Area | Transrewrt | Duplistatus |
|------|------------|-------------|
| UI extract + translate (JS) | ~750 lines (`extract-strings.js`, `generate-translations.js`, models) | N/A (Intlayer today; migrate to `t()` + package) |
| Document translator (TS) | ~5.5k lines under `scripts/translate/` (order of magnitude) | ~5.5k lines under `documentation/scripts/translate/*.ts` + cache-editor UI (order of magnitude) |
| Legacy doc script | ~1,250 lines `translate-docs.js` (deprecated) | — |

**Goal**: One npm package with a small integration footprint per app (config + npm scripts), preserving behavior and improving shared maintenance — not a misleading “96% from 3,650 lines” headline; total legacy code across both apps is on the order of **~12k+ lines** before consolidation.

**Explicit product features** — Segment/file SQLite cache for **doc (and unified) flows**; batch OpenRouter calls; **OpenRouter model list with sequential fallback** (`translationModels[]` — try index 0, on failure try index 1, etc.); **legacy** `defaultModel` + `fallbackModel` accepted at config-load time for Duplistatus-style migrations; CSV + `strings.json` glossary; **RTL-capable UI path** (consumers use i18next direction/locale switching as Transrewrt does); placeholder protection; validation; **web translation editor** (`edit`) covering **document cache segments**, **`strings.json` UI strings**, and **`glossary-user.csv`** (see [§4.7](#47-translation-editor-web-ui)). *(Today’s Transrewrt **UI** pipeline has no segment SQLite; the package aims to unify caching behavior across UI + docs where configured.)*

## Glossary pipeline (first-class feature)

This is the **terminology bridge** between UI and documentation — the mechanism that keeps product copy and docs aligned.

1. **Extract** — Scan literal `t("…")` / `i18n.t("…")` calls; write **`strings.json`** (hashed keys, English `source` text).
2. **Translate UI** — OpenRouter fills **`translated[locale]`** for each entry (same batched flow as Transrewrt’s `generate-translations.js` today).
3. **Translate docs** — Doc mode loads **`glossary.uiGlossaryFromStringsJson`** (Transrewrt equivalent: `translate.config.json` → `paths.ui-glossary`). The glossary matcher finds overlapping source strings and injects hints into prompts so the model reuses **the same** wording as the UI (e.g. “backup” → “Sicherung” in German in both UI and docs).
4. **Overrides** — **`glossary-user.csv`** (and, during transition, legacy **`glossary-ui.csv`**) take priority where configured. User CSV columns: **`Original language string`**, **`locale`**, **`Translation`** (use **`*`** in `locale` for all targets) — see [§3.3 Glossary System](#33-glossary-system).

**Operational rule** — Keep UI `strings.json` up to date and paths stable *before* expecting doc quality from the bridge. On Duplistatus, complete **Part A** (Intlayer → i18next + `t()`) so a real `strings.json` exists for doc config to reference.

**Implementation tasks** — [§3.3 Glossary System](#33-glossary-system).

---

## Table of Contents

1. [Glossary pipeline (first-class feature)](#glossary-pipeline-first-class-feature)
2. [Project Structure](#project-structure)
3. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
4. [Phase 2: Content Extractors](#phase-2-content-extractors)
5. [Phase 3: Translation Engine](#phase-3-translation-engine)
6. [Phase 4: CLI & Developer Tools](#phase-4-cli--developer-tools)
7. [Phase 5: Testing & Documentation](#phase-5-testing--documentation)
8. [Phase 6: Publishing & Migration](#phase-6-publishing--migration)
9. [Technical Specifications](#technical-specifications)
10. [Success Metrics](#success-metrics)

---

## Implementation status (repository)

The **code MVP** for this plan lives under [`src/`](../src/) in this repo (not a blank scaffold):

- **Phase 1–3 (core)**: Zod config, env overrides, SQLite cache, OpenRouter client with ordered **`translationModels[]`** fallback (plus legacy `defaultModel` / `fallbackModel` resolution), batch prompts, glossary from **`strings.json`** + user CSV, markdown / JSON / SVG extractors and doc translation pipeline.
- **Phase 4 (CLI)**: `init`, `extract`, **`translate-ui`** (UI batch JSON array, Transrewrt-aligned), `translate` (docs + optional UI when `features.translateUIStrings`), `sync`, `status`, `cleanup`, `edit` (Express + static `edit-cache-app/`), `glossary-generate`.
- **Tooling**: ESLint, Prettier, Jest unit tests, GitHub Actions CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

**Follow-ups** (not exhaustive): deeper integration tests against real Transrewrt/Duplistatus trees, optional concurrency / full parity with every edge case in legacy `scripts/translate/index.ts`, broader cache/UI unification as described in the overview.

---

## Project Structure

Single npm package at the repository root (no pnpm workspace monorepo). Implementation is seeded from **Transrewrt** `scripts/translate/` and extended with **Duplistatus**-only modules.

```
ai-i18n-tools/
├── src/
│   ├── index.ts                 # Public API exports
│   ├── core/
│   │   ├── translator.ts        # Main orchestrator (from Transrewrt index.ts)
│   │   ├── cache.ts             # SQLite cache
│   │   ├── config.ts            # Configuration loader (generalized)
│   │   ├── types.ts
│   │   └── errors.ts
│   ├── extractors/
│   │   ├── base-extractor.ts
│   │   ├── react-extractor.ts   # i18next-scanner (UI strings → strings.json)
│   │   ├── markdown-extractor.ts
│   │   ├── json-extractor.ts    # Docusaurus JSON (from Duplistatus)
│   │   └── svg-extractor.ts     # From Duplistatus
│   ├── processors/
│   │   ├── batch-processor.ts
│   │   ├── placeholder-handler.ts
│   │   └── validator.ts
│   ├── glossary/
│   │   ├── loader.ts            # CSV + strings.json (UI glossary bridge)
│   │   └── matcher.ts
│   ├── api/
│   │   └── openrouter.ts        # Transrewrt-style: translationModels[] + chain fallback
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── file-utils.ts
│   │   ├── hash.ts
│   │   └── ignore-parser.ts
│   ├── server/
│   │   └── translation-editor.ts   # Express app: APIs for cache + strings.json + glossary CSV (launched by `edit`)
│   └── cli/
│       ├── index.ts
│       ├── commands/            # init, extract, translate, sync, status, cleanup, edit, glossary-generate
│       └── helpers.ts
├── edit-cache-app/              # SPA: tabs — Document segments | UI strings | Glossary (extends Duplistatus cache UI)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/                        # This folder (plan, migration guides, overview)
├── examples/                    # Optional sample consumers
├── package.json
├── tsconfig.json
└── README.md
```

**Configuration model** — Use **feature / extractor flags** and paths (not “simple” vs “advanced” modes). Example: `features.extractUIStrings`, `features.translateMarkdown`, `features.translateJSON`, `features.translateSVG`; each consumer enables the subset it needs.

---

## Phase 1: Core Infrastructure

**Duration**: Week 1-2  
**Priority**: 🔴 Critical

### Tasks

#### 1.1 Repository & toolchain (single package)
- [ ] Confirm root `package.json`, `tsconfig.json`, `src/` layout (no `pnpm-workspace.yaml`)
- [ ] Set up ESLint + Prettier
- [ ] Configure Jest for testing
- [ ] Add CI/CD workflow (GitHub Actions)

**Files to create or maintain:**
```
- package.json (root — publishes `ai-i18n-tools`)
- tsconfig.json
- `eslint.config.mjs` (flat config; ESLint 9+)
- .prettierrc
- .github/workflows/ci.yml
```

#### 1.2 Type Definitions
- [ ] Define all TypeScript interfaces
- [ ] Create union types for content types
- [ ] Define configuration schema with Zod
- [ ] Export public API types

**Key files:**
```typescript
// src/core/types.ts
export interface I18nConfig { ... }
export interface Segment { ... }
export interface TranslationResult { ... }
export interface ContentExtractor { ... }
export type SegmentType = 'ui-string' | 'heading' | ...;
```

#### 1.3 Configuration System
- [ ] Implement config loader with validation (Zod or equivalent)
- [ ] **Extractor / feature flags** only (no “simple” vs “advanced” product modes)
- [ ] Environment variable overrides
- [ ] Config file generation (`ai-i18n-tools init`)

**Features:**
- Optional templates for Transrewrt-like vs Docusaurus-like layouts
- Merge defaults with user config
- Validate required fields per enabled features
- Support `.json` (and optionally `.ts`) config formats
- **RTL**: config schema / docs acknowledge RTL target locales; the package supplies translated strings — **layout `dir` and instant language switch** remain the app’s **i18next** responsibility (same as Transrewrt today)

**Example — Transrewrt-style (UI + optional docs + glossary bridge):**
```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "stepfun/step-3.5-flash:free",
      "anthropic/claude-3-haiku",
      "z-ai/glm-4.7-flash",
      "minimax/minimax-m2.5",
      "anthropic/claude-3.5-haiku"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "src/renderer/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/renderer/"],
    "stringsJson": "src/renderer/locales/strings.json",
    "flatOutputDir": "src/renderer/locales/"
  },
  "documentation": {
    "contentPaths": ["README.md", "USER-GUIDE.md"],
    "outputDir": "translated-docs",
    "cacheDir": "translated-docs/.cache",
    "markdownOutput": { "style": "flat", "linkRewriteDocsRoot": "." }
  }
}
```

**Example — Docusaurus docs (same OpenRouter semantics as Transrewrt; UI migration uses same `t()` pipeline):**
```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
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
  "features": {
    "extractUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "path/to/strings.json",
    "userGlossary": "glossary-user.csv"
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

**OpenRouter model policy (package reference)** — Prefer **`translationModels`**: an **ordered array**. For each request, the client uses the first model; on transport/API/rate-limit or empty-parse failure, it **advances to the next** model until one succeeds or the list is exhausted. **Duplistatus** today: committed JSON often has **`defaultModel` + `fallbackModel`**; the existing loader builds an ordered list from those when `translationModels` is absent — the package should keep that compatibility and document migration to an explicit array. **Migration tip**: map `defaultModel` → `translationModels[0]`, `fallbackModel` → `translationModels[1]`, then add further fallbacks as needed.

#### 1.4 SQLite Cache Manager
- [ ] Design database schema
- [ ] Implement CRUD operations
- [ ] Add connection pooling
- [ ] Create migration system
- [ ] Add backup/restore functionality

**Schema** (match Transrewrt / Duplistatus `cache.ts` today; see [COMPARISON.md](./COMPARISON.md)):
```sql
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

CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale);
CREATE INDEX IF NOT EXISTS idx_translations_filepath ON translations(filepath);
```

**API:**
```typescript
class TranslationCache {
  getSegment(hash: string, locale: string): Promise<string | null>;
  setSegment(entry: CacheEntry): Promise<void>;
  getFileStatus(filepath: string, locale: string): Promise<FileTracking | null>;
  setFileStatus(filepath: string, locale: string, hash: string): Promise<void>;
  resetLastHitAtForUnhit(keys: string[]): Promise<void>;
  cleanup(): Promise<CleanupStats>;
}
```

#### 1.5 Logging System
- [ ] Structured logging with levels
- [ ] File output with rotation
- [ ] Console formatting (colors)
- [ ] Session log capture
- [ ] Debug traffic logging

**Features:**
- Timestamped log files
- ANSI color codes for console
- Separate logs for API traffic
- Log level filtering (info, warn, error, debug)

---

## Phase 2: Content Extractors

**Duration**: Week 3-4  
**Priority**: 🔴 Critical

**Source priority** — Implement against **Transrewrt** `scripts/translate/` and `extract-strings.js` / `generate-translations.js`. Port **JSON (Docusaurus)**, **SVG**, **status**, and **edit** (segment UI) from **Duplistatus**, then **extend** the server and SPA with **UI `strings.json`** and **`glossary-user.csv`** editing ([§4.7](#47-translation-editor-web-ui)); do **not** treat Duplistatus as the authority for OpenRouter or core doc splitting.

### Tasks

#### 2.1 Base Extractor Interface
- [ ] Define abstract base class
- [ ] Implement common utilities
- [ ] Create segment hash computation
- [ ] Add validation helpers

```typescript
abstract class BaseExtractor implements ContentExtractor {
  abstract name: string;
  abstract canHandle(filepath: string): boolean;
  abstract extract(content: string, filepath: string): Segment[];
  abstract reassemble(segments: Segment[], translations: Map<string, string>): string;
  
  protected computeHash(content: string): string;
  protected normalizeWhitespace(text: string): string;
}
```

#### 2.2 React/JSX Extractor
- [ ] Integrate i18next-scanner Parser API
- [ ] Support `t()`, `i18n.t()` patterns
- [ ] Handle template literals
- [ ] Extract from `.js`, `.jsx`, `.ts`, `.tsx`
- [ ] Preserve escape sequences (`\n`, `\t`)

**From Transrewrt:**
- Use existing `i18next-scanner` Parser
- MD5-based hashing (first 8 chars)
- Trim keys for consistency
- Merge with package.json description

**Configuration:**
```json
{
  "reactExtractor": {
    "patterns": ["t\\((['\"`])(.*?)\\1"],
    "extensions": [".js", ".jsx", ".ts", ".tsx"],
    "includePackageDescription": true
  }
}
```

#### 2.3 Markdown Extractor
- [ ] Parse frontmatter (gray-matter)
- [ ] Split into segments (headings, paragraphs, etc.)
- [ ] Identify non-translatable blocks (code, images)
- [ ] Preserve admonition syntax
- [ ] Handle MDX components

**Reference: Transrewrt** `splitter.ts` (primary). Align behavior with Duplistatus where both apps need the same segment rules (headings, paragraphs, admonitions, code, frontmatter fields).

**Segment classification:**
```typescript
function classifySegment(text: string): SegmentType {
  if (/^#{1,6}\s/.test(text)) return 'heading';
  if (/^!\[.*\]\(.*\)/.test(text)) return 'other'; // image
  if (/^import /.test(text)) return 'other';
  if (/^</.test(text)) return 'other'; // JSX/HTML
  return 'paragraph';
}
```

#### 2.4 JSON Extractor
- [ ] Parse nested JSON structure
- [ ] Extract `message` fields
- [ ] Preserve `description` fields
- [ ] Maintain key hierarchy
- [ ] Pretty-print output (2-space indent)

**From Duplistatus:**
- Docusaurus JSON format: `{ "key": { "message": "...", "description": "..." } }`
- Only translate `message` values
- Keep `description` as developer context
- Preserve all other fields

#### 2.5 SVG Extractor
- [ ] Parse `<text>` and `<title>` elements
- [ ] Handle nested `<tspan>` tags
- [ ] Preserve XML attributes
- [ ] Escape special characters
- [ ] Optional Inkscape PNG export

**From Duplistatus:**
- Regex-based element extraction
- Store full match for reassembly
- Lowercase transformation option
- Skip files via `.translate-ignore`

#### 2.6 Placeholder Protection
- [ ] URL placeholder system
- [ ] Admonition placeholder system
- [ ] Code block preservation
- [ ] HTML tag protection

**Implementation:**
```typescript
class PlaceholderHandler {
  protectUrls(text: string): { text: string; map: Map<string, string> };
  restoreUrls(text: string, map: Map<string, string>): string;
  
  protectAdmonitions(text: string): { text: string; maps: {...} };
  restoreAdmonitions(text: string, maps: {...}): string;
}
```

---

## Phase 3: Translation Engine

**Duration**: Week 5-6  
**Priority**: 🔴 Critical

### Tasks

#### 3.1 OpenRouter API Client
- [ ] HTTP client with retry logic (same behavior as Transrewrt `scripts/translate/translator.ts`)
- [ ] Authentication handling
- [ ] Rate limiting support
- [ ] Usage tracking (tokens, cost); record **which model** in the chain succeeded (for cache / logs)
- [ ] **`translationModels` chain**: ordered list; **try model[i], on failure try model[i+1]** until success or exhaustion (not `defaultModel` + one `fallbackModel`)

**API Integration:**
```typescript
class OpenRouterClient {
  /** Uses openrouter.translationModels[0..n] in order until a chat succeeds. */
  async chat(messages: Message[], options: ChatOptions): Promise<ChatResponse>;

  private async makeRequest(body: { model: string; ... }): Promise<Response>;
  private handleRateLimit(response: Response): Promise<void>;
  private extractUsage(data: any): UsageStats;
}
```

**Config shape (mirror Transrewrt `translate.config.json`):**
```json
"openrouter": {
  "baseUrl": "https://openrouter.ai/api/v1",
  "translationModels": ["model/a", "model/b", "model/c"],
  "maxTokens": 8192,
  "temperature": 0.2
}
```

**Environment:**
- `OPENROUTER_API_KEY` (required)
- `OPENROUTER_BASE_URL` (optional, default: `https://openrouter.ai/api/v1`)

#### 3.2 Batch Processor
- [ ] Accumulate segments into batches
- [ ] Respect `batchSize` and `maxBatchChars`
- [ ] Build batch prompts with XML tags
- [ ] Parse batch responses
- [ ] Fallback to single-segment on error

**Batch Strategy:**
```typescript
interface BatchConfig {
  batchSize: number;      // Default: 20
  maxBatchChars: number;  // Default: 5000
}

// Flush conditions:
// 1. Queue reaches batchSize
// 2. Total chars exceed maxBatchChars
// 3. End of file
```

**Prompt Format:**
```xml
<segments>
  <seg id="0">First segment text</seg>
  <seg id="1">Second segment text</seg>
</segments>
```

**Response Format:**
```xml
<t id="0">Translated first segment</t>
<t id="1">Translated second segment</t>
```

#### 3.3 Glossary System
- [ ] CSV parser (`glossary-ui.csv`, `glossary-user.csv`) where used (e.g. Duplistatus workflows), implementing the **three-column format** below (header row + `*` locale wildcard)
- [ ] **`strings.json` loader** — same shape as Transrewrt today: `{ [id]: { source, translated: { [locale]: string } } }`; use **translated UI strings** as terminology hints when translating docs
- [ ] Term matching in text
- [ ] Priority handling (user CSV > `strings.json` / UI CSV)
- [ ] Wildcard locale support (`*`) for user overrides
- [ ] Prompt integration for every doc translation request

**UI–documentation glossary bridge (required product behavior):**
1. `extract` + UI `translate` populate `strings.json` with per-locale values.
2. Doc `translate` loads that file (config key equivalent to Transrewrt `paths.ui-glossary`).
3. Glossary matcher finds overlapping terms in a segment and adds hints so the model reuses the same wording as the UI (e.g. “backup” → “Sicherung” in German everywhere).

**Glossary CSV format (user glossary and terminology files)**

Use a single logical layout for **`glossary-user.csv`** (and any other hand-edited glossary CSV the package treats the same way). The first row is the **header**; each following row is one rule.

| Column | Header (recommended) | Meaning |
|--------|----------------------|---------|
| 1 | `Original language string` | The term or phrase in the **source** language (the string as it appears in English copy, UI, or docs before translation). |
| 2 | `locale` | BCP-47–style locale code for the target (e.g. `pt-BR`, `de`), or **`*`** to apply the same translation to **all** target locales. |
| 3 | `Translation` | The string to use for that locale (or for all locales when column 2 is `*`). Can match column 1 to force **no translation** / keep the original everywhere. |

**Examples**

Keep the word *backup* untranslated in every language (product term):

```csv
"Original language string","locale","Translation"
"backup","*","backup"
```

Translate *backup* only for Brazilian Portuguese:

```csv
"Original language string","locale","Translation"
"backup","pt-BR","cópia de segurança"
```

More specific locale rows can coexist with a `*` row; define **precedence** in implementation (typically: exact locale match wins over `*` for that locale).

**Note:** Auto-generated **`glossary-ui.csv`** (e.g. from Intlayer or `glossary-generate`) may use a different on-disk layout until normalized; the package should either convert to this three-column model internally or document the generator’s format separately. **Hand-maintained overrides** should follow the table above.

**Matching Algorithm:**
```typescript
class GlossaryMatcher {
  findTermsInText(text: string, locale: string): string[];
  // Returns: ['- "backup" → "Sicherung"', ...]
}
```

#### 3.4 Prompt Builder
- [ ] System prompt templates
- [ ] Glossary hint injection
- [ ] Context-aware instructions
- [ ] Language-specific rules
- [ ] Output format enforcement

**System Prompt:**
```
You are a professional UI/UX translator specializing in software interfaces.

RULES:
- Translate UI labels, buttons, tooltips, menu items
- Preserve capitalization style
- Keep placeholders unchanged: {{variable}}, {0}, %s
- Keep HTML tags unchanged: <strong>, <br/>
- Use informal/familiar tone where natural
- Short strings (1-3 words) must stay short
- Respond with ONLY valid JSON array, nothing else
```

#### 3.5 Translation Validator
- [ ] Segment count verification
- [ ] Code block integrity check
- [ ] URL count preservation
- [ ] Heading level consistency
- [ ] Length ratio warnings
- [ ] Frontmatter structure validation

**Validation Rules:**
```typescript
interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

function validateTranslation(source: Segment[], translated: Segment[]): ValidationResult;
```

---

## Phase 4: CLI & Developer Tools

**Duration**: Week 7-8  
**Priority**: 🟡 High

### Tasks

#### 4.1 CLI Framework
- [ ] Commander.js setup
- [ ] Command registration
- [ ] Option parsing
- [ ] Help text generation
- [ ] Error handling

**Commands:**
```bash
ai-i18n-tools init                    # Create config file
ai-i18n-tools extract                 # Extract UI strings (t(...) / i18next-scanner)
ai-i18n-tools translate [options]     # Translate UI and/or docs per features
ai-i18n-tools sync                    # extract then translate (convenience)
ai-i18n-tools status                  # Show translation status (docs parity)
ai-i18n-tools cleanup [options]       # Clean orphaned cache
ai-i18n-tools edit                    # Launch web translation editor (segments + UI + glossary)
ai-i18n-tools glossary-generate       # Optional: build CSV from external sources if needed
```

**Translate sub-options (examples; align with consumer needs):**
```
--svg-only              SVG assets only
--json-only             Docusaurus JSON UI strings only
--type markdown|json|svg   Limit content kind
--no-svg                Skip SVG (Duplistatus parity)
--no-json               Skip JSON translation
```

**Global Options:**
```
-c, --config <path>     Config file path
-l, --locale <codes>    Target locales (comma-separated)
-p, --path <path>       Limit to file/directory
--dry-run               No writes, no API calls
--force                 Force re-translation
-v, --verbose           Verbose output
--no-cache              Bypass cache
```

#### 4.2 Init Command
- [ ] Interactive config generator
- [ ] Project type detection
- [ ] Template selection
- [ ] File scaffolding

**Workflow:**
1. Detect project structure
2. Ask questions (locales, features)
3. Generate **`ai-i18n-tools.config.json`**
4. Create `.translate-ignore` template
5. Install dependencies

#### 4.3 Extract Command
- [ ] Run appropriate extractors
- [ ] Write extracted strings
- [ ] Show summary statistics
- [ ] Support incremental extraction

**Output:**
```
[extract] Found 247 translatable strings
[extract] 198 new strings added
[extract] 49 strings updated
[extract] Written to: src/renderer/locales/strings.json
```

#### 4.4 Translate Command
- [ ] Orchestrate translation workflow
- [ ] Progress display
- [ ] Cost tracking
- [ ] Error recovery
- [ ] Summary report

**Progress Display:**
```
🌐 Processing: docs/intro.md
  Found 45 translatable segments
  ⏭️  Cached: 32 segments
  🔄 Translating: 13 segments
  
  Chunk 1/1 starting (model: anthropic/claude-3.5-haiku)
  Chunk 1/1 done
  
✓ Written to: i18n/de/docusaurus-plugin-content-docs/current/intro.md
💵 Cost: $0.00234 USD (1,234 tokens)
```

#### 4.5 Status Command
- [ ] Scan source and translated files
- [ ] Compare hashes
- [ ] Generate status table
- [ ] Show summary counts

**Status Symbols:**
- ✓ Up-to-date
- - Not translated
- ● Outdated (source changed)
- □ Orphaned (no source)
- i Ignored

**Output:**
```
Translation Status:
┌─────────────────────┬────┬────┬────┬──────┐
│ File                │ de │ fr │ es │ pt-BR│
├─────────────────────┼────┼────┼────┼──────┤
│ intro.md            │ ✓  │ ✓  │ ✓  │ ✓    │
│ installation.md     │ ✓  │ ●  │ -  │ ✓    │
│ api-reference.md    │ -  │ -  │ -  │ -    │
└─────────────────────┴────┴────┴────┴──────┘

Summary: 12 up-to-date, 3 outdated, 5 not translated
```

#### 4.6 Cleanup Command
- [ ] Remove orphaned cache entries
- [ ] Delete stale translations
- [ ] Clean orphaned output files
- [ ] Create backups
- [ ] Dry-run mode

**Phases:**
1. **Orphaned cache**: Remove rows where filepath doesn't exist
2. **Stale entries**: Delete rows with `last_hit_at IS NULL`
3. **Orphaned files**: Delete translated files without source

**Safety:**
- Always backup before deletion
- Require `--force` flag or confirmation prompt
- Show what will be deleted in dry-run

#### 4.7 Translation editor (Web UI)

Single local web app (command: **`ai-i18n-tools edit`**) that loads **`ai-i18n-tools.config.json`** (or `--config`) and exposes **three workspaces** in one UI. Duplistatus today implements only **workspace A** (SQLite segment cache); the package **extends** the static app and server with **B** and **C**.

| Workspace | Data | Purpose |
|-----------|------|--------|
| **A — Document segments** | SQLite `cache.db` (`translations` table) | Edit cached **source ↔ translated** fragments for markdown/JSON/SVG flows (parity with current `edit-cache-server.ts` + `edit-cache-app`). |
| **B — UI strings** | `strings.json` from config (e.g. `glossary.uiGlossaryFromStringsJson` or dedicated `paths.stringsJson` / `features.extractUIStrings` output path) | Edit **`source`** and per-locale **`translated[locale]`** for hashed UI entries without opening the JSON file manually. |
| **C — User glossary** | `glossary-user.csv` (`glossary.userGlossary`) | Add/edit/delete rows in the **three-column** format (`Original language string`, `locale`, `Translation`); validate `*` wildcard locales. |

**Behavior notes**

- **Config-driven**: If a path is missing or feature disabled, hide or disable the corresponding tab with a short explanation (e.g. no UI strings path configured).
- **Atomic writes**: Write JSON/CSV with temp file + rename (or equivalent) to avoid corrupting `strings.json` or glossary on crash.
- **Concurrency**: Document that running **`translate`** concurrently with the editor can race; recommend closing the editor or show a warning if cache/db was modified externally.
- **B vs locale files**: Consumers may also use per-locale flat JSON (`de.json`, …). If the package maintains both, document whether the editor updates **only** `strings.json` (extract source of truth) or syncs derived files — default recommendation: **edit `strings.json` only**; `translate` / `sync` regenerates flat files when applicable.

**Tasks**

- [ ] Express (or shared HTTP layer) + static `edit-cache-app` SPA
- [ ] **Workspace A** — port Duplistatus APIs: list/filter/patch/delete segments, locales, models, filepaths, log-links
- [ ] **Workspace B** — `GET`/`PATCH` (and optional `PUT` full document) for `strings.json`; table or key-navigated UI: id, source, columns per `targetLocales`
- [ ] **Workspace C** — `GET`/`POST`/`PATCH`/`DELETE` for glossary rows; server-side CSV parse/serialize preserving headers and quoting; optional “add row” / duplicate row
- [ ] Top nav or tabs: **Segments | UI strings | Glossary**; shared header with config path and “open in editor” file links where safe
- [ ] Filtering, sorting, pagination for A (existing) and B/C as needed
- [ ] Input validation (locale codes, non-empty source for glossary, JSON schema shape for B)

**API endpoints (illustrative)**

*Workspace A — document cache (existing parity):*
```
GET    /api/translations?locale=&filename=&page=
PATCH  /api/translations
DELETE /api/translations/:sourceHash/:locale
DELETE /api/translations/by-filters
DELETE /api/translations/by-filepath?filepath=
GET    /api/locales
GET    /api/models
GET    /api/filepaths
POST   /api/log-links
```

*Workspace B — UI `strings.json`:*
```
GET    /api/ui-strings                     # Full document or paged entries { entries: [{ id, source, translated }] }
PATCH  /api/ui-strings/:id                 # Body: { source?, translated?: Record<locale, string> }
PUT    /api/ui-strings                     # Optional: replace whole file (advanced; guard with confirm in UI)
GET    /api/ui-strings/meta                # targetLocales, file path resolved from config
```

*Workspace C — `glossary-user.csv`:*
```
GET    /api/glossary-user                  # Rows + headers; optional ?locale= filter
POST   /api/glossary-user                  # Body: { original, locale, translation } — append row
PATCH  /api/glossary-user/:rowIndex        # Or PATCH by composite key { original, locale }
DELETE /api/glossary-user/:rowIndex
GET    /api/glossary-user/meta             # Resolved path, column names
```

**UI features (all workspaces)**

- Table views with search/filter/sort; inline or panel editing
- Bulk delete where safe (A: by filters; C: multi-select rows)
- Delete single entries; confirm destructive actions
- For A: clickable links / `log-links` to source and translated outputs (existing behavior)
- Optional dark mode / accessible labels (stretch goal)

---

## Phase 5: Testing & Documentation

**Duration**: Week 9-10  
**Priority**: 🟡 High

### Tasks

#### 5.1 Unit Tests
- [ ] Test all extractors
- [ ] Test cache operations
- [ ] Test glossary matching
- [ ] Test placeholder protection
- [ ] Test validation logic
- [ ] Translation editor: `strings.json` read/write helpers; glossary CSV parse/serialize (three-column + `*`)

**Coverage Target**: 80%+

**Test Structure:**
```
tests/unit/
├── extractors/
│   ├── react-extractor.test.ts
│   ├── markdown-extractor.test.ts
│   ├── json-extractor.test.ts
│   └── svg-extractor.test.ts
├── core/
│   ├── cache.test.ts
│   ├── config.test.ts
│   └── translator.test.ts
├── glossary/
│   └── matcher.test.ts
└── processors/
    ├── batch-processor.test.ts
    └── validator.test.ts
```

#### 5.2 Integration Tests
- [ ] Full workflow with Transrewrt
- [ ] Full workflow with Duplistatus
- [ ] Multi-language translation
- [ ] Cache hit/miss scenarios
- [ ] Error handling and recovery
- [ ] Translation editor HTTP API: patch segment, patch UI string entry, CRUD glossary row; confirm files on disk

**Test Scenarios:**
1. Fresh translation (no cache)
2. Incremental translation (partial cache)
3. Force re-translation
4. Batch fallback on error
5. Glossary enforcement
6. Placeholder protection

#### 5.3 Performance Benchmarks
- [ ] Measure extraction speed
- [ ] Measure translation throughput
- [ ] Compare with legacy systems
- [ ] Optimize bottlenecks

**Metrics:**
- Strings extracted per second
- Segments translated per minute
- Cache hit rate
- Memory usage
- Bundle size impact

#### 5.4 User Documentation
- [ ] README.md (overview, quick start)
- [ ] CONFIGURATION.md (all options explained)
- [ ] API-REFERENCE.md (programmatic usage)
- [ ] ARCHITECTURE.md (design decisions)
- [ ] FAQ.md (common questions)

#### 5.5 Migration Guides
- [ ] MIGRATION-TRANSREWRT.md (detailed steps)
- [ ] MIGRATION-DUPLISTATUS.md (detailed steps)
- [ ] Troubleshooting section
- [ ] Before/after code examples

#### 5.6 Example Projects
- [ ] Minimal React app example
- [ ] Docusaurus site example
- [ ] Mixed content example
- [ ] Custom extractor example

---

## Phase 6: Publishing & Migration

**Duration**: Week 11-12  
**Priority**: 🟢 Medium

### Tasks

#### 6.1 Package Preparation
- [ ] Finalize package.json
- [ ] Add npm keywords
- [ ] Create npmignore
- [ ] Build distribution
- [ ] Test installation from tarball

**package.json highlights:**
```json
{
  "name": "ai-i18n-tools",
  "version": "1.0.0",
  "description": "Unified i18n tools for React apps and documentation",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "ai-i18n-tools": "dist/cli/index.js"
  },
  "files": [
    "dist/",
    "edit-cache-app/",
    "README.md",
    "LICENSE"
  ]
}
```

#### 6.2 npm Publishing
- [ ] Publish to npm (public package)
- [ ] Configure 2FA
- [ ] Publish initial version
- [ ] Verify installation
- [ ] Add npm badges to README

#### 6.3 Rollout order (mandatory)
1. **Finish package** in `ai-i18n-tools` repo; test with fixtures / local tarball.
2. **Transrewrt first** — replace `scripts/extract-strings.js`, `scripts/generate-translations.js`, and `scripts/translate/*` with the package; keep **`translate.config.json`** (docs) and **`ai-i18n-tools.config.json`** aligned; fold UI model lists from **`openrouter-script-models.js`** into package config where appropriate; verify UI extract, doc translate, cache, glossary from `strings.json`.
3. **Duplistatus second** — larger migration:
   - **A. UI**: Replace Intlayer (`.content.ts`, Intlayer hooks) with i18next + literal `t("…")` (Transrewrt-style), RTL and fast locale switch preserved via i18next.
   - **B. Docs**: Replace `documentation/scripts/translate/*` with package CLI; keep Docusaurus layout, JSON, SVG, cache editor. **Doc translation npm scripts live in `documentation/package.json`** — today you run `pnpm translate`, `pnpm translate:status`, etc. **from the `documentation/` directory** (or `pnpm --dir documentation …`); integration docs should preserve that or document the new entrypoints clearly.
4. Local end-to-end validation on both apps.
5. **Publish `ai-i18n-tools` to npm.**
6. **Release** new Transrewrt and Duplistatus versions that depend on the published package.

#### 6.4 Transrewrt integration (after package MVP)
- [ ] Add dependency on `ai-i18n-tools`
- [ ] Map config (`ai-i18n-tools.config.json` or merged `translate.config` + UI config); consolidate UI **`TRANSLATION_MODELS`** from `openrouter-script-models.js` into the package config when ready
- [ ] Remove inlined scripts under `scripts/translate/` and legacy UI translate scripts once parity proven (including `pnpm translate:docs` / `translate:cleanup` wiring to the new CLI)
- [ ] Update internal docs (`dev/DEVELOPMENT.md`, etc.)

**Estimated effort**: small (hours) once package matches current behavior

#### 6.5 Duplistatus integration (most complex)
- [ ] Migrate Next.js / app UI from Intlayer to i18next + `t()`
- [ ] Wire `ai-i18n-tools extract` / `translate` for UI strings
- [ ] Replace doc translation scripts under **`documentation/`**; map **`documentation/translate.config.json`** → package config; preserve or replace **`documentation/package.json`** translate scripts
- [ ] Verify markdown, Docusaurus JSON, SVG, status, cleanup, edit
- [ ] Update CI/CD and contributor docs (including `TRANSLATION-HELP.md` / `translate:help` if command paths change)

**Estimated effort**: days (UI rewrite + doc parity)

#### 6.6 Feedback & Iteration
- [ ] Monitor GitHub issues
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Release patch versions
- [ ] Plan v1.1 features

---

## Technical Specifications

### Dependencies

**Production:**
```json
{
  "dependencies": {
    "better-sqlite3": "^9.0.0",
    "commander": "^11.0.0",
    "gray-matter": "^4.0.3",
    "i18next-scanner": "^4.4.0",
    "ignore": "^5.2.4",
    "csv-parse": "^5.5.0",
    "zod": "^3.22.0",
    "express": "^4.18.0"
  }
}
```

**Development:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/express": "^4.17.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### RTL and runtime UI (consumer responsibility)

The package produces locale JSON and supports extraction/translation for **RTL locales** (e.g. `ar`, `he`). **Layout direction and instant language switching** are handled by the app’s **i18next / react-i18next** setup (as in Transrewrt: `dir` per locale, dynamic resource loading). Document this in consumer migration guides so Duplistatus adopters configure i18next accordingly when replacing Intlayer.

### Build Configuration

**TypeScript:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests", "dist"]
}
```

### Database Schema

**Complete SQL:**
```sql
-- Segment-level cache
CREATE TABLE IF NOT EXISTS translations (
  source_hash TEXT NOT NULL,
  locale TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  model TEXT,
  filepath TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_hit_at DATETIME,
  start_line INTEGER,
  PRIMARY KEY (source_hash, locale)
);

-- File-level tracking
CREATE TABLE IF NOT EXISTS file_tracking (
  filepath TEXT NOT NULL,
  locale TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  last_translated DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (filepath, locale)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_last_hit ON translations(last_hit_at);
CREATE INDEX IF NOT EXISTS idx_filepath ON translations(filepath);
CREATE INDEX IF NOT EXISTS idx_locale ON translations(locale);
```

### API Rate Limits

**OpenRouter Considerations:**
- Default: 10 requests/second
- Implement exponential backoff
- Track usage per session
- Warn when approaching limits

**Implementation:**
```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      await fn();
      await this.delay(100); // 10 req/s = 100ms between requests
    }
    
    this.processing = false;
  }
}
```

---

## Success Metrics

### Quantitative Goals

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code reduction | 95%+ | Lines of custom code removed |
| Translation speed | 30% faster | Time to translate same content |
| Cache hit rate | 70%+ | Percentage of segments from cache |
| Test coverage | 80%+ | Jest coverage report |
| Bundle size increase | <20% | For consuming applications |
| Translation quality | No regression | Manual review + validation |

### Qualitative Goals

- ✅ Both projects successfully migrated
- ✅ Developer experience improved (easier config)
- ✅ Documentation clear and comprehensive
- ✅ Error messages helpful and actionable
- ✅ Community adoption (external users)
- ✅ Positive feedback from maintainers

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes during migration | High | Parallel run period, rollback plan |
| Performance regression | Medium | Benchmarking, profiling |
| Translation quality drop | High | Validation, manual review samples |
| Cache corruption | Medium | Backups, integrity checks |
| API rate limiting | Low | Queue system, backoff strategy |

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Core | Week 1-2 | Types, config, cache, logging |
| Phase 2: Extractors | Week 3-4 | All 4 extractors working |
| Phase 3: Engine | Week 5-6 | Translation pipeline complete |
| Phase 4: CLI | Week 7-8 | All commands functional |
| Phase 5: Testing | Week 9-10 | Tests, docs, examples |
| Phase 6: Release | Week 11-12 | npm publish; Transrewrt then Duplistatus migrations |

**Total**: ~12 weeks (3 months) — **apply consumers only after package MVP is validated** (Transrewrt → Duplistatus → publish → version bumps).

---

## Next Steps

1. **Immediate**: Review this plan with stakeholders
2. **Week 0**: Set up repository and CI/CD
3. **Week 1**: Begin Phase 1 implementation
4. **Weekly**: Progress reviews and adjustments
5. **End of each phase**: Demo and feedback session

---

## Appendix: Comparison Table

For the full matrix (CLI paths, validation, cleanup commands, model config nuance), see **[COMPARISON.md](./COMPARISON.md)**.

| Feature | Transrewrt (before package) | Duplistatus (before package) | Unified Package |
|---------|----------------------------|------------------------------|-----------------|
| UI strings | ✅ `extract-strings.js` + `generate-translations.js` + i18next | ✅ Intlayer (`.content.ts`) — **to be replaced** by `t()` + package | ✅ React / i18next-scanner extractor + OpenRouter |
| Doc translation | ✅ `scripts/translate/*.ts` (~5.5k lines, order of magnitude; `translate.config.json`) | ✅ `documentation/scripts/translate/*.ts` + cache UI; CLI from **`documentation/`** | ✅ One engine; Transrewrt base + Duplistatus modules |
| UI↔doc terminology | ✅ `strings.json` as doc glossary (`paths.ui-glossary`) | ⚠️ CSV from Intlayer + `glossary-ui.csv` / user CSV | ✅ **`strings.json` glossary bridge** + user CSV |
| Caching | ✅ SQLite (**docs**); UI path no segment DB today | ✅ SQLite | ✅ Shared schema when unified |
| SVG / Docusaurus JSON | ❌ doc tool markdown-only | ✅ | ✅ Extractors from Duplistatus |
| RTL / fast locale change | ✅ i18next | ⚠️ Via Intlayer | ✅ **i18next path** for Duplistatus after UI migration |
| Cache editor | ❌ | ✅ (segments only) | ✅ **Unified editor**: segments + `strings.json` + `glossary-user.csv` |
| Status / cleanup CLI | ❌ status; ✅ `translate:cleanup` | ✅ `translate:status`, `translate:cleanup` (under `documentation/`) | ✅ `status`, `cleanup` |

**Net result**: Consolidate **~12k+ lines** of duplicated and app-specific tooling into one maintained package plus thin per-app config and scripts — exact integration line count depends on final API.
