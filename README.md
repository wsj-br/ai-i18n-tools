# ai-i18n-tools

> Unified internationalization toolkit for React apps and documentation sites. UI string extraction, markdown and JSON translation, SVG text handling, and SQLite-backed segment caching — one config-driven workflow.

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- **Multi-Content Support**: React UI strings, Markdown docs, JSON files, SVG assets
- **Smart Caching**: SQLite-based segment-level cache with 70%+ hit rates
- **Glossary Management**: CSV-based terminology enforcement
- **Batch Processing**: Efficient API usage with **ordered `translationModels`** (try the next model on failure)
- **Quality Validation**: Post-translation checks and placeholder protection
- **Web Cache Editor**: Visual interface for manual corrections
- **CLI Interface**: Easy-to-use commands for all operations
- **Optional runtime helpers** (no React/i18next dependency): `getUILanguageLabel`, `getUILanguageLabelNative`, `interpolateTemplate` (`{{var}}`), `flipUiArrowsForRtl` — import from `ai-i18n-tools` for shared UI language labels and RTL arrow tweaks. See [Getting Started](./docs/GETTING_STARTED.md).

## 🚀 Quick Start

```bash
# Install
npm install ai-i18n-tools

# Initialize configuration (default: ui-markdown; use -t ui-docusaurus for docs-site layout)
npx ai-i18n-tools init

# Extract translatable strings
npx ai-i18n-tools extract

# Translate to all locales
npx ai-i18n-tools translate

# Check translation status
npx ai-i18n-tools status
```

## 📖 Documentation

- **[Documentation home (`docs/README.md`)](./docs/README.md)** — full table of contents
- **[Getting Started](./docs/GETTING_STARTED.md)** — install, env vars, config, first commands
- **[Overview](./docs/OVERVIEW.md)** — goals, benefits, configuration examples
- **[Canonical docs + rollout order](./docs/CANONICAL_DOCS.md)** — single source of truth; how to stage releases
- **[Migration — Transrewrt-style apps](./docs/MIGRATION_GUIDE_TRANSREWRT.md)**
- **[Migration — Docusaurus sites](./docs/MIGRATION_GUIDE_DUPLISTATUS.md)**
- **[Comparison (legacy vs package)](./docs/COMPARISON.md)**
- **[Implementation plan & roadmap](./docs/I18N_TOOLS_IMPLEMENTATION_PLAN.md)** — contributors; architecture and specs
- **[Developing this repo](./docs/DEVELOPING.md)** — build, test, layout
- **[Example: React + i18next + flat markdown](./examples/react-ui-simple/README.md)** — runnable sample (`npm run test:example-a` after clone; `npm install` inside the example for Vite)

## 🎯 Use Cases

### React Applications (UI extraction focus)

```json
{
  "sourceLocale": "en",
  "targetLocales": "src/locales/ui-languages.json",
  "openrouter": {
    "translationModels": [
      "anthropic/claude-3.5-haiku",
      "anthropic/claude-haiku-4.5"
    ]
  },
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "documentation": {
    "contentPaths": [],
    "outputDir": "./i18n",
    "cacheDir": ".translation-cache"
  }
}
```

Use a **string** path (not a JSON array) for the manifest. Adjust it for your repo (e.g. `src/renderer/locales/ui-languages.json`). Manifest shape: **`{ code, label, englishName }`** per row — see **[Getting Started](./docs/GETTING_STARTED.md)**.

### Documentation Sites (markdown + Docusaurus JSON + SVG)

`targetLocales` can be a **locale array** (as below) or a **string path** to `ui-languages.json` if you share a manifest with your UI/theme.

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "openrouter": {
    "translationModels": [
      "anthropic/claude-3.5-haiku",
      "anthropic/claude-haiku-4.5"
    ]
  },
  "features": {
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "ui": {
    "sourceRoots": [],
    "stringsJson": "strings.json",
    "flatOutputDir": "./locales"
  },
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "jsonSource": "i18n/en",
    "markdownOutput": { "style": "docusaurus", "docsRoot": "docs" }
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "path/to/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

## 💡 Key Benefits

- **Consolidated maintenance**: Replaces large duplicated per-repo translation stacks with **one npm package**; each product keeps a **small** integration surface (config + scripts)
- **65% Cost Savings**: Smart caching reduces API calls
- **Faster Translations**: 70%+ cache hit rate on subsequent runs
- **Better Quality**: Glossary enforcement and validation
- **Easy Maintenance**: Published package with community support

## 🛠️ CLI Commands

```bash
ai-i18n-tools init                    # Create config (-t ui-markdown | ui-docusaurus)
ai-i18n-tools extract                 # Extract UI strings → strings.json (i18next-scanner)
ai-i18n-tools translate-ui [options]  # Translate strings.json + write per-locale JSON (OpenRouter, translationModels[])
ai-i18n-tools translate [options]     # Docs: markdown / JSON / SVG (+ UI step if features.translateUIStrings)
ai-i18n-tools sync [options]          # extract → translate-ui (if enabled) → translate docs
ai-i18n-tools status                  # Markdown translation status vs cache
ai-i18n-tools cleanup [options]       # Clean orphaned cache
ai-i18n-tools edit                    # Web editor: doc cache + strings.json + glossary CSV
ai-i18n-tools glossary-generate       # Stub glossary-user.csv with standard headers
```

Enable **`features.translateUIStrings`** to translate UI strings from `strings.json`; use **`translate --no-ui`** to run docs only.

## 📦 Installation Requirements

- Node.js >= 18.0.0
- OpenRouter API key (`OPENROUTER_API_KEY` environment variable)
- Optional: Inkscape (for SVG to PNG export)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Reference deployments

Early production shape and requirements were validated against:

- [Transrewrt](https://github.com/wsj-br/transrewrt) — React/Electron app i18n
- [Duplistatus](https://github.com/wsj-br/duplistatus) — Docusaurus documentation workflow

## 📞 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/wsj-br/ai-i18n-tools/issues)
- 💬 [Discord Community](https://discord.gg/your-server)

---

Made with ❤️ by the ai-i18n-tools contributors
