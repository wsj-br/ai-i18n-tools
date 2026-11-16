# ai-i18n-tools 1.15.1 Release Notes

## Highlights

- **UI translations are kept as each batch finishes:** `translate-ui` writes every successful plain batch, plural group, and Step 0 group to `strings.json` and the flat locale file immediately. Stopping the run, or a later API error, no longer drops work already completed in that phase.
- **A config-local env file can supply the API key:** When no provider API key is already set, `.env` and `.env.local` next to `ai-i18n-tools.config.json` supply this tool's variables. A warning names the file and the variables that were read. An API key already in the environment skips those files, and `doctor` repeats the warning in the Environment section.
- **`doctor` lists only the providers you named:** The default `openrouter` provider appears only when the config does not name a provider.
- **The pre-release check builds and smokes the standalone executable:** `pnpm pre-release` runs `pnpm build:binary`, then checks `--version`, `list-languages`, `init`, and `status`.

## Why this release matters

Version 1.15.1 keeps UI-string batches that already succeeded when a later batch fails or the process is stopped, and picks up provider settings from env files beside the config when the environment has no API key.

---

For the full list of changes, see [`dev/CHANGELOG.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/CHANGELOG.md) (`## [1.15.1] - 2026-11-16`).

---

## Documentation

- [Documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill.html) — install the consumer skill and workflow slash commands
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise prompt / `AGENTS.md` entrypoint for consumer projects

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
