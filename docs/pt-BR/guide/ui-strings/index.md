<a id="ui-strings"></a>
# Strings da UI

Projetado para qualquer projeto JS/TS que use i18next: aplicativos React, Next.js (componentes cliente e servidor), serviços Node.js, ferramentas CLI.

<a id="which-guide-to-read"></a>
## Qual guia ler

| Seu aplicativo | Próximo passo |
| --- | --- |
| React / Next.js / Node + i18next | [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime) (Passo 4) |
| HTML puro (sem `t()` na marcação) | [Aplicativos HTML puros](/pt-BR/guide/ui-strings/plain-html) |
| Site de marketing Astro (híbrido) | [Site Astro](/pt-BR/guide/ui-strings/astro-website) |
| Regras de `t()`, interpolação, plurais | [Chamadas t() e plurais](/pt-BR/guide/ui-strings/t-calls-and-plurals) |
| Seletor de idioma / RTL | [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher) |
| Assinaturas da API de tempo de execução | [Ajudantes de tempo de execução](/pt-BR/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Passo 1: Inicializar

```bash
npx ai-i18n-tools init
```

Isso grava `ai-i18n-tools.config.json` com o modelo `ui-markdown`. Edite-o para definir:

- `sourceLocale` - seu código BCP-47 do idioma de origem (por exemplo, `"en-GB"`). **Deve corresponder** a `SOURCE_LOCALE` exportado do seu arquivo de configuração i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para os idiomas de destino (por exemplo, `["de", "fr", "pt-BR"]`). Execute `generate-ui-languages` para criar o manifesto `ui-languages.json` a partir desta lista.
- `ui.sourceRoots` - diretórios ou padrões glob para procurar chamadas `t("…")` (por exemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - onde escrever o catálogo mestre (por exemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - onde gravar `de.json`, `pt-BR.json`, etc. (ex: `"src/locales/"`).
- `providers.<active>.uiModels` (opcional) - lista ordenada de modelos apenas para a UI para `translate-ui`, geração de plural e `proofread-ui` (após qualquer entrada `localeModels` correspondente, antes de `translationModels`). Consulte [Provedores e modelos](/pt-BR/guide/providers-and-models#model-fallback-chain).

<a id="step-2-extract-strings"></a>
## Passo 2: Extrair strings

```bash
npx ai-i18n-tools extract
```

Verifica todos os arquivos JS/TS em `ui.sourceRoots` em busca de chamadas `t("literal")` e `i18n.t("literal")`. Grava (ou mescla em) `ui.stringsJson`.

O scanner é configurável: adicione nomes de funções personalizadas via `ui.uiExtractor.funcNames` (ou o legado `ui.reactExtractor.funcNames`). Para páginas e componentes Astro, adicione `.astro` a `ui.uiExtractor.extensions`. Para HTML puro, consulte [Aplicativos HTML puros](/pt-BR/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Passo 3: Traduzir strings da UI

```bash
npx ai-i18n-tools translate-ui
```

Lê `strings.json`, envia lotes para o provedor de LLM ativo para cada localidade de destino, grava arquivos JSON planos (`de.json`, `fr.json`, etc.) em `ui.flatOutputDir`. A seleção do modelo usa a cadeia da UI: `localeModels(locale)` → `uiModels` → `translationModels` (consulte [Provedores e modelos](/pt-BR/guide/providers-and-models#model-fallback-chain)).

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

Entradas opcionais em `providers.<active>.localeModels` mapeiam uma localidade BCP-47 para uma lista ordenada de modelos testada **antes** de `uiModels` e `translationModels` para aquela localidade. As mesmas entradas de `localeModels` também se aplicam à tradução de documentos, JSON e SVG. As tags de localidade são comparadas sem distinção entre maiúsculas e minúsculas (`pt-br` = `pt-BR`). Se nenhuma entrada corresponder, apenas `uiModels` e `translationModels` serão usados para o trabalho de UI.

Para cada entrada, `translate-ui` armazena o **ID do modelo do provedor ativo** que traduziu com sucesso cada localidade em um objeto `models` opcional (mesmas chaves de localidade que `translated`). As strings editadas no Painel de Tradução são marcadas com o valor sentinela `user-edited` em `models` para essa localidade. Os arquivos planos por localidade em `ui.flatOutputDir` permanecem **string de origem → tradução** apenas; eles não incluem `models` (para que os pacotes de tempo de execução permaneçam inalterados).

> **Nota:** As edições do Painel para strings da UI ficam em `strings.json`, não no cache de documentação SQLite. Execute `sync` ou `translate-ui` simples (sem sinalizador especial) para reescrever arquivos de localidade planos do catálogo — `--force-update` **não** é encaminhado para a etapa da UI. Evite `--force` em comandos da UI após edições manuais: ele retraduz cada entrada e pode sobrescrever suas linhas `user-edited`.

Em seguida, conecte o i18next em tempo de execução — [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exportando para XLIFF 2.0 (opcional)

Para entregar strings da interface a um fornecedor de tradução, TMS ou ferramenta CAT, exporte o catálogo como **XLIFF 2.0** (um arquivo por localidade de destino). Este comando é **somente leitura**: não modifica `strings.json` nem chama nenhuma API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por padrão, os arquivos são gravados ao lado de `ui.stringsJson`, com nomes como `strings.de.xliff`, `strings.pt-BR.xliff` (nome base do seu catálogo + localidade + `.xliff`). Use `-o` / `--output-dir` para gravar em outro local. Traduções existentes de `strings.json` aparecem em `<target>`; localidades ausentes usam `state="initial"` sem `<target>`, para que as ferramentas possam preenchê-las. Use `--untranslated-only` para exportar apenas unidades que ainda precisam de tradução para cada localidade (útil para lotes enviados a fornecedores). `--dry-run` exibe os caminhos sem gravar arquivos.
