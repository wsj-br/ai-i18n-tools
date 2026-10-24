<a id="quick-start"></a>
# Início rápido

O modelo padrão `init` (`ui-markdown`) habilita apenas a extração e tradução de **UI**. Os modelos `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` e `ui-fumadocs` habilitam a tradução de **documentos** (`translate-docs`); o `ui-vitepress` também cria a estrutura de `docsOutput.vitepressThemeCatalog` para strings de tema do VitePress, o `ui-nextra` cria a estrutura de `docs[].nextraDictionaryPath` para o dicionário de tema do Nextra (a barra lateral `_meta.ts` é coletada automaticamente) e o `ui-fumadocs` cria a estrutura de `docsOutput.fumadocsUiCatalog` para substituições de UI do Fumadocs (a barra lateral `meta.json` é coletada automaticamente). O modelo `ui-astro-website` cria a estrutura de extração de **UI** para aplicativos Astro simples (incluindo arquivos `.astro`); adicione um bloco `docs[]` (consulte [Páginas do site Astro (parse-and-replace)](/pt-BR/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) quando você também desejar `translate-docs` para o HTML da página `.astro`. A referência [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) usa **ambos** os pipelines. Os modelos Python são `ui-python`, `ui-python-gettext`, `ui-python-flask` e `ui-python-django` — consulte [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python). Use `sync` quando desejar um comando que execute a extração, tradução de UI, tradução opcional de arquivos SVG e tradução de documentação de acordo com sua configuração.

Projetos Python podem usar o executável independente e ignorar a instalação do Node.js. Etapas de download: [Instalação — Executáveis independentes](/pt-BR/guide/installation#standalone-executables).

<a id="runnable-examples"></a>
### Exemplos executáveis

Projetos executáveis e fixtures residem em [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Consulte o catálogo de [Exemplos](/pt-BR/examples) para obter a lista completa, comandos de cópia e quais pastas usam `pnpm` em vez de um ambiente virtual Python.

**Execute um exemplo Node.js de forma independente** (sem clonar todo o monorepo):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Substitua `console-app` por qualquer outro nome de pasta de exemplo do Node.js. Cada um desses exemplos declara um intervalo de versão (caret range) publicado de `ai-i18n-tools` que corresponde à versão atual do pacote e instala a CLI a partir do npm. Exemplos em Python não possuem `package.json`. Copie-os com o mesmo comando `degit` ou use `ai-i18n-tools-python-examples.zip` do GitHub Release e, em seguida, siga [Exemplos — Python](/pt-BR/examples#python-examples).

**Do repositório completo ai-i18n-tools** — se você clonou o repositório inteiro (não apenas uma pasta de exemplo com degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

A entrada do espaço de trabalho [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) vincula os exemplos do espaço de trabalho ao seu checkout local automaticamente. Os fixtures autônomos (`multi-provider`, `test-markdown`) não são pacotes de espaço de trabalho — de sua pasta, use `node ../../bin/ai-i18n-tools.mjs …`. Para executar a CLI da **raiz do repositório** (documentos/i18n deste próprio pacote), use `ai-i18n-tools` puro após `direnv allow`, ou `pnpm i18n:sync` / `node bin/ai-i18n-tools.mjs …` — consulte [Instalação — Monorepo clonado](/pt-BR/guide/installation#cloned-monorepo) e o [Guia de Desenvolvimento](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Provedor e chave de API (obrigatório para tradução)

Todo comando que chama um LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` e `sync` — precisa **de ambos**:

1. **Pelo menos um provedor** em `ai-i18n-tools.config.json`: um bloco `providers.<name>` com `translationModels` e uma chave de nível superior `provider` quando mais de um provedor estiver configurado. `init -P <provider>` gera esse preset; adicione provedores ou ajuste listas de modelos — consulte [Provedores e modelos de LLM](/pt-BR/guide/providers-and-models).
2. **A chave de API correspondente** em seu ambiente ou em um arquivo `.env` na raiz do projeto. Cada preset integrado lê uma variável de ambiente nomeada da [tabela de presets](/pt-BR/guide/providers-and-models#built-in-providers) (por exemplo, `OPENROUTER_API_KEY` com `-P openrouter`, ou `OPENAI_API_KEY` com `-P openai`); **Ollama** é a exceção — ele usa um endpoint local e não precisa de chave. Consulte [Instalação — defina sua chave de API do provedor](/pt-BR/guide/installation#using-the-cli).

`extract`, `status` e outros comandos que não chamam o LLM não precisam de um provedor ou chave de API.

<a id="core-cli-commands"></a>
### Comandos principais da CLI

Execute a partir da **raiz do seu projeto** após instalar `ai-i18n-tools` e [configurar seu shell para o comando básico](/pt-BR/guide/installation#using-the-cli). Os exemplos abaixo usam `ai-i18n-tools` diretamente.

```bash
# Set the API key for the provider you pass to init (see preset table; skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# export OPENAI_API_KEY=sk-your-key-here
# export CHEAPERINFERENCE_API_KEY=your-key-here

# UI strings (ui-markdown template enables extract + translate-ui)
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models          # optional: ranked shortlist
ai-i18n-tools suggest-models --apply  # replace translationModels
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight -P cheaperinference
# VitePress docs: ai-i18n-tools init -t ui-vitepress -P anthropic
# Nextra docs: ai-i18n-tools init -t ui-nextra -P gemini
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs -P groq
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website -P ollama
# Plain HTML catalog: ai-i18n-tools init -t ui-plain-html -P openrouter
# Plain HTML documents: ai-i18n-tools init -t docs-plain-html -P openai
# Python flat JSON: ai-i18n-tools init -t ui-python -P cheaperinference
# Python JSON + gettext: ai-i18n-tools init -t ui-python-gettext -P anthropic
# Django catalogs: ai-i18n-tools init -t ui-python-django -P gemini
# Flask / Jinja gettext: ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles -P ollama
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

A lista de modelos escrita por `init` é um ponto de partida. `suggest-models` classifica os modelos de chat do provedor ativo. `suggest-models --apply` substitui `translationModels` e deixa `uiModels` e `localeModels` inalterados. A mesma classificação está na guia [Modelos](/pt-BR/guide/translation-dashboard/models). Referência de comando: [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models).

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados do `package.json`

Com o pacote instalado localmente, os scripts `package.json` resolvem `ai-i18n-tools` de `node_modules/.bin` sem configuração extra do shell. Para shells interativos, configure o PATH primeiro — consulte [Usando a CLI](/pt-BR/guide/installation#using-the-cli).

**Prefira** `sync` para qualquer tarefa que antes era “execute `translate-ui`, depois `translate-svg`, depois `translate-docs`, depois `translate-json`”: `ai-i18n-tools sync` executa **extract** (quando habilitado), **translate-ui**, opcional **translate-svg**, **translate-docs** e opcional **translate-json** — na ordem correta e com flags compartilhadas — de acordo com sua configuração. Encadear essas etapas manualmente é propenso a erros (ordem, extração, flags de localidade). Use `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs` e `i18n:translate:json` apenas quando precisar de uma etapa **única** isoladamente.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Dica:** Passe `-L <code>` ou defina `AI_I18N_LANG` se você quiser a saída da CLI e o painel em outro idioma — consulte [Idioma da IU da ferramenta](/pt-BR/guide/tool-ui-language).

<a id="combined-sync"></a>
## Sincronização combinada

Habilite todos os recursos em uma única configuração para executar strings de interface do usuário e documentos juntos:

<details>
<summary>Exemplo de configuração combinada de UI + docs</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

Os blocos de UI incluem seus catálogos `strings.json` como dicas de glossário para a documentação por padrão (`uiGlossary`). `glossary.userGlossary` adiciona substituições CSV para termos do produto. Consulte o [Glossário](/pt-BR/guide/glossary).

Execute `ai-i18n-tools sync` para executar um pipeline: quando `features.translateUIStrings` estiver habilitado, **extraia** e depois **traduza** strings da UI; opcionalmente **traduza SVG** (bloco `features.translateSVG` + `svg`); **traduza a documentação** (`docs[]` conforme configurado); depois, opcionalmente, **traduza JSON** (`features.translateJson` + `json[]`). Pule partes com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. As etapas de documentação e `json[]` aceitam `--dry-run`, `-p` / `--path`, `--force`, `--force-update` e `--check-cache` (flags somente de documentação são ignoradas quando `--no-docs`; JSON usa as mesmas flags de cache quando `--no-json` não está definido).

Use `docs[].targetLocales` em um bloco para traduzir os arquivos desse bloco para um **subconjunto menor** do que a interface (as localidades efetivas da documentação são a **união** entre blocos):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### Configuração de documentação mista (`docsOutput.style = "docusaurus"` + `"flat"`)

Você pode combinar múltiplos pipelines de documentação na mesma configuração adicionando mais de uma entrada em `docs`. Essa é uma configuração comum quando um projeto possui um site Docusaurus (`docsOutput.style = "docusaurus"`) além de arquivos markdown no nível raiz (por exemplo, um README de repositório com `docsOutput.style = "flat"`) que devem ser traduzidos com nomes de arquivo sufixados pela localidade.

<details>
<summary>Exemplo de configuração mista Docusaurus + README plana</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

Como isso é executado com `ai-i18n-tools sync`:

- Strings de interface são extraídas/traduzidas de `src/` para `public/locales/`.
- O primeiro bloco de documentação traduz **markdown** de `docs-site/docs/` para `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentação localizadas).
- Com `docs[].docusaurusCatalogDir` definido e `features.translateDocs` habilitado, esse mesmo bloco também traduz o **JSON do shell do Docusaurus** em `docs-site/i18n/en/` para cada pasta de localidade de destino — navbar, rodapé e catálogos de tema/plugin, não o conteúdo do corpo MDX.
- O segundo bloco de documentação traduz `README.md` para arquivos com sufixo de localidade em `translated-docs/` (`docsOutput.style = "flat"`).
- Todos os blocos de docs compartilham `cacheDir`, portanto segmentos inalterados são reutilizados entre execuções para reduzir chamadas à API e custos.
