<a id="cli--ui-strings"></a>
# CLI — Strings da UI

<a id="extract"></a>
### `extract`

**Sinopse:** `ai-i18n-tools extract`

Atualiza `strings.json` a partir de literais `t("…")` / `i18n.t("…")`, descrição opcional `package.json` e entradas opcionais `englishName` do master empacotado quando `includeUiLanguageEnglishNames` está habilitado (veja `ui.uiExtractor`; não lê `languagesManifestPath`). Também regenera `ui-languages.json` em `languagesManifestPath`. Quando `.html` / `.htm` estão listados em `ui.uiExtractor.extensions`, também captura strings de marcador `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` do HTML. Requer `ui.sourceRoots` não vazio. Não chama um LLM.

**Veja também:** [Visão geral das strings da UI](/guide/ui-strings/), [Aplicativos HTML simples](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**Sinopse:** `ai-i18n-tools mark-html [paths...] [--write]`

Insere marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` puros no HTML para que o texto de origem seja escrito uma vez (no próprio elemento). Escaneia os arquivos/diretórios/globs fornecidos (padrão: `.html` / `.htm` em `ui.sourceRoots`). Execução a seco por padrão (relata contagens de adições por arquivo e quaisquer elementos de conteúdo misto que precisam de um `<span data-i18n>` manual); `--write` aplica as alterações. Idempotente, respeita `data-i18n-ignore` (ignora o elemento e sua subárvore), nunca toca em elementos semelhantes a código (`code`, `pre`, `kbd`, `samp`, `var`) ou texto vazio/apenas numérico, e nunca emite um marcador valorizado. Não chama um LLM.

**Opções principais:** `--write`

**Veja também:** [Marcando HTML para tradução](/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**Sinopse:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

Escreve `ui-languages.json` em `languagesManifestPath` (o padrão é `{ui.flatOutputDir}/ui-languages.json`) usando `sourceLocale` + `targetLocales` e o `data/ui-languages-complete.json` empacotado (ou `--master`). Avisa e emite espaços reservados `TODO` para localidades ausentes do arquivo mestre. Se você tiver um manifesto existente com valores `label` ou `englishName` personalizados, eles serão substituídos pelos padrões do catálogo mestre — revise e ajuste o arquivo gerado posteriormente.

**Opções principais:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**Sinopse:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Traduz apenas strings da UI (`strings.json` → JSON de localidade). Requer `features.translateUIStrings`.

**Opções principais:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: localidades de destino separadas por vírgulas (padrão: configuração `targetLocales` menos `sourceLocale`). `--force`: retraduz todas as entradas por localidade (ignora traduções existentes). `--dry-run`: sem gravações, sem chamadas de API.

---

<a id="sync-ui"></a>
### `sync-ui`

**Sinopse:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrai e depois traduz strings de UI (requer `features.translateUIStrings`). Somente UI — sem documentação, SVG ou `json[]`. Mesmas opções de `-l`, `--force`, `--dry-run` e `-j` que `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Sinopse:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Executa `extract` primeiro (requer `features.translateUIStrings`) para que `strings.json` corresponda à origem, depois revisão LLM de strings de UI do local de origem (ortografia, gramática). As dicas de terminologia vêm apenas do CSV `glossary.userGlossary` (mesmo escopo que `translate-ui` — não `strings.json` / `uiGlossary`, então cópias ruins não são reforçadas como glossário). Usa o provedor LLM ativo (sua variável de ambiente de chave de API).

Sai com **1** em caso de falha (sinalizador de recurso ausente, falha de extração, catálogo ausente/inválido, chave de API ausente ou quando todos os lotes falham); sai com **0** quando a execução é concluída com sucesso (os resultados são consultivos). Grava `proofread-ui-results_<timestamp>.log` em `cacheDir` como um relatório legível por humanos (resumo, problemas e linhas OK por string); o terminal imprime apenas contagens de resumo e problemas (sem linhas `[ok]` por string). Imprime o nome do arquivo de log na última linha. Com `--json`, a saída em estilo humano vai para stderr. Os links usam `path:line` como o botão de link de strings da UI do painel.

**Opções principais:** `-l` / `--locale`, `--chunk` (padrão **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Sinopse:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exporta `strings.json` para XLIFF 2.0 (um `.xliff` por local de destino). Somente leitura; sem API.

**Opções principais:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: diretório de saída (padrão: mesma pasta do catálogo). `--untranslated-only`: apenas unidades que não possuem uma tradução para aquele local.
