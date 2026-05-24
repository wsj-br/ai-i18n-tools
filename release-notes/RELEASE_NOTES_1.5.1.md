# ai-i18n-tools 1.5.1 Release Notes

## Highlights

- **pnpm 11 alignment:** The package now requires `pnpm >= 11.0.0` (was `>= 10.33.0`); CI uses `pnpm/action-setup` v6 so installs match the `packageManager` field in `package.json`.
- **Release notes location:** GitHub releases read notes from `release-notes/RELEASE_NOTES_<version>.md` (previously `dev/RELEASE_NOTES_<version>.md`), keeping release artifacts separate from maintainer docs.

## Why this release matters

Version 1.5.1 is a maintenance release that aligns tooling with pnpm 11 across the repo and CI, and standardizes where versioned release notes live for the GitHub release workflow—no user-facing translation or CLI behavior changes.

## Detailed Changes

- **Changed**: package — `engines.pnpm` is now `>=11.0.0` (was `>=10.33.0`); `dev/DEVEL.md` and `.cursor/rules/project.mdc` updated to match.

- **Changed**: CI — bump `pnpm/action-setup` to v6 (pnpm 11.x; version still read from `packageManager` in `package.json`).

- **Changed**: scripts — `scripts/release.sh` reads release notes from `release-notes/RELEASE_NOTES_<version>.md` (was `dev/RELEASE_NOTES_<version>.md`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
