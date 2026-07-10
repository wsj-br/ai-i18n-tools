---
layout: home
title: VitePress + ai-i18n-tools
description: Minimal demo translating English documentation to pt-BR and zh-Hans with docsOutput.style vitepress.
---

# VitePress + ai-i18n-tools

This example shows the **`vitepress`** output preset: English source pages live at `docs/` and translated copies are written to `docs/pt-BR/` and `docs/zh-Hans/`.

## What you will see

- `init -t ui-vitepress`-style config with `docsOutput.style: "vitepress"`
- Two target locales only (`pt-BR`, `zh-Hans`) for a fast, readable demo
- Committed translations so `pnpm run docs:dev` works without an API key

## Next steps

Read [Getting started](./guide/getting-started.md) and compare with the full write-up on the [main documentation site](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/vitepress/).
