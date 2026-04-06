# Migration Guide: Transrewrt → ai-i18n-tools

This guide walks you through migrating Transrewrt's custom i18n system to the unified `ai-i18n-tools` package.

**Estimated Time**: A few hours once `ai-i18n-tools` is feature-complete (UI + docs parity with current scripts)  
**Difficulty**: Easy–medium  
**Risk Level**: Low (parallel run supported)

**Rollout**: Integrate **Transrewrt after** the package MVP is ready in the `ai-i18n-tools` repo and **before** Duplistatus (simpler consumer). Publish to npm only after both apps are validated locally against a tarball or `file:` dependency.

---

## Table of Contents

1. [Overview](#overview)
2. [Before You Start](#before-you-start)
3. [Migration Steps](#migration-steps)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Cleanup](#cleanup)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Plan](#rollback-plan)

---

## Overview

### What Changes

Transrewrt today has **two** translation stacks; both move to the package:

| Aspect | Before | After |
|--------|--------|-------|
| **UI pipeline** | `scripts/extract-strings.js`, `scripts/generate-translations.js`, `openrouter-script-models.js` (~750 lines JS) | `ai-i18n-tools extract` / `translate` (UI) |
| **Document pipeline** | `scripts/translate/*.ts` (~4,800 lines TS), `translate.config.json`, `pnpm translate:docs` | Same behavior via package CLI + merged config |
| **Config** | Split between scripts + `translate.config.json` | **`ai-i18n-tools.config.json`** with root + **`ui`** + **`documentation`** (or split files merged by the package) |
| **UI↔doc terminology** | `translate.config.json` → `paths.ui-glossary` → `src/renderer/locales/strings.json` | Same idea: **translated UI strings feed doc glossary hints** |
| **Caching** | SQLite for docs; UI batch re-translate | SQLite for docs; optional cache story for UI per package design |
| **Dependencies** | `i18next-scanner` + local TS toolchain | `ai-i18n-tools` |

### Benefits

- **One dependency** for UI extraction, UI translation, and markdown/README-style docs  
- **Keeps** the configurable doc translator you already evolved in `scripts/translate/`  
- **Keeps** glossary alignment between UI and docs via `strings.json`  
- **RTL and fast locale switching** stay in **i18next** runtime (unchanged pattern)  

### What Stays the Same

- Translation keys (MD5 hashes) for UI strings  
- Output format (`strings.json`, `pt-BR.json`, `de.json`, etc.)  
- Literal `t("…")` / `i18n.t("…")` in components  
- i18next language switching and RTL configuration  
- Document output layout under `translated-docs/` (or as configured)  

---

## Before You Start

### Prerequisites

1. **Node.js**: v18+ (already satisfied)
2. **pnpm**: Latest version
3. **OpenRouter API Key**: Set in environment
   ```bash
   export OPENROUTER_API_KEY=sk-or-v1-your-key
   ```
4. **Git**: Clean working tree (commit or stash changes)

### Backup Current System

```bash
# Create backup of current scripts
cd /home/wsj/src/transrewrt
mkdir -p backup/i18n-old
cp scripts/extract-strings.js backup/i18n-old/
cp scripts/generate-translations.js backup/i18n-old/
cp scripts/openrouter-script-models.js backup/i18n-old/
cp -r scripts/translate backup/i18n-old/translate-ts
cp translate.config.json backup/i18n-old/ 2>/dev/null || true

# Backup current translations
cp -r src/renderer/locales backup/i18n-old/locales-backup
cp -r translated-docs backup/i18n-old/translated-docs-backup 2>/dev/null || true

echo "Backup created in backup/i18n-old/"
```

### Review Current Workflow

Current commands:
```bash
pnpm run i18n:extract      # Extract t("...") strings
pnpm run i18n:translate    # Translate UI via OpenRouter
pnpm run i18n:sync         # Both steps together
pnpm run translate:docs    # Translate markdown docs (tsx scripts/translate/index.ts)
```

These map to the package (exact flags depend on final CLI):
```bash
npx ai-i18n-tools extract
npx ai-i18n-tools translate              # UI and/or docs per config features
npx ai-i18n-tools sync                   # extract then translate
# Doc-only or combined workflows use the same binary with config / flags
```

---

## Migration Steps

### Step 1: Install Package

```bash
cd /home/wsj/src/transrewrt
pnpm add ai-i18n-tools
```

This adds the package to `package.json`:
```json
{
  "dependencies": {
    "ai-i18n-tools": "^1.0.0"
  }
}
```

### Step 2: Create Configuration File

Create `ai-i18n-tools.config.json` in project root:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/renderer/locales/ui-languages.json",
  "batchSize": 50,
  "maxBatchChars": 10000,
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
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "src/renderer/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/renderer/"],
    "stringsJson": "src/renderer/locales/strings.json",
    "flatOutputDir": "src/renderer/locales/",
    "reactExtractor": {
      "extensions": [".js", ".jsx", ".ts", ".tsx"],
      "includePackageDescription": true
    }
  },
  "documentation": {
    "contentPaths": ["README.md", "USER-GUIDE.md"],
    "outputDir": "translated-docs",
    "cacheDir": "translated-docs/.cache",
    "markdownOutput": {
      "style": "flat",
      "rewriteRelativeLinksForFlat": true,
      "linkRewriteDocsRoot": "."
    }
  }
}
```

**Key points:**
- Matches today’s **terminology bridge**: doc translation uses **`strings.json`** (same as `translate.config.json` `paths.ui-glossary`).
- Enable **`translateMarkdown`** so README / USER-GUIDE (and paths from your existing `translate.config.json`) stay in scope; merge any doc-specific keys from `translate.config.json` into this file or a second config the package loads.
- **`translationModels`** matches `translate.config.json`: ordered list; client **falls through** on failure (same as current `scripts/translate/translator.ts`). Optional: keep `openrouter-script-models.js` only until config is merged, then remove.

### Step 2b: Merge `translate.config.json` into package config

Doc translation today is driven by **`translate.config.json`** (paths, locales, cache, batching, glossary, markdown options). When adopting **`ai-i18n-tools.config.json`**, walk that file and copy across:

- **`paths.source-files` / doc roots** → **`documentation.contentPaths`** (optional **`documentation.sourceFiles`** alias is merged into `contentPaths` at load)
- **`paths.output` / `translated-docs`** → **`documentation.outputDir`** (use **`documentation.markdownOutput`** for flat vs nested layout and link rewriting)
- **`paths.ui-glossary`** → **`glossary.uiGlossaryFromStringsJson`** (must point at the same `strings.json` the UI pipeline uses)
- **`openrouter.translationModels`** (or legacy keys remapped to **`translationModels[]`**) — **do not** downgrade to Duplistatus-style `defaultModel` + single `fallbackModel`
- **Locale lists**, **cache path**, **batch** sizes, **ignore** files, **debug** flags

Until you fully retire `translate.config.json`, it is fine to keep a thin copy and align it by hand with **`ai-i18n-tools.config.json`**; the important part is **one OpenRouter client** implementing the **ordered model chain** from Transrewrt.

### Step 3: Update package.json Scripts

Replace old i18n scripts with new ones:

**Before:**
```json
{
  "scripts": {
    "i18n:extract": "node scripts/extract-strings.js",
    "i18n:translate": "node scripts/generate-translations.js",
    "i18n:sync": "pnpm run i18n:extract && pnpm run i18n:translate"
  }
}
```

**After:**
```json
{
  "scripts": {
    "i18n:extract": "ai-i18n-tools extract",
    "i18n:translate": "ai-i18n-tools translate",
    "i18n:sync": "ai-i18n-tools sync",
    "translate:docs": "ai-i18n-tools translate",
    "i18n:status": "ai-i18n-tools status",
    "i18n:cleanup": "ai-i18n-tools cleanup",
    "i18n:edit": "ai-i18n-tools edit"
  }
}
```

Adjust `translate:docs` if your current script runs `node-rebuild` first; keep that wrapper if still required.

### Step 4: Create Integration Script (Optional but Recommended)

For maximum compatibility during transition, create a wrapper script:

**File**: `scripts/i18n-migrate.js`

```javascript
/**
 * Transitional script - uses ai-i18n-tools
 * Can run in parallel with old system for testing
 */

const { Translator } = require('ai-i18n-tools');
const path = require('path');

async function extract() {
  console.log('🔍 Extracting translatable strings...');
  
  const translator = new Translator(path.join(__dirname, '..', 'ai-i18n-tools.config.json'));
  
  try {
    await translator.extract();
    console.log('✅ Extraction complete');
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    process.exit(1);
  }
}

async function translate(options = {}) {
  console.log('🌐 Translating strings...');
  
  const translator = new Translator(path.join(__dirname, '..', 'ai-i18n-tools.config.json'));
  
  try {
    await translator.translate({
      locale: options.locale,
      force: options.force,
      dryRun: options.dryRun
    });
    console.log('✅ Translation complete');
  } catch (error) {
    console.error('❌ Translation failed:', error.message);
    process.exit(1);
  }
}

async function sync(options = {}) {
  await extract();
  await translate(options);
}

// CLI interface
const command = process.argv[2];
const options = {
  locale: process.argv.includes('--locale') ? process.argv[process.argv.indexOf('--locale') + 1] : null,
  force: process.argv.includes('--force'),
  dryRun: process.argv.includes('--dry-run')
};

switch (command) {
  case 'extract':
    extract();
    break;
  case 'translate':
    translate(options);
    break;
  case 'sync':
    sync(options);
    break;
  default:
    console.log('Usage: node scripts/i18n-migrate.js [extract|translate|sync] [--force] [--dry-run] [--locale pt-BR]');
    process.exit(1);
}
```

Update scripts temporarily:
```json
{
  "scripts": {
    "i18n:extract": "node scripts/i18n-migrate.js extract",
    "i18n:translate": "node scripts/i18n-migrate.js translate",
    "i18n:sync": "node scripts/i18n-migrate.js sync"
  }
}
```

### Step 5: Test Extraction

Run extraction and compare output:

```bash
# Run new extraction
pnpm run i18n:extract

# Check output
cat src/renderer/locales/strings.json | head -50
```

**Expected output format:**
```json
{
  "15635515": {
    "source": "Check Spelling & Grammar",
    "translated": {
      "pt-BR": "Verificar ortografia e gramática",
      "de": "Rechtschreibung & Grammatik prüfen"
    }
  }
}
```

This should match the old format exactly.

**Verify:**
- ✅ All `t("...")` calls found
- ✅ MD5 hash keys preserved
- ✅ Existing translations maintained
- ✅ package.json description included
- ✅ ui-languages.json englishNames included

### Step 6: Test Translation (Dry Run)

Test without making API calls:

```bash
pnpm run i18n:translate -- --dry-run
```

This shows what would be translated without actually calling the API.

**Expected output:**
```
🌐 Translating strings...
Processing target locales: pt-BR, de, fr, es

--- pt-BR - Portuguese (BR) ---
  Strings needing translation: 23
  - "Loading models..."
  - "Summary"
  - "Failed to delete data"
  ...

--- de - German ---
  Strings needing translation: 23
  ...

Dry run complete. No files modified.
```

### Step 7: Test Translation (Live)

Run actual translation with a single locale first:

```bash
# Test with one locale
pnpm run i18n:translate -- --locale pt-BR

# Check results
cat src/renderer/locales/pt-BR.json | head -30
```

**Verify:**
- ✅ Translations generated correctly
- ✅ Placeholders preserved (`{{model}}`, etc.)
- ✅ Capitalization maintained
- ✅ Output format matches old system

### Step 8: Full Translation

Translate all locales:

```bash
pnpm run i18n:translate
```

Monitor output for:
- Progress per locale
- Cache hits vs new translations
- Cost tracking
- Any errors or warnings

**Sample output:**
```
🌐 Translating strings...
Processing: pt-BR - Portuguese (BR)
  Found 145 strings to translate
  ⏭️  Cached: 122 segments
  🔄 Translating: 23 segments
  
  Chunk 1/1 starting (model: qwen/qwen3-235b-a22b-2507)
  Chunk 1/1 done
  
✓ Written to: src/renderer/locales/pt-BR.json
💵 Cost: $0.00123 USD (856 tokens)

--- totalizer ---
  time elapsed: 00:02:34
  total strings translated: 92
  total tokens: 4523
  total cost: $0.00456 USD
```

### Step 9: Verify Application

Start the app and test language switching:

```bash
pnpm dev
```

**Test checklist:**
- [ ] App starts without errors
- [ ] Default language (en-GB) displays correctly
- [ ] Switch to Portuguese - all text translated
- [ ] Switch to German - all text translated
- [ ] No missing keys (no raw hash values shown)
- [ ] Placeholders work (`{{name}}` replaced correctly)
- [ ] RTL languages still work (if applicable)

### Step 10: Compare Outputs

Compare new translations with old backup:

```bash
# Compare a specific locale
diff -u backup/i18n-old/locales-backup/pt-BR.json src/renderer/locales/pt-BR.json

# Or use a visual diff tool
code --diff backup/i18n-old/locales-backup/pt-BR.json src/renderer/locales/pt-BR.json
```

**Acceptable differences:**
- Improved translations (AI model may differ slightly)
- Better glossary term usage
- More consistent capitalization

**Unacceptable differences:**
- Missing translations
- Broken placeholders
- Incorrect encoding (accented characters)

---

## Configuration

### Complete Configuration Reference

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/renderer/locales/ui-languages.json",
  "batchSize": 50,
  "maxBatchChars": 10000,
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
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "src/renderer/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/renderer/"],
    "stringsJson": "src/renderer/locales/strings.json",
    "flatOutputDir": "src/renderer/locales/",
    "reactExtractor": {
      "extensions": [".js", ".jsx", ".ts", ".tsx"],
      "includePackageDescription": true
    }
  },
  "documentation": {
    "contentPaths": ["README.md", "USER-GUIDE.md"],
    "outputDir": "translated-docs",
    "cacheDir": "translated-docs/.cache",
    "markdownOutput": { "style": "flat", "linkRewriteDocsRoot": "." }
  }
}
```

Doc-specific paths (`README.md`, `USER-GUIDE.md`, `translated-docs/`, `language-list-block`, `additional-adjustments`, etc.) should mirror your existing `translate.config.json` — either merged into this file or loaded as a second config document until the package supports a single schema for both.

### Environment Variables

```bash
# Required
export OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional (override config file)
export I18N_DEFAULT_MODEL=anthropic/claude-3.5-haiku
export I18N_CACHE_ENABLED=true
export I18N_BATCH_SIZE=20
```

### Glossary Setup (Optional)

If you want consistent terminology, create `glossary-user.csv` with **three columns**: **`Original language string`**, **`locale`**, **`Translation`**. Use **`*`** in `locale` to apply one row to every target language.

Examples:

```csv
"Original language string","locale","Translation"
"backup","*","backup"
"backup","pt-BR","cópia de segurança"
"API Key","pt-BR","Chave de API"
"API Key","de","API-Schlüssel"
"server","pt-BR","servidor"
"server","de","Server"
```

Full rules (wildcard vs per-locale precedence, machine-generated CSVs) are in [I18N_TOOLS_IMPLEMENTATION_PLAN.md §3.3](./I18N_TOOLS_IMPLEMENTATION_PLAN.md#33-glossary-system).

Add to config:
```json
{
  "glossary": {
    "userGlossary": "glossary-user.csv"
  }
}
```

---

## Testing

### Automated Tests

Create a test script to verify everything works:

**File**: `scripts/test-i18n-migration.sh`

```bash
#!/bin/bash
set -e

echo "🧪 Testing i18n migration..."

# Test 1: Extraction
echo "Test 1: Extracting strings..."
pnpm run i18n:extract > /tmp/extract-output.txt
if grep -q "strings →" /tmp/extract-output.txt; then
  echo "✅ Extraction successful"
else
  echo "❌ Extraction failed"
  cat /tmp/extract-output.txt
  exit 1
fi

# Test 2: Dry run translation
echo "Test 2: Dry run translation..."
pnpm run i18n:translate -- --dry-run > /tmp/translate-dryrun.txt
if grep -q "Dry run complete" /tmp/translate-dryrun.txt || grep -q "no strings to translate" /tmp/translate-dryrun.txt; then
  echo "✅ Dry run successful"
else
  echo "❌ Dry run failed"
  cat /tmp/translate-dryrun.txt
  exit 1
fi

# Test 3: Check output files exist
echo "Test 3: Checking output files..."
for locale in pt-BR de fr es; do
  if [ -f "src/renderer/locales/${locale}.json" ]; then
    echo "✅ ${locale}.json exists"
  else
    echo "❌ ${locale}.json missing"
    exit 1
  fi
done

# Test 4: Validate JSON format
echo "Test 4: Validating JSON format..."
for locale in pt-BR de fr es; do
  if jq empty "src/renderer/locales/${locale}.json" 2>/dev/null; then
    echo "✅ ${locale}.json is valid JSON"
  else
    echo "❌ ${locale}.json is invalid JSON"
    exit 1
  fi
done

# Test 5: Check for placeholder preservation
echo "Test 5: Checking placeholder preservation..."
if grep -q "{{" src/renderer/locales/pt-BR.json; then
  echo "✅ Placeholders preserved"
else
  echo "⚠️  No placeholders found (may be OK if none in source)"
fi

echo ""
echo "🎉 All tests passed! Migration successful."
```

Make executable and run:
```bash
chmod +x scripts/test-i18n-migration.sh
./scripts/test-i18n-migration.sh
```

### Manual Testing Checklist

- [ ] **Extraction**: All `t("...")` calls found
- [ ] **Translation**: All locales generated
- [ ] **Format**: JSON structure matches old system
- [ ] **Keys**: MD5 hashes preserved
- [ ] **Placeholders**: `{{variable}}` syntax intact
- [ ] **Encoding**: Accented characters correct (é, ñ, ü, etc.)
- [ ] **App startup**: No console errors
- [ ] **Language switch**: All languages load correctly
- [ ] **Missing keys**: No hash values displayed in UI
- [ ] **Performance**: App not slower than before

---

## Cleanup

Once migration is verified and stable:

### Remove Old Scripts

```bash
# Archive old scripts (don't delete immediately)
mkdir -p archive/old-i18n-scripts
mv scripts/extract-strings.js archive/old-i18n-scripts/
mv scripts/generate-translations.js archive/old-i18n-scripts/
mv scripts/openrouter-script-models.js archive/old-i18n-scripts/

# Keep for 2 weeks, then delete
echo "Old scripts archived. Delete after 2 weeks if no issues."
```

### Remove Backup

```bash
# After 1 month of stable operation
rm -rf backup/i18n-old/
```

### Update Documentation

Update `dev/i18n.md` to reference new package:

**Add section:**
```markdown
## Using ai-i18n-tools

The project now uses the unified `ai-i18n-tools` package for translation management.

### Quick Commands

```bash
pnpm run i18n:extract     # Extract translatable strings
pnpm run i18n:translate   # Translate to all locales
pnpm run i18n:sync        # Both steps together
pnpm run i18n:status      # Check translation status
pnpm run i18n:cleanup     # Clean orphaned cache entries
```

### Configuration

See **`ai-i18n-tools.config.json`** for all settings.

### Cache Management

Translations are cached in `.translation-cache/cache.db` for faster subsequent runs.

To clear cache:
```bash
pnpm run i18n:cleanup -- --clear-cache
```

### Web-Based Translation Editor

`ai-i18n-tools edit` opens a local web UI (default port from `--port`, e.g. `8787`) with **document cache segments** once you adopt the package; it also adds **UI `strings.json`** and **`glossary-user.csv`** tabs when those paths are set in config. See [I18N_TOOLS_IMPLEMENTATION_PLAN.md §4.7](./I18N_TOOLS_IMPLEMENTATION_PLAN.md#47-translation-editor-web-ui). The legacy alias **`edit-cache`** still works.

```bash
pnpm run i18n:edit
```

### Update CI/CD

If you have CI/CD pipelines that run translation, update them:

**Before:**
```yaml
- name: Extract and translate
  run: |
    export OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}
    pnpm run i18n:sync
```

**After:** (same, but now using package)
```yaml
- name: Extract and translate
  run: |
    export OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}
    pnpm run i18n:sync
```

No changes needed if using npm scripts!

---

## Troubleshooting

### Common Issues

#### Issue 1: "Module not found: ai-i18n-tools"

**Solution:**
```bash
pnpm install
pnpm rebuild
```

#### Issue 2: "OPENROUTER_API_KEY not set"

**Solution:**
```bash
# Check if set
echo $OPENROUTER_API_KEY

# Set it
export OPENROUTER_API_KEY=sk-or-v1-your-key

# Or add to .env file
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" >> .env
```

#### Issue 3: "No strings extracted"

**Possible causes:**
- Wrong **`ui.sourceRoots`** in config (UI scan); doc roots are **`documentation.contentPaths`**
- `t()` calls not matching expected pattern
- Files not in scanned extensions

**Solution:**
```bash
# Enable verbose mode
pnpm run i18n:extract -- --verbose

# Check which files are scanned
ls -la src/renderer/**/*.js src/renderer/**/*.jsx
```

#### Issue 4: "Translation failed: API error 429"

**Cause**: Rate limit exceeded

**Solution:**
```json
{
  "batch": {
    "batchSize": 20,  // Reduce from 50
    "maxBatchChars": 5000  // Reduce from 10000
  }
}
```

#### Issue 5: "Cache database locked"

**Cause**: Multiple processes accessing cache

**Solution:**
```bash
# Close any running ai-i18n-tools processes
# Delete lock file
rm -f .translation-cache/cache.db-wal
rm -f .translation-cache/cache.db-shm
```

#### Issue 6: Translations look wrong

**Solution:**
```bash
# Use cache editor to fix
pnpm run i18n:edit

# Or force re-translation with different model
pnpm run i18n:translate -- --force --model anthropic/claude-3.5-haiku
```

#### Issue 7: Missing translations in UI

**Check:**
```bash
# Verify locale file exists
ls -la src/renderer/locales/pt-BR.json

# Check if key exists in file
grep "Your String Here" src/renderer/locales/pt-BR.json

# Check browser console for errors
# Look for "[i18n] locale not found" warnings
```

### Getting Help

1. **Check logs**: `.translation-cache/translate_*.log`
2. **Debug traffic**: Set `"debug": { "traffic": true }` in config
3. **GitHub Issues**: https://github.com/wsj-br/ai-i18n-tools/issues
4. **Discord**: [Link to community]

---

## Rollback Plan

If something goes wrong, you can easily rollback:

### Immediate Rollback (< 5 minutes)

```bash
# 1. Restore old scripts
cp backup/i18n-old/extract-strings.js scripts/
cp backup/i18n-old/generate-translations.js scripts/
cp backup/i18n-old/openrouter-script-models.js scripts/

# 2. Restore old package.json scripts
git checkout package.json

# 3. Restore old translations (if needed)
cp -r backup/i18n-old/locales-backup/* src/renderer/locales/

# 4. Reinstall dependencies
pnpm install

# 5. Test
pnpm run i18n:sync
```

### Partial Rollback

Keep new package but revert specific changes:

```bash
# Use old extraction, new translation
pnpm run i18n:extract  # Old script
node scripts/i18n-migrate.js translate  # New translator
```

### Emergency Contacts

- **Project Maintainer**: [Your contact]
- **Package Support**: GitHub Issues
- **Community**: Discord channel

---

## Post-Migration Checklist

After 1 week of stable operation:

- [ ] No translation-related bugs reported
- [ ] All team members comfortable with new workflow
- [ ] Documentation updated
- [ ] Old scripts archived
- [ ] Performance metrics collected
- [ ] Cost savings calculated (from caching)

After 1 month:

- [ ] Delete archived old scripts
- [ ] Remove backup directory
- [ ] Write blog post about migration (optional)
- [ ] Share learnings with community

---

## Summary

You've successfully migrated Transrewrt to `ai-i18n-tools`!

**What you gained:**
- ✅ 95% less custom code
- ✅ Faster translations (caching)
- ✅ Better quality (glossary, validation)
- ✅ Easier maintenance
- ✅ Future-proof architecture

**Next steps:**
1. Monitor for issues
2. Collect feedback from team
3. Consider enabling glossary for consistency
4. Explore advanced features (cache editor, status checks)

**Questions?** See [FAQ](#) or open a GitHub issue.

---

*Last updated: 2026-04-05*
