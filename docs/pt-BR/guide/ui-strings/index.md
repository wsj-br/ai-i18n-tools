<a id="ui-strings"></a>
# Strings da UI

Projetado para qualquer projeto JS/TS que use i18next: aplicativos React, Next.js (componentes de cliente e servidor), serviços Node.js, HTML puro, sites Astro e ferramentas CLI.

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
ai-i18n-tools init [-P <provider>]
```

Isso escreve `ai-i18n-tools.config.json` com o modelo `ui-markdown` (incluindo um bloco padrão `provider` / `providers`). Antes de executar `translate-ui` ou `sync`, defina a chave de API para seu provedor ativo no ambiente ou `.env` — Ollama é uma exceção; consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key). Edite a configuração para definir:

- `provider` e `providers` — pelo menos um provedor com `translationModels`; altere o preset ou a lista de modelos se o padrão não for sua escolha (`init -P <provider>`). Consulte [Provedores e modelos LLM](/pt-BR/guide/providers-and-models).
- `sourceLocale` - seu código BCP-47 do idioma de origem (por exemplo, `"en-GB"`). **Deve corresponder** a `SOURCE_LOCALE` exportado do seu arquivo de configuração i18n de tempo de execução (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - array de códigos BCP-47 para seus idiomas de destino (por exemplo, `["de", "fr", "pt-BR"]`). Execute `generate-ui-languages` para criar o manifesto `ui-languages.json` a partir desta lista.
- `ui.sourceRoots` - diretórios ou padrões glob para escanear chamadas `t("…")` (por exemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - onde escrever o catálogo mestre (por exemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - onde escrever `de.json`, `pt-BR.json`, etc. (por exemplo, `"src/locales/"`).
- `providers.<active>.uiModels` (opcional) - lista de modelos somente de UI ordenada para `translate-ui`, geração plural e `proofread-ui` (após qualquer entrada `localeModels` correspondente, antes de `translationModels`). Consulte [Provedores e modelos](/pt-BR/guide/providers-and-models#model-fallback-chain).

<a id="step-2-extract-strings"></a>
## Passo 2: Extrair strings

```bash
ai-i18n-tools extract
```

Verifica todos os arquivos JS/TS em `ui.sourceRoots` em busca de chamadas `t("literal")` e `i18n.t("literal")`. Grava (ou mescla em) `ui.stringsJson`.

O scanner é configurável: adicione nomes de funções personalizadas via `ui.uiExtractor.funcNames` (ou o legado `ui.reactExtractor.funcNames`). Para páginas e componentes Astro, adicione `.astro` a `ui.uiExtractor.extensions`. Para HTML puro, consulte [Aplicativos HTML puros](/pt-BR/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Passo 3: Traduzir strings da UI

```bash
ai-i18n-tools translate-ui
```

Lê `strings.json`, envia lotes para o provedor de LLM ativo para cada localidade de destino, grava arquivos JSON planos (`de.json`, `fr.json`, etc.) em `ui.flatOutputDir`. A seleção do modelo usa a cadeia da UI: `localeModels(locale)` → `uiModels` → `translationModels` (consulte [Provedores e modelos](/pt-BR/guide/providers-and-models#model-fallback-chain)).

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

Dependendo do idioma de destino, alguns modelos de tradução podem ter um desempenho significativamente melhor do que outros — por exemplo, os modelos qwen e z-ai tendem a produzir traduções de maior qualidade para idiomas asiáticos em comparação com muitos modelos de idiomas ocidentais. Para aproveitar isso, você pode usar entradas opcionais `providers.<active>.localeModels` para especificar uma lista priorizada de modelos para cada localidade BCP-47. Essas listas de modelos são tentadas **antes** das mais gerais `uiModels` e `translationModels` para aquela localidade específica. Isso permite que você personalize a seleção do modelo e obtenha melhor qualidade de tradução por idioma. As tags de localidade são correspondidas sem distinção entre maiúsculas e minúsculas (portanto, `zh-cn` e `ZH-CN` são equivalentes). Se nenhuma entrada personalizada corresponder a uma localidade, a ferramenta retorna à ordem padrão `uiModels` e `translationModels` para traduções de UI. O mesmo mecanismo `localeModels` também se aplica à tradução de documentos, JSON e SVG.

<a id="translations-database-stringsjson"></a>
### Banco de dados de traduções (`strings.json`)

Para cada entrada, `translate-ui` armazena o **ID do modelo do provedor ativo** que traduziu com sucesso cada localidade em um objeto `models` opcional (mesmas chaves de localidade que `translated`). As strings editadas no Painel de Tradução são marcadas com o valor sentinela `user-edited` em `models` para essa localidade. Os arquivos planos por localidade em `ui.flatOutputDir` permanecem **string de origem → tradução** apenas; eles não incluem `models` (para que os pacotes de tempo de execução permaneçam inalterados).

> **Nota:** As edições do Painel para strings da UI ficam em `strings.json`, não no cache de documentação SQLite. Execute `sync` ou `translate-ui` simples (sem sinalizador especial) para reescrever arquivos de localidade planos do catálogo — `--force-update` **não** é encaminhado para a etapa da UI. Evite `--force` em comandos da UI após edições manuais: ele retraduz cada entrada e pode sobrescrever suas linhas `user-edited`.

Em seguida, conecte o i18next em tempo de execução — [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exportando para XLIFF 2.0 (opcional)

Para entregar strings da interface a um fornecedor de tradução, TMS ou ferramenta CAT, exporte o catálogo como **XLIFF 2.0** (um arquivo por localidade de destino). Este comando é **somente leitura**: não modifica `strings.json` nem chama nenhuma API.

```bash
ai-i18n-tools export-ui-xliff
```

Por padrão, os arquivos são gravados ao lado de `ui.stringsJson`, com nomes como `strings.de.xliff`, `strings.pt-BR.xliff` (nome base do seu catálogo + localidade + `.xliff`). Use `-o` / `--output-dir` para gravar em outro local. Traduções existentes de `strings.json` aparecem em `<target>`; localidades ausentes usam `state="initial"` sem `<target>`, para que as ferramentas possam preenchê-las. Use `--untranslated-only` para exportar apenas unidades que ainda precisam de tradução para cada localidade (útil para lotes enviados a fornecedores). `--dry-run` exibe os caminhos sem gravar arquivos.
