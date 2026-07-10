<a id="quick-start"></a>
# Início rápido

O modelo padrão `init` (`ui-markdown`) permite apenas a extração e tradução da **interface do usuário**. Os modelos `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` e `ui-fumadocs` permitem a tradução de **documentos** (`translate-docs`); `ui-vitepress` também estrutura `docsOutput.vitepressThemeCatalog` para strings de tema VitePress, `ui-nextra` estrutura `docs[].nextraDictionaryPath` para o dicionário de tema Nextra (`_meta.ts` da barra lateral é coletado automaticamente), e `ui-fumadocs` estrutura `docsOutput.fumadocsUiCatalog` para substituições de UI do Fumadocs (`meta.json` da barra lateral é coletado automaticamente). O modelo `ui-astro-website` estrutura a extração da **interface do usuário** para aplicativos Astro simples (incluindo arquivos `.astro`); adicione um bloco `docs[]` (consulte [Páginas do site Astro (analisar e substituir)](/pt-BR/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) quando você também quiser `translate-docs` para HTML de página `.astro`. A referência [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) usa **ambos** os pipelines. Use `sync` quando quiser um comando que execute a extração, tradução da interface do usuário, tradução opcional de arquivos SVG e tradução de documentação de acordo com sua configuração.

<a id="runnable-examples"></a>
### Exemplos executáveis

Nove projetos e "fixtures" executáveis estão em [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Consulte o catálogo [Exemplos](/pt-BR/examples) (aplicativo de console, Next.js + Docusaurus, site Astro, documentos Astro Starlight, documentos VitePress, documentos Nextra, documentos Fumadocs, comparação de vários provedores, teste de estresse de markdown).

**Execute um exemplo de forma independente** (sem clonar o monorepo inteiro):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Substitua `console-app` por qualquer nome de pasta de exemplo. Cada exemplo declara `"ai-i18n-tools": "^1.7.2"` e instala a CLI do npm. Os READMEs de cada exemplo incluem o mesmo trecho com o nome da pasta preenchido.

**Do repositório completo ai-i18n-tools** — se você clonou o repositório inteiro (não apenas uma pasta de exemplo com degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: pnpm exec ai-i18n-tools sync
```

A entrada do espaço de trabalho [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) vincula exemplos de espaço de trabalho ao seu checkout local automaticamente. Os "fixtures" autônomos (`multi-provider`, `test-markdown`) não são pacotes de espaço de trabalho — de sua pasta, use `node ../../bin/ai-i18n-tools.mjs …`. Para executar a CLI a partir da **raiz do repositório** (documentos/i18n deste pacote), use `pnpm i18n:sync` ou `node bin/ai-i18n-tools.mjs …` — consulte [Instalação — Monorepo clonado](/pt-BR/guide/installation#cloned-monorepo) e o [Guia de Desenvolvimento](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Provedor e chave de API (obrigatório para tradução)

Todo comando que chama um LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` e `sync` — precisa **de ambos**:

1. **Pelo menos um provedor** em `ai-i18n-tools.config.json`: um bloco `providers.<name>` com `translationModels`, e uma chave `provider` de nível superior quando mais de um provedor é configurado. `init` configura o OpenRouter por padrão; altere predefinições, adicione provedores ou ajuste listas de modelos — consulte [Provedores e modelos LLM](/pt-BR/guide/providers-and-models).
2. **A chave de API correspondente** em seu ambiente ou em um arquivo `.env` na raiz do projeto. Cada predefinição integrada lê uma variável de ambiente nomeada (por exemplo, `OPENROUTER_API_KEY`); **Ollama** é a exceção — ele usa um endpoint local e não precisa de chave. Consulte [Instalação — defina sua chave de API do provedor](/pt-BR/guide/installation#using-the-cli) e a [tabela de variáveis de ambiente predefinidas](/pt-BR/guide/providers-and-models#built-in-providers).

`extract`, `status` e outros comandos que não chamam o LLM não precisam de um provedor ou chave de API.

<a id="core-cli-commands"></a>
### Comandos principais da CLI

Execute a partir da **raiz do seu projeto** após instalar `ai-i18n-tools` (consulte [Usando a CLI](/pt-BR/guide/installation#using-the-cli) para scripts `npx`, `pnpm exec` e `package.json`). Os exemplos abaixo usam o nome do comando puro; usuários do npm podem prefixar com `npx`, usuários do pnpm com `pnpm exec`.

```bash
# Set API key for your active provider (skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here   # or your provider's env var

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init    # writes config including provider block; edit provider/models if needed
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight
# VitePress docs: ai-i18n-tools init -t ui-vitepress
# Nextra docs: ai-i18n-tools init -t ui-nextra
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados do `package.json`

Com o pacote instalado localmente, você pode usar os comandos da CLI diretamente em scripts (não é necessário `npx`).

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
    "uiGlossary": "src/locales/strings.json",
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

`glossary.uiGlossary` direciona a tradução de documentos ao mesmo catálogo `strings.json` da interface, mantendo a terminologia consistente; `glossary.userGlossary` adiciona substituições CSV para termos do produto.

Execute `ai-i18n-tools sync` para executar um pipeline: quando `features.translateUIStrings` estiver habilitado, **extraia** e depois **traduza** strings da UI; opcionalmente **traduza SVG** (bloco `features.translateSVG` + `svg`); **traduza a documentação** (`docs[]` conforme configurado); então opcionalmente **traduza-json** (`features.translateJson` + `json[]`). Pule partes com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. As etapas de documentos e `json[]` aceitam `--dry-run`, `-p` / `--path`, `--force` e `--force-update` (sinalizadores somente de documentos são ignorados quando `--no-docs`; JSON usa os mesmos sinalizadores de cache quando `--no-json` não está definido).

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
