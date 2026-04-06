# ai-i18n-tools — goals and benefits

This page summarizes **why** the package exists, **what** it consolidates, and **how** configuration is usually shaped. For install steps and CLI details, use **[GETTING_STARTED.md](./GETTING_STARTED.md)** and the **[repository README](../README.md)**. For a full list of documents, see **[docs/README.md](./README.md)**.

## Where to read next

| You are… | Start with |
|----------|------------|
| Using the CLI | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Migrating a React/Electron app | [MIGRATION_GUIDE_TRANSREWRT.md](./MIGRATION_GUIDE_TRANSREWRT.md) |
| Migrating a Docusaurus site | [MIGRATION_GUIDE_DUPLISTATUS.md](./MIGRATION_GUIDE_DUPLISTATUS.md) |
| Comparing old stacks to the package | [COMPARISON.md](./COMPARISON.md) |
| Hacking on the package | [I18N_TOOLS_IMPLEMENTATION_PLAN.md](./I18N_TOOLS_IMPLEMENTATION_PLAN.md), [DEVELOPING.md](./DEVELOPING.md) |

**Implementation status** — The CLI, config loader, cache, extractors, and doc pipeline are implemented in this repo. Remaining work (integration tests, deeper legacy parity, etc.) is described in [I18N_TOOLS_IMPLEMENTATION_PLAN.md § Implementation status](./I18N_TOOLS_IMPLEMENTATION_PLAN.md#implementation-status-repository).

---

## 🎯 Key Benefits

### Code consolidation (honest framing)
| Project | Legacy bespoke code (order of magnitude) | After adoption |
|---------|-------------------------------------------|----------------|
| Transrewrt | ~6,835 lines (UI extract/translate JS ~750 + doc TS ~4,785 + deprecated `translate-docs.js` ~1,250) | **One npm dependency** + config + thin npm scripts |
| Duplistatus | ~6,387 lines (doc TS ~5,472 + cache-editor UI ~915) | **Same** + Intlayer removal shrinks UI further |
| **Package** | N/A (new shared implementation) | ~1,500 lines target (single codebase for both) |

Integration footprint per app remains **small** (JSON config + `package.json` scripts), while the **maintained** line count moves into `ai-i18n-tools` instead of two divergent forks.

### Feature Parity + Enhancements
✅ All existing features preserved  
✅ **UI ↔ doc glossary pipeline** via `strings.json` (Transrewrt pattern; first-class in the package)  
✅ Smart caching (SQLite segment cache from the doc translator lineage)  
✅ Web-based translation editor — package unifies cache + UI strings + user glossary CSV  
✅ Better error messages and debugging  
✅ Community support and maintenance  

### Performance Improvements
- **Faster incremental translations**: 70%+ cache hit rate
- **Reduced API costs**: Skip unchanged content
- **Better resource usage**: Optimized batch processing
- **Parallel processing**: Multiple locales simultaneously

---

## 🔧 Configuration Examples

### Transrewrt-style (reference)

OpenRouter uses an **ordered `translationModels` list** (same as `translate.config.json` today): the client tries the first model, then the next on failure, until one succeeds.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["pt-BR", "de", "fr", "es"],
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
  "ui": {
    "sourceRoots": ["src/renderer/"],
    "stringsJson": "src/renderer/locales/strings.json",
    "flatOutputDir": "src/renderer/locales/"
  },
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "./i18n",
    "cacheDir": ".translation-cache",
    "markdownOutput": { "style": "nested" }
  }
}
```

### Duplistatus (Transrewrt engine + Docusaurus extras)

Same **`translationModels`** semantics; add JSON/SVG extractors from the old Duplistatus tree. After UI migration to `t()`, point glossary at `strings.json`.

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
    "translateUIStrings": true,
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
  },
  "glossary": {
    "uiGlossaryFromStringsJson": "path/to/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- All extractors (React, Markdown, JSON, SVG)
- Cache operations (CRUD, cleanup)
- Glossary matching
- Placeholder protection
- Validation logic

**Target**: 80%+ code coverage

### Integration Tests
- Full workflow with Transrewrt
- Full workflow with Duplistatus
- Multi-language scenarios
- Cache hit/miss cases
- Error recovery

### Performance Benchmarks
- Extraction speed
- Translation throughput
- Cache effectiveness
- Memory usage
- Bundle size impact

---

## 📈 Success Metrics

### Quantitative Goals
- ✅ 95%+ code reduction
- ✅ 30%+ faster translations (caching)
- ✅ 70%+ cache hit rate
- ✅ 80%+ test coverage
- ✅ <20% bundle size increase
- ✅ Zero translation quality regression

### Qualitative Goals
- ✅ Both projects successfully migrated
- ✅ Improved developer experience
- ✅ Clear, comprehensive documentation
- ✅ Helpful error messages
- ✅ Community adoption
- ✅ Positive maintainer feedback

---

## ⚠️ Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes during migration | High | Low | Parallel run period, rollback plan |
| Performance regression | Medium | Low | Benchmarking, profiling |
| Translation quality drop | High | Low | Validation, manual review samples |
| Cache corruption | Medium | Low | Backups, integrity checks |
| API rate limiting | Low | Medium | Queue system, exponential backoff |
| Community adoption slow | Low | Medium | Good docs, examples, outreach |

---

## 🔄 Migration Strategy

### Phase 1: Preparation (Week 0)
- Review implementation plan
- Set up development environment
- Create backup of current systems
- Stakeholder approval

### Phase 2: Package Development (Weeks 1-10)
- Build package following implementation plan
- Test with both projects in parallel
- Iterate based on feedback

### Phase 3: Pilot Migration (Week 11)
- Migrate Transrewrt first (simpler)
- Fix any issues
- Update documentation

### Phase 4: Full Migration (Week 12)
- Migrate Duplistatus
- Monitor both projects
- Gather feedback

### Phase 5: Stabilization (Weeks 13-16)
- Fix bugs
- Optimize performance
- Release v1.0.0

---

## 📖 Additional Resources

### Related documentation
Planning and migration guides for this package live **only** in [`docs/`](./README.md) — see [CANONICAL_DOCS.md](./CANONICAL_DOCS.md) for policy and rollout order.

Consumer repos may still maintain their own runbooks, for example:
- Duplistatus: `documentation/docs/development/translation-workflow.md` (if present in your checkout)
- Duplistatus: `documentation/docs/development/documentation-tools.md` (if present)

### External Resources
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [i18next Documentation](https://www.i18next.com/)
- [Docusaurus i18n](https://docusaurus.io/docs/i18n/introduction)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

## 🤝 Contributing

Want to contribute to `ai-i18n-tools`? See [CONTRIBUTING.md](../CONTRIBUTING.md), [DEVELOPING.md](./DEVELOPING.md), and the [implementation plan](./I18N_TOOLS_IMPLEMENTATION_PLAN.md) for architecture and remaining tasks.

---

## 📞 Support

- **GitHub Issues**: https://github.com/wsj-br/ai-i18n-tools/issues
- **Discord**: [Community server link]
- **Email**: [Maintainer contact]
- **Documentation**: Package README and guides

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) file

---

## 🙏 Acknowledgments

This package consolidates work from:
- **Transrewrt**: Custom i18n extraction and translation system
- **Duplistatus**: Advanced Docusaurus translation workflow

Special thanks to all contributors who built the original systems.

---

## 🎉 Summary

The `ai-i18n-tools` package consolidates Transrewrt-style UI translation and Duplistatus-style documentation translation into **one** config-driven tool: **~12k+ lines** of duplicated bespoke code across apps becomes a **small** integration surface per consumer plus a shared npm package.

**Next step**: [GETTING_STARTED.md](./GETTING_STARTED.md) or your [migration guide](./README.md#migrate-from-a-legacy-stack).
