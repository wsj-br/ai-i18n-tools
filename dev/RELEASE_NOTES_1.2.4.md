# ai-i18n-tools 1.2.4 Release Notes

## Highlights

- UI language tooling loads repo-root `.env` automatically: `pnpm run build:ui-languages-master` uses `node --env-file-if-exists=.env`, and the build / fill / validate scripts call `scripts/lib/load-repo-dotenv.mjs` so `OPENROUTER_API_KEY` is available without exporting it in the shell.
- The Wikimedia-backed catalog build decodes HTML character references (such as `&#160;`) when scraping English names, so `data/ui-languages-complete.json` contains plain text instead of literal entity strings.
- CI uses `pnpm/action-setup` without pinning a pnpm version that conflicts with `packageManager` in `package.json`.
- `scripts/release.sh` can replace an existing GitHub release or stray tags before recreating the annotated tag and publishing notes.


## Why this release matters

Smoother local regeneration of the bundled UI language catalog with OpenRouter, cleaner English metadata from Wikimedia HTML, more reliable installs in CI, and safer iterative GitHub releases.


---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.


---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
