<a id="per-locale-folder-url-rewriting"></a>
# Pasta por localidade (reescrita de URL)

Use para README/USER-GUIDE com `docsOutput.style = "flat"`, e para sites de sistema de documentação (`docsOutput.style = "doc-system"` ou aliases `"docusaurus"` / `"astro-starlight"`) e para `"vitepress"` / outros presets de sistema de documentação que servem capturas de tela de uma árvore de URL estática compartilhada. Detalhes de reescrita de link para VitePress: [Reescrita de link — VitePress](/pt-BR/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

<a id="directory-layout"></a>
### Estrutura de diretórios

<details>
<summary>Exemplo de árvore de diretórios de capturas de tela por localidade</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

O markdown de origem referencia o diretório da localidade de origem:

```markdown
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Contrato do script de captura de tela

O script `take-screenshots` deve gravar arquivos para cada localidade — não apenas para a localidade de origem. O comando `translate-docs` reescreve caminhos, mas não cria arquivos. Um auxiliar típico:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Veja um exemplo simples de `bash` no [script de captura de tela em examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh), ou um exemplo mais complexo em [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) do projeto [duplistatus](https://github.com/wsj-br/duplistatus) (também usado em produção por [Transrewrt](https://github.com/wsj-br/transrewrt)).

> **Nota:** As quatro subseções abaixo compartilham a mesma troca de segmento de localidade `regexAdjustments` (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Apenas o layout de saída e se o reescritor de link plano é executado primeiro diferem — pule para a subseção que corresponde ao seu `docsOutput.style`.
>
> **Nota:** `regexAdjustments` é executado no corpo completo do markdown traduzido, incluindo blocos de código cercados. Se uma página de documento incorpora um exemplo de configuração que contém um caminho correspondente (por exemplo, `screenshots/en-GB/`), esse trecho também será reescrito na saída traduzida. Prefira o formato genérico `screenshots/[^/]+/` em exemplos reutilizáveis.

<a id="config---docsoutputstyle--flat"></a>
### Configuração - `docsOutput.style = "flat"`

O reescritor de links planos executa primeiro quando `docsOutput.style = "flat"` e acrescenta um prefixo de profundidade às URLs que não são de markdown. Para um `README.md` na raiz do repositório com `outputDir: "translated-docs/"`, ele adiciona `../`:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

A regra `regexAdjustments` substitui então o segmento de localidade dentro dessa URL já prefixada:

<details>
<summary>Exemplo de regexAdjustments para layout plano</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Resultado: `../images/screenshots/de/translate.png` — caminho relativo correto de `translated-docs/README.de.md` de volta à raiz do repositório.

A etapa `postProcessing` é executada após o reescritor de link plano. Escreva regexes `search` que correspondam ao segmento de localidade em qualquer lugar dentro da URL já prefixada — não há necessidade de incluir o prefixo `../` na regex.

Exemplo de implementação (produção): [Transrewrt](https://github.com/wsj-br/transrewrt) — URLs de captura de tela em [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), reescrita de localidade em [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), script de captura baseado em [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) de duplistatus (veja o [contrato do script de captura de tela](#screenshot-script-contract) acima).

Exemplo de implementação (configuração de demonstração): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — segundo bloco `docs[]` em [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); script auxiliar [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Configuração - `docsOutput.style = "doc-system"`

Mesma abordagem de pasta por localidade para qualquer site de sistema de documentação que referencia capturas de tela por meio de um prefixo de URL estático compartilhado. O reescritor de link plano não é executado; `postProcessing` reescreve o segmento de localidade na URL markdown original.

<details>
<summary>Exemplo de regexAdjustments para layout do sistema de documentação</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Defina `localeSubpath` para corresponder ao layout do seu gerador entre `{locale}/` e o arquivo traduzido, ou use um alias pré-definido (`"docusaurus"`, `"astro-starlight"`) em vez de `"doc-system"` quando os padrões forem adequados. O markdown de origem normalmente incorpora a localidade de origem na URL:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Forneça arquivos PNG correspondentes no mesmo caminho para cada local de destino (por exemplo, `static/img/screenshots/de/screenshot.png`). Prefira `screenshots/[^/]+/` a codificar `screenshots/en-GB/` diretamente, para que a regra permaneça válida após uma mudança em `sourceLocale`.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Predefinição - `docsOutput.style = "docusaurus"`

Igual a `"doc-system"` com `localeSubpath = "docusaurus-plugin-content-docs/current"` padrão. O reescritor de links simples não é executado. `postProcessing` vê a URL markdown original. Páginas em inglês normalmente usam um caminho absoluto com a localidade de origem:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Exemplo de regexAdjustments para predefinição Docusaurus</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Forneça arquivos PNG correspondentes em `docs-site/static/img/screenshots/<locale>/screenshot.png`. Para configurações independentes da localidade de origem, prefira `screenshots/[^/]+/` em vez de `screenshots/en-GB/`.

Exemplo de implementação: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) com [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Predefinição - `docsOutput.style = "astro-starlight"`

O mesmo que `"doc-system"` com `localeSubpath: ""` — páginas traduzidas ficam diretamente sob `{outputDir}/{locale}/`. Mesma abordagem de pasta por localidade que a configuração genérica do sistema de documentação acima. O markdown de origem usa `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Exemplo de regexAdjustments para predefinição Astro Starlight</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Envie PNGs em `public/img/screenshots/<locale>/screenshot.png`. O placeholder `${translatedLocale}` usa sua string de localidade de configuração (por exemplo, `pt-BR`). O preset `astro-starlight` converte para minúsculas os **caminhos de saída** da localidade por padrão (`pt-br/`), mas as pastas de ativos estáticos em `public/img/screenshots/` devem corresponder ao segmento de localidade escrito nas URLs do markdown — mantenha os diretórios de captura de tela alinhados com `${translatedLocale}`, não necessariamente com o uso de maiúsculas e minúsculas da rota Astro.

Exemplo de implementação: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) e [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
