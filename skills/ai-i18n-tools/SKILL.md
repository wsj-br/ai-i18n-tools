---
name: ai-i18n-tools
description: Installs and maintains ai-i18n-tools internationalization in consumer projects. Use when adding languages, configuring ai-i18n-tools.config.json, or translating JavaScript, TypeScript, Python, Django, gettext, VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro websites, plain HTML, README or Markdown, JSON bundles, or SVG assets. For migrating off Intlayer or translating Intlayer dictionaries in place, use the ai-i18n-migrate-intlayer or ai-i18n-translate-intlayer skill.
---

# ai-i18n-tools for consumer projects

Use this skill in projects using the tool, not for upstream implementation work.
Follow the consuming project's instructions and preserve its existing runtime and conventions.

## Load only relevant references

Read these files relative to this skill directory, not the project working directory:

- [JavaScript / TypeScript](references/javascript.md): literal UI messages, i18next, browser/SSR wiring, HTML markers.
- [Python](references/python.md): generated helper, gettext, Django, Flask-Babel, deployment.
- [Documentation](references/documentation.md): README, docs frameworks, static pages, framework shell catalogs.
- [Assets, links, and SVG](references/assets-and-links.md): localized media, SVG labels, anchors, broken translated links.
- [JSON](references/json.md): nested source-locale JSON, i18next namespaces, key policies and output layouts.
- [Providers and models](references/providers.md): provider selection, model fallback chains, credentials, cost.
- [Glossary](references/glossary.md): terminology consistency, user CSV, forced terms, context files.

Mixed projects need multiple references. Do not load every reference by default.
Read [providers and models](references/providers.md) when choosing or changing a provider/model, and [glossary](references/glossary.md) when terminology consistency matters.

## Workflow commands

Installed workflow skills are explicit slash commands. Follow this skill first, then only the invoked workflow. A prose request that names one workflow reads the same reference:

| Workflow skill | Read |
| --- | --- |
| `ai-i18n-js` | `references/javascript.md` |
| `ai-i18n-python` | `references/python.md`, generated-helper sections |
| `ai-i18n-django` | `references/python.md`, gettext, Django, and Flask-Babel sections |
| `ai-i18n-vitepress`, `ai-i18n-starlight`, `ai-i18n-docusaurus`, `ai-i18n-nextra`, `ai-i18n-fumadocs`, `ai-i18n-readme`, `ai-i18n-plain-html-docs` | `references/documentation.md`, that workflow's section |
| `ai-i18n-plain-html` | `references/javascript.md`, HTML marker section |
| `ai-i18n-astro-website` | `references/javascript.md` and `references/documentation.md` |

Migrating an app off Intlayer follows `ai-i18n-migrate-intlayer`: dry-run `ai-i18n-tools migrate-intlayer`, then `--write` only after reviewing the report. `sync` is not the migration command. Filling Intlayer dictionaries while Intlayer stays at runtime follows `ai-i18n-translate-intlayer`: dry-run `ai-i18n-tools translate-intlayer <paths> --dry-run`, then run it without `--dry-run` when authorized. Do not rewrite those call sites to `t()`. JSON bundles and SVG labels stay on the references above when the request is for those pipelines.

## 1. Inspect before changing

- Check the installed CLI version with `ai-i18n-tools --version` and inspect project scripts/lockfiles.
- Run `ai-i18n-tools doctor` and fix failures before `sync`. Use `--local` when the provider catalog and the GitHub release check should be skipped.
- Locate `ai-i18n-tools.config.json` or the project's custom `-c <path>` configuration.
- Identify source content, existing localization runtime, source locale, target locales, and deployment layout.
- Preserve established gettext, i18next namespace JSON, routing, and provider choices rather than migrating them unnecessarily.
- Resolve requirements that cannot be inferred: requested languages, translation scope, provider, and output locations.
- Check project policy before model calls. An explicitly authorized sync does not need redundant approval.

## 2. Install or configure

The npm CLI requires Node.js >=22.16. Use the project's package manager and version pinning.
A standalone executable is available for Python/docs-only projects without Node.js.
A global CLI or executable does not supply application imports: projects importing `ai-i18n-tools/runtime` need a local package dependency available wherever that code runs/builds.
Use the project's script, local executable, or configured PATH; do not silently fetch a different CLI version.

For a new configuration, choose a template from the relevant reference and run:

```bash
ai-i18n-tools init -P <provider> -t <template>
```

`init` overwrites the selected configuration, including a custom output target. Do not run it over existing configuration; edit that configuration instead. Inspect scaffolded paths and model choices before syncing.

Configure `providers.<name>` and select `provider` (optional with one configured provider); see [providers and models](references/providers.md) for fallback chains, per-locale models, and cost.
Use the provider's documented API-key environment variable; never paste secrets into config, logs, or commits.
The CLI loads `.env` from the working directory without overriding existing environment variables.
Keep source content transmission and provider costs within the user's authorization.

## 3. Choose pipelines and prepare sources

- `ui`: literal translation calls in JS/TS/Python or HTML `data-i18n*` markers; generates the catalog and runtime outputs.
- `docs[]`: Markdown/MDX/Astro/HTML pages and supported documentation-framework shell catalogs.
- `json[]`: standalone nested locale JSON, not generated UI flat bundles or framework shell catalogs.
- `svg`: human-readable SVG text labels, not raster text or outlined paths.

One project may configure all four. Feature flags are `translateUIStrings`, `translateDocs`, `translateJson`, and `translateSVG` under `features`.
Align config `sourceLocale` with the actual runtime source locale; no particular exported constant name is required.
Keep `targetLocales`, runtime locale loaders, language manifests, and framework routes aligned.
Use literal messages; interpolate values after lookup. Do not expect extraction to discover unmarked prose or arbitrary dynamic keys.
For consistent product names, domain terms, and do-not-translate words across pipelines, curate the glossary; see [glossary](references/glossary.md).

### Artifact contract

- `ui.stringsJson` is an extraction/translation catalog. Ordinary row IDs are MD5-8 hashes of trimmed source strings; contextual gettext IDs also include context.
- Flat UI JSON uses source-language messages as keys, not catalog hashes. Contextual gettext keys and plurals have specialized forms.
- Custom flat lookup helpers fall back to the source message. Use the supplied runtime/helper for plural or contextual behavior rather than inventing hash lookup.
- Extraction preserves translations for surviving discovered rows, but can remove manual-only entries. Fix source literals rather than hand-seeding dynamic keys.
- Generated locale files and translated page trees are outputs. Fix source/configuration, then regenerate; do not hand-patch outputs.

## 4. Sync

```bash
ai-i18n-tools sync
```

This is the default installation and maintenance command. It runs configured/enabled UI extraction and translation, SVG, documents, then JSON. No separate extraction command is needed.
For custom config, use `ai-i18n-tools -c <path> sync`.
Use `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json` only for an explicitly narrower request or project policy.
Do not substitute `translate-ui` and assume it extracts first; individual commands belong in targeted diagnosis.

## 5. Verify and maintain

- Review the diff: intended source/config changes and generated artifacts only; no secrets or accidental locale-path churn.
- Test source fallback, at least one target locale, interpolation/plurals where used, and RTL where supported.
- Run project tests and the app/docs build. Verify bundles, images, and gettext `.mo` files in the installed/deployed artifact, not only the source checkout.
- After source edits or adding target locales, use `sync` again and check language manifests/routing when applicable.
- Before upgrades, record/pin the current version and preserve config, cache, and customized helpers. Review release changes; do not rerun `init` as an upgrade mechanism.
- Update copied skills/references from the same release as the CLI. An npm upgrade does not refresh a separately copied skill or generated Python helper.
- Report changes, validation results, and anything not run. Do not claim live model translations or cross-agent compatibility testing without executing them.

## Further reference

Use installed `--help` for version-specific flags. Online documentation may describe a newer release:
[installation](https://wsj-br.github.io/ai-i18n-tools/guide/installation),
[coding-agent skill](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill),
[configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration),
[providers](https://wsj-br.github.io/ai-i18n-tools/guide/providers-and-models),
[CLI reference](https://wsj-br.github.io/ai-i18n-tools/reference/cli-commands/).
