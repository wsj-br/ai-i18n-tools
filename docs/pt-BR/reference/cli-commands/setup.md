<a id="cli--setup"></a>
# CLI — Configuração

<a id="version"></a>
### `version`

**Sinopse:** `ai-i18n-tools version`

Exibe a versão da CLI e o carimbo de data/hora da compilação (mesmas informações que `-V` / `--version` no programa raiz).

---

<a id="init"></a>
### `init`

**Sinopse:** `ai-i18n-tools init [-t <template>] [-o <path>] [--with-translate-ignore]`

Escreva um arquivo de configuração inicial (inclui `provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `docs[].addFrontmatter`). Os comandos de tradução que chamam um LLM exigem a chave de API do provedor ativo no ambiente ou `.env` (exceto Ollama) — consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).

**Opções principais:** `-t` / `--template`, `-o` / `--output`, `--with-translate-ignore`

**Modelos (`-t`):**

| Valor | Scaffolds |
|-------|-----------|
| `ui-markdown` | Fluxo de trabalho de strings de UI Markdown |
| `ui-docusaurus` | UI Docusaurus + docs |
| `ui-starlight` | Docs Starlight |
| `ui-vitepress` | Docs VitePress (`docsOutput.style: "vitepress"`) mais `vitepressThemeCatalog` para strings de tema |
| `ui-nextra` | Docs Nextra (`docsOutput.style: "nextra"`) mais `nextraDictionaryPath` para o dicionário de tema (barra lateral `_meta.ts` é coletada automaticamente) |
| `ui-fumadocs` | Docs Fumadocs (`docsOutput.style: "fumadocs"`) mais `fumadocsUiCatalog` para substituições de UI (barra lateral `meta.json` é coletada automaticamente) |
| `ui-astro-website` | Strings de UI do site Astro |
| `ui-json-bundles` | JSON (somente `json[]`) |

`--with-translate-ignore` cria um `.translate-ignore` inicial.
