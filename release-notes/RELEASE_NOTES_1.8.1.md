# ai-i18n-tools 1.8.1 Release Notes

## Highlights

- **CI reliability on Node 24:** GitHub Actions workflows now enable pnpm through Corepack (`corepack prepare --activate`) instead of `pnpm/action-setup`, fixing lockfile read failures on pnpm 11.12 and broken standalone shims when npm blocks install scripts on Node 24 runners.

## Why this release matters

Version 1.8.1 is a maintenance patch that restores reliable CI on current GitHub-hosted runners, so releases and pull-request checks no longer fail during pnpm setup.

## Detailed Changes

- **Fixed**: CI — workflows enable pnpm via corepack (`corepack prepare --activate`) instead of `pnpm/action-setup`. The action's npm bootstrap could not read pnpm 11.12 lockfiles, and `standalone: true` left a broken `@pnpm/exe` shim when npm blocked install scripts on Node 24 runners (`This: not found`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Locale assets guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/LOCALE-ASSETS-GUIDE.md) — screenshots and illustrated SVGs in translated docs.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
