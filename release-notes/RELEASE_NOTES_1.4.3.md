# ai-i18n-tools 1.4.3 Release Notes

## Highlights

- **Security hardening:** Fixed multiple high and moderate severity vulnerabilities in dependencies (`serialize-javascript`, `fast-uri`, and `@babel/plugin-transform-modules-systemjs`) via pnpm overrides, ensuring safer builds and runtime.
- **Dependency consistency:** Unified Express to version 5.2.1 across the entire workspace, eliminating version conflicts between the main package and transitive dependencies from `webpack-dev-server`.
- **Workspace improvements:** Restructured the docs-site example to be part of the root workspace, enabling proper override inheritance and cleaner dependency management.

## Why this release matters

This is a **security-focused release** that patches critical vulnerabilities in the dependency tree while maintaining full compatibility with Node.js 24 and Electron 42. Users should upgrade immediately to benefit from these security fixes without any breaking changes to the API or CLI.

## Detailed Changes

- **Security**: dependencies — fixed high/moderate vulnerabilities via pnpm overrides:
  - `serialize-javascript@7.0.5` (RCE via RegExp.flags/Date.toISOString and CPU exhaustion DoS)
  - `fast-uri@3.1.2` (path traversal and host confusion via percent-encoded delimiters)
  - `@babel/plugin-transform-modules-systemjs@7.29.4` (arbitrary code generation when compiling malicious input)

- **Changed**: workspace — `examples/nextjs-app/docs-site` added to root `pnpm-workspace.yaml` packages so overrides apply correctly; removed nested `pnpm-workspace.yaml` and local `pnpm.overrides` from docs-site.

- **Changed**: dependencies — unified `express` to `^5.2.1` across the entire workspace via pnpm override (previously `webpack-dev-server` brought in `express@4.22.2`).

---

## Documentation

- [Getting Started](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/GETTING_STARTED.md) — setup, CLI flags, and config reference.  
- [Package Overview](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/PACKAGE_OVERVIEW.md) — architecture and extension points.  
- [AI Agent Context (consumers)](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — concise context for apps **using** the npm package.

---

## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br/ai-i18n-tools)
