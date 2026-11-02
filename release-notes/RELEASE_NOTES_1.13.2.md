# ai-i18n-tools 1.13.2 Release Notes

## Highlights

- **`init` keeps secrets and the cache out of git:** The first run creates `.gitignore` when it is missing. Later runs append only the cache, environment, and temporary-file patterns that are not already listed, so a second run does not duplicate lines.
- **`doctor` checks those ignore rules:** A missing required pattern is a warning. Cache lines follow the configured `cacheDir`, and ignoring that directory is also a warning, because `cache.db` would stay untracked. `--strict` turns the warning into a failure.
- **Add-i18n prompts keep the same rules:** Agent prompts for adding i18n tell the agent to leave the patterns `init` writes in place, and to follow `cacheDir` when it is not `.translation-cache`.

## Why this release matters

Version 1.13.2 makes the ignore list part of setup and health checks, so the translation cache, environment files, and temporary files stay untracked after `init` and show up in `doctor` when a pattern is missing.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.13.2] - 2026-11-02`).

---

## Documentation

- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill.html) — install the consumer skill and workflow slash commands
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repositories

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
