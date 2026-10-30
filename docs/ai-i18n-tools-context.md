# ai-i18n-tools — consumer agent context

Use this context when installing or maintaining internationalization in a project that uses `ai-i18n-tools`, not when developing the tool itself.

This file is self-contained. Every link below is a published documentation page or a repository URL, so it still works when the file is copied into a prompt or another project.

Read the [consumer skill](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/SKILL.md) for the shared workflow. One install includes that skill and a slash command for each workflow below. Read only the reference that matches the task:

- [JavaScript / TypeScript](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/javascript.md): source-string UI, i18next, browser/SSR runtime, and HTML markers.
- [Python](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/python.md): generated helper or existing gettext, Django, and Flask-Babel.
- [Documentation](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/documentation.md): README, documentation frameworks, static pages, and shell catalogs.
- [Assets, links, and SVG](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/assets-and-links.md): localised images, anchors, link rewriting, and SVG labels.
- [JSON](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/json.md): nested locale bundles and namespaces.
- [Providers and models](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/providers.md): provider selection, model fallback chains, credentials, and cost.
- [Glossary](https://github.com/wsj-br/ai-i18n-tools/blob/main/skills/ai-i18n-tools/references/glossary.md): terminology consistency, user CSV, forced terms, and context files.

Those files also ship in the npm package at `node_modules/ai-i18n-tools/skills/ai-i18n-tools/`. The workflow commands are sibling directories under `node_modules/ai-i18n-tools/skills/`. The links above track the repository `main` branch. For an older install, open the same paths from the [matching release tag](https://github.com/wsj-br/ai-i18n-tools/tags) or the installed package, and prefer `ai-i18n-tools --help` over a newer online guide.

## Workflow commands

Type one command, or name it in the request. Each command follows the shared skill and then only its own template:

| Command | Workflow |
| --- | --- |
| `/ai-i18n-js` | JavaScript or TypeScript source-string UI |
| `/ai-i18n-python` | Generated Python helper and flat JSON catalogs |
| `/ai-i18n-django` | Django, Flask-Babel, or plain gettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlight docs |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Vanilla Astro website, page HTML plus build-time `t()` |
| `/ai-i18n-plain-html` | One HTML file, switched in the browser |
| `/ai-i18n-plain-html-docs` | One HTML tree per locale |
| `/ai-i18n-readme` | README and repository Markdown |
| `/ai-i18n-migrate-intlayer` | One-time move from Intlayer to `t()` calls. Dry-run `migrate-intlayer` before `--write`. |
| `/ai-i18n-translate-intlayer` | Fill Intlayer dictionaries in place. Dry-run `translate-intlayer --dry-run` before translating. |

A request that does not name a command uses the shared skill and the matching reference above. `sync` is not the Intlayer migration or in-place translation command.

## Walkthroughs and examples

Follow the walkthrough that matches the project. Start at [Add i18n to your project](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-your-project) when the content type is not yet clear.

- [Add i18n to a JS/TS app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-js) — [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) (smallest `t()` app) and [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (React, plurals, docs, and SVG).
- [Add i18n to a Python app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python) — [python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi), [python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask), and [python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit).
- [Add i18n to a Django / Python gettext app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-django-gettext) — [python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext). There is no Django example directory.
- [Add i18n to a website or docs site](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-website) — [vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs), [docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs), [astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs), [nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs), [fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs), [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website), [plain-html](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html), and [plain-html-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs).
- [Add i18n to your README and Markdown docs](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme) — `console-app` and `nextjs-app` also translate a README.

The [examples index](https://wsj-br.github.io/ai-i18n-tools/examples) lists the rest, including `multi-provider`, `test-markdown`, `intlayer-migration`, and `intlayer-translate`. Examples are in the [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples), not the npm tarball. The four Python examples are also in `ai-i18n-tools-python-examples.zip` on each [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases). Copy one with `npx degit wsj-br/ai-i18n-tools/examples/<name> <name>` and read its README before adapting it.

## Essential contract

1. Inspect the existing version, configuration, runtime, and source/target locales before changing anything. `init -P <provider> -t <template>` scaffolds a new project but overwrites the selected config; do not rerun it over an existing setup.
2. Select pipelines by content, not application language: literal `t()`/gettext calls or HTML markers use `ui`; pages and framework shell catalogs use `docs[]`; standalone nested locale bundles use `json[]`; SVG text labels use `svg`.
3. Configure the selected pipelines and run `ai-i18n-tools sync`. It handles UI extraction/translation, SVG, documents, and JSON in that order when configured/enabled. No separate extraction step is needed. Use skip flags only for explicitly narrower scope or project policy.
4. Match config `sourceLocale` to the runtime's actual source locale. Preserve the project's locale identifiers, routing, and existing translation system.
5. `strings.json` is the extraction/translation catalog, not a flat runtime bundle. Ordinary flat bundles use source-language text keys, not MD5 IDs; gettext context and plural entries have specialized forms described in the references.
6. Use extractable literal messages and interpolate after lookup. Do not repair dynamic keys by hand-adding catalog rows: extraction can prune those rows. Do not hand-edit generated locale outputs; fix source/configuration and regenerate.
7. Translation can send source content to the configured provider and incur charges. Honor the requested scope and project policy; an authorized sync needs no redundant approval. Never expose or commit API keys.
8. Review generated changes, test source and target locales, and verify the app/docs build and packaged assets. Keep CLI and copied skill versions aligned when upgrading; preserve customized helpers and configuration.

## Installation and fallback

The CLI needs Node.js >=22.16 when installed through npm, or a standalone executable without a separate Node.js installation. A global CLI or executable does not provide imports from `ai-i18n-tools/runtime`; JS/TS apps using those imports need the package in their own dependencies.

Installing the package does not register an agent skill. With Node.js 22.20 or later, `npx skills add wsj-br/ai-i18n-tools --all -y` installs every skill directory into the agent's skills folder. If the package is already installed, copy `node_modules/ai-i18n-tools/skills/.` into that folder. With no Node.js, extract `package/skills/` from the npm tarball for this version, or unpack `ai-i18n-tools-skill.zip` from the matching GitHub Release when that asset is present. See [skill installation](https://wsj-br.github.io/ai-i18n-tools/guide/coding-agent-skill).

For an agent without skills, point project instructions at this file or its [repository copy](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md), for example: “Before installing or maintaining ai-i18n-tools, read https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md and follow only the linked reference that matches this project.” Do not point consumer agents at the upstream maintainer guide.

Further details: [installation](https://wsj-br.github.io/ai-i18n-tools/guide/installation), [configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration), and [CLI reference](https://wsj-br.github.io/ai-i18n-tools/reference/cli-commands/).
