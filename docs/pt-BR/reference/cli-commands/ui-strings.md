<a id="cli--ui-strings"></a>
# CLI — Strings da UI

<a id="extract"></a>
### `extract`

**Sinopse:** `ai-i18n-tools extract`

Atualiza `strings.json` a partir de literais `t("…")` / `i18n.t("…")`, descrição opcional `package.json` e entradas opcionais de bundled-master `englishName` quando `includeUiLanguageEnglishNames` está habilitado (consulte `ui.uiExtractor`; não lê `languagesManifestPath`). Também regenera o `ui-languages.json` de cada bloco. Quando `.html` / `.htm` estão listados em `ui.uiExtractor.extensions`, também captura strings de marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` do HTML. Percorre cada bloco `ui` que tenha `sourceRoots`. `--ui-block` limita a execução a um único bloco (índice, descrição ou caminho `stringsJson`). Não chama um LLM.

**Veja também:** [Visão geral das strings da UI](/pt-BR/guide/ui-strings/), [Aplicativos HTML simples](/pt-BR/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**Sinopse:** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

Importa dicionários `*.content.ts` do Intlayer para `strings.json` e arquivos de localidade simples, e reescreve locais de chamada simples de `useIntlayer` / `getIntlayer` para `t('source string')`. A string é escrita em `sourceLocale`, que pode ser qualquer idioma. Execução de teste por padrão (o relatório ainda é escrito). `--write` preenche o catálogo e aplica reescritas seguras. Não chama um LLM.

O relatório é a transição de tudo o que `--write` deixa para trás, e termina com um **TODO passo a passo** que organiza o restante do trabalho: uma chamada concreta `t()` ou JSX para cada site manual, a linha `import { t }`, os arquivos de dicionário e os resíduos de `IntlayerProvider` a serem excluídos posteriormente, strings de origem que precisam de `extract` e, em seguida, `translate-ui`, e um bootstrap de runtime do i18next para colar sobre o módulo i18n do aplicativo. O controle de localidade deve chamar `i18n.changeLanguage` e também `loadLocale`. `extract` grava `ui-languages.json`, que esse bootstrap importa. Não edite `strings.json`, os arquivos de localidade planos, ou `ui-languages.json` manualmente.

**Opções principais:** `--write`, `--report`, `--content-glob` (padrão `**/*.content.ts`), `--t-import`

**Ver também:** [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer)

---

<a id="translate-intlayer"></a>
### `translate-intlayer`

**Sinopse:** `ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]`

Traduza as folhas de localidade ausentes e desatualizadas dentro dos dicionários `*.content.ts` do Intlayer no local, mantendo os dicionários como a fonte da verdade. Diferente de [`migrate-intlayer`](#migrate-intlayer), isso não move o aplicativo para fora do Intlayer; apenas preenche as folhas `t({ … })`. Use-o quando quiser manter o Intlayer em tempo de execução e usar o ai-i18n-tools como o mecanismo de tradução.

Ele extrai cada folha `t({ … })`, preenche o `strings.json` do bloco de UI escolhido com o texto de origem, executa o mesmo mecanismo que [`translate-ui`](#translate-ui) (seleção de provedor, glossário, contexto de tradução e fallback de modelo) e, em seguida, escreve as novas strings por localidade de volta em cada objeto `t({ … })`. As edições são cirúrgicas: apenas as linhas de localidade ausentes ou desatualizadas mudam, para que sua formatação e comentários sejam preservados. Os placeholders `{token}` do Intlayer fazem uma viagem de ida e volta para <code v-pre>{{token}}</code> para tradução e vice-versa.

Uma folha+localidade é traduzida quando a localidade está ausente da folha (ausente) ou quando o texto da localidade de origem mudou desde a última execução para essa localidade (desatualizado). A desatualização é rastreada em `cacheDir`, portanto, editar essa string de origem retraduz essa folha na próxima execução. O idioma de origem é `sourceLocale` e pode ser qualquer idioma. `--dry-run` relata as contagens de ausentes/desatualizados sem chamar um LLM ou escrever nada. Requer `features.translateUIStrings` e o `stringsJson` do bloco de UI (o mesmo que `translate-ui`).

**Opções principais:** `-l` / `--locale`, `--ui-block`, `--dry-run`, `-j` / `--concurrency`

`[paths...]`: arquivos/diretórios/globs para escanear (padrão: o `sourceRoots` do bloco). `-l` / `--locale`: locales de destino separados por vírgulas para preencher (padrão: os `targetLocales` configurados do bloco). `--ui-block`: índice baseado em zero, descrição ou caminho `stringsJson` (padrão: bloco 0). `-j` paraleliza locales.

**Consulte também:** [migrate-intlayer](#migrate-intlayer), [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**Sinopse:** `ai-i18n-tools mark-html [paths...] [--write]`

Insere marcadores simples `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` no HTML para que o texto de origem seja escrito apenas uma vez (no próprio elemento). Escaneia os arquivos/diretórios/globs fornecidos (padrão: `.html` / `.htm` sob o `sourceRoots` de cada bloco). Execução simulada por padrão (relata a contagem de adições por arquivo e quaisquer elementos de conteúdo misto que precisem de um `<span data-i18n>` manual); `--write` aplica as alterações. Idempotente, respeita `data-i18n-ignore` (ignora o elemento e sua subárvore), nunca altera elementos semelhantes a código (`code`, `pre`, `kbd`, `samp`, `var`) ou texto vazio/apenas numérico, e nunca emite um marcador com valor. Não chama um LLM.

**Opções principais:** `--write`

**Veja também:** [Marcando HTML para tradução](/pt-BR/guide/ui-strings/plain-html#marking-html-for-translation)

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

`-l` / `--locale`: locales de destino separados por vírgulas (padrão: configuração `targetLocales` menos `sourceLocale`). `--force`: retraduzir todas as entradas por locale (ignorar traduções existentes). `--dry-run`: sem gravações, sem chamadas de API. `-j` paraleliza **locales**; dentro de cada locale, a configuração `uiBatchConcurrency` (padrão **2**) paraleliza lotes LLM (blocos de 50 strings, depois grupos de plural). Não há flag CLI para `uiBatchConcurrency`.

---

<a id="sync-ui"></a>
### `sync-ui`

**Sinopse:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrai e depois traduz strings de UI (requer `features.translateUIStrings`). Somente UI — sem documentação, SVG ou `json[]`. Mesmas opções de `-l`, `--force`, `--dry-run` e `-j` que `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Sinopse:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Executa `extract` primeiro (requer `features.translateUIStrings`) para que cada catálogo selecionado corresponda à origem, depois realiza uma revisão LLM de strings de UI do locale de origem (ortografia, gramática). `--ui-block` limita a extração e revisão a um bloco. Dicas de terminologia vêm apenas do CSV `glossary.userGlossary` (mesmo escopo que `translate-ui` — catálogos de UI não são realimentados, então cópias ruins não são reforçadas como glossário). Usa o provedor LLM ativo (sua variável de ambiente de chave de API).

Retorna **1** em caso de falha (feature flag ausente, falha na extração, catálogo ausente/inválido, chave de API ausente ou quando todos os lotes falham); retorna **0** quando a execução é concluída com sucesso (os resultados são consultivos). Grava `proofread-ui-results_<timestamp>.log` em `cacheDir` como um relatório legível (resumo, problemas, linhas não revisadas e linhas de OK por string); o terminal exibe apenas as contagens do resumo e os problemas (sem linhas `[ok]` por string). Um lote que falha, ou uma resposta do modelo que seja menor que o lote e não tenha um `index` utilizável em cada slot, considera essas strings como não revisadas. Os problemas delas são descartados para que um array curto não seja aplicado às strings erradas. Exibe o nome do arquivo de log na última linha. Com `--json`, a saída em formato legível é direcionada ao stderr. Os links usam `path:line` como o botão de link de strings da interface do painel.

**Opções principais:** `-l` / `--locale`, `--chunk` (padrão **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Sinopse:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exporta `strings.json` para XLIFF 2.0 (um `.xliff` por local de destino). Somente leitura; sem API.

**Opções principais:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: diretório de saída (padrão: mesma pasta do catálogo). `--untranslated-only`: apenas unidades que não possuem uma tradução para aquele local.
