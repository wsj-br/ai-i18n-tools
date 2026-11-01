# ai-i18n-tools 1.12.0 Release Notes

## Highlights

- **Use the toolkit from a coding agent:** The package ships a portable `ai-i18n-tools` skill with one slash command per consumer workflow (loaded only when named) and references for glossary consistency and provider or model selection. Marketplace files cover Claude Code, GitHub Copilot, and Codex. GitHub releases attach `ai-i18n-tools-skill.zip`, and plugin manifest versions stay aligned with the package version.
- **Check a project with `doctor`:** The new command checks config, paths, cache, providers, and environment, verifies model ids against the provider catalog, and warns when a newer GitHub release exists. `--local` skips both network checks. Catalog lines name the active provider, each provider prints on one line with active state, API key status, and base URL, and the version line marks the current install.
- **API Key Fan replaces Apifun:** The built-in provider key is now `apikeyfan` (`https://api.apikey.fan/v1`, `APIKEYFAN_API_KEY`). An existing `APIFUN_API_KEY` still works. Update the provider key in config and the `init -P` value to `apikeyfan`.
- **Keep one anchor when a heading is renamed:** `write-heading-ids` leaves a single HTML anchor for the current slug, removes older `<a id>` lines stacked above that heading, and retargets in-repo markdown links that pointed at a removed id. An anchor that is not directly above a heading stays in place.
- **Clearer English in the docs and the tool UI:** English documentation uses consistent UK spelling and terminology, and drops phrasing that translates poorly. CLI and dashboard source strings match that wording (for example `prioritise`, `re-translate`, and consistent flag labels).
- **Release assets in one upload:** The publish job uploads `ai-i18n-tools-*` once, covering the platform binaries, `ai-i18n-tools-python-examples.zip`, and `ai-i18n-tools-skill.zip`, plus `SHA256SUMS.txt`. `install.sh` and `install.ps1` stay in the repository.
- **Leaner install:** Unused `i18next-scanner` is gone (UI extraction already uses the Babel parser), and the unused optional `react` peer dependency is gone too.

## Why this release matters

Version 1.12.0 makes the toolkit easier to run from a coding agent and easier to diagnose before a translation run. A distributable skill covers the consumer workflows, and `doctor` checks config, models, and updates in one pass. The Apifun preset is now API Key Fan, and renamed headings no longer keep a stack of old HTML anchors.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.12.0] - 2026-11-01`).

---

## Documentation

- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repositories

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
