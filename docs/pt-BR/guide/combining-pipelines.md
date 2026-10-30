<a id="combining-pipelines"></a>
# Combinando pipelines

Leia isto quando um projeto precisar de mais de um tipo de tradução: strings da interface do usuário (UI) do aplicativo mais a documentação, um site de documentação mais um README na raiz ou documentos mais ilustrações SVG. Se você traduz apenas um tipo de conteúdo, o [Início rápido](/pt-BR/guide/quick-start) é suficiente.

Um aplicativo mais o README do seu repositório é o híbrido comum. Faça o scaffold com `init` (o modelo `ui-markdown`) ou `init -t <template> --with-readme` e, depois, siga [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme). A configuração mista mais adiante nesta página é a mesma ideia ao lado de um site de documentação.

Este repositório é esse tipo de projeto. O [`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) traduz as strings da interface do usuário (UI) da CLI e do Painel de Tradução e este site VitePress em um único `sync`. O bloco de UI abrange `src/cli`, `src/server`, `src/dashboard-app` e `src/api` e grava JSON simples em `src/i18n/locales`. O bloco VitePress usa `docsOutput.style: "vitepress"` para `docs/` e o catálogo de temas. O mesmo arquivo também grava traduções de `README.md` em `translated-docs/`. Configuração do site: [VitePress](/pt-BR/guide/integrations/vitepress).

<a id="what-sync-runs"></a>
## O que a sincronização executa

`ai-i18n-tools sync` executa as etapas ativadas nesta ordem:

1. `extract`, depois `translate-ui`, quando `features.translateUIStrings` está ativado.
2. `translate-svg`, quando `features.translateSVG` está ativado e um bloco `svg` existe.
3. `translate-docs`, quando `features.translateDocs` está ativado ou qualquer `docs[].docusaurusCatalogDir` está definido.
4. `translate-json`, quando `features.translateJson` está ativado e `json[]` tem entradas.

Pule partes com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`. As etapas de documentação e `json[]` aceitam `--dry-run`, `-p` / `--path`, `--force`, `--force-update` e `--check-cache`. As flags exclusivas de documentação são ignoradas quando `--no-docs` está definido. O JSON usa as mesmas flags de cache quando `--no-json` não está definido.

Prefira `sync` em vez de encadear os comandos individuais manualmente. As flags de ordem, extração e localidade são fáceis de errar quando executadas manualmente.

<a id="ui-strings-and-documents-together"></a>
## Strings de UI e documentos juntos

Ative ambos os recursos em uma única configuração para executar strings de UI e documentos em uma única passagem:

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

<a id="fewer-locales-for-documents"></a>
## Menos localidades para documentos

Use `docs[].targetLocales` em um bloco para traduzir os arquivos desse bloco para um subconjunto menor que o da UI. As localidades de documentação efetivas são a união entre os blocos:

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

<a id="mixed-documentation-config"></a>
## Configuração de documentação mista

Você pode combinar vários pipelines de documentação na mesma configuração adicionando mais de uma entrada em `docs`. Esta é uma configuração comum quando um projeto tem um site Docusaurus (`docsOutput.style = "docusaurus"`) mais arquivos markdown no nível raiz, como um README de repositório com `docsOutput.style = "flat"`, que devem ser traduzidos com nomes de arquivo com sufixo de localidade.

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

- As strings de UI são extraídas e traduzidas de `src/` para `public/locales/`.
- O primeiro bloco de documentação traduz o markdown de `docs-site/docs/` para `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentação localizadas).
- Com `docs[].docusaurusCatalogDir` definido e `features.translateDocs` ativado, esse mesmo bloco também traduz o JSON do shell do Docusaurus em `docs-site/i18n/en/` para cada pasta de localidade de destino: barra de navegação, rodapé e catálogos de temas/plugins, mas não o corpo do MDX.
- O segundo bloco de documentação traduz `README.md` para arquivos com sufixo de localidade em `translated-docs/` (`docsOutput.style = "flat"`).
- Todos os blocos de docs compartilham `cacheDir`, portanto segmentos inalterados são reutilizados entre execuções para reduzir chamadas à API e custos.

A seguir: volte para o [Início rápido](/pt-BR/guide/quick-start) ou consulte a [Configuração](/pt-BR/reference/configuration) para ver o esquema completo.
