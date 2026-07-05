<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# O que as ai-i18n-tools fazem (e não fazem) com os ativos

`translate-docs` traduz conteúdo markdown/MDX — incluindo texto alternativo de imagens —, mas não copia, gera ou emite arquivos raster. Se uma página traduzida precisar de uma captura de tela específica da localidade, você deverá colocar esse arquivo no caminho que o markdown traduzido referenciará.

`translate-svg` é o único comando que emite arquivos binários específicos da localidade. Ele lê arquivos SVG de origem, traduz elementos de texto (`<text>`, `<title>`, `<desc>`) e grava um SVG de saída por localidade. Arquivos raster (PNG, JPEG, WebP, GIF) nunca são gravados pela ferramenta.

---

<a id="design-for-i18n-from-the-start"></a>
# Projete para i18n desde o início

Escolher o layout de diretório correto antes que qualquer captura de tela exista é o fator mais importante para tornar os ativos específicos de localidade fáceis de gerenciar posteriormente. Adaptar o layout após dezenas de capturas de tela já terem sido confirmadas significa reestruturar caminhos e atualizar todas as referências em markdown.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown com `docsOutput.style = "flat"` (README, USER-GUIDE)

Armazene capturas de tela em um subdiretório codificado por localidade desde o início:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

Quando você adicionar i18n posteriormente, o seu script `take-screenshots` gravará em `images/screenshots/<locale>/` para cada localidade, e uma única regra `regexAdjustments` lidará com todas:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

A regex genérica `[^/]+` corresponde a qualquer nome de pasta de localidade — não codifique sua localidade de origem (por exemplo, `screenshots/en-GB/`), pois isso falha se `sourceLocale` for alterado.

Se você começar com caminhos que omitem o subdiretório de localidade (`images/screenshots/translate.png`), precisará reestruturar toda a árvore antes que a reescrita [pasta por localidade](/guide/images-and-screenshots/per-locale-folder) possa funcionar.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Sites de sistema de documentação (`docsOutput.style = "doc-system"`)

Use para sites de documentação estática que armazenam páginas traduzidas em uma árvore com prefixo de localidade — Docusaurus i18n, Astro Starlight e geradores personalizados que seguem a mesma estrutura. Arquivos sob `docsRoot` são gravados em:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Defina `docs[].docsOutput.docsRoot` para a raiz da sua fonte em inglês (por exemplo, `"docs"` ou `"src/content/docs"`). Ao definir `style: "doc-system"` diretamente, você também deve definir `localeSubpath` para o segmento de caminho que seu site usa entre `{locale}/` e o arquivo traduzido. Os aliases `"docusaurus"`, `"astro-starlight"` e `"vitepress"` são layouts `doc-system` predefinidos com valores `localeSubpath` padrão (consulte [Layouts de saída](/guide/documents/output-layouts)).

| Alias predefinido | `localeSubpath` padrão | Saída de exemplo |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (vazio) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (vazio) | `docs/de/guide/quick-start.md` |

O reescritor de links planos **não** é executado para `doc-system` (ao contrário de `"flat"`). `postProcessing.regexAdjustments` vê a URL original do Markdown de origem — normalmente um caminho absoluto ou relativo à raiz do site, como `/img/screenshots/en-GB/foo.png`.

O layout de **pasta por localidade** se aplica quando as capturas de tela residem em uma árvore de URL estática compartilhada: use uma pasta com código de localidade desde o primeiro dia e uma regra genérica `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (consulte [Config — doc-system](#config---docsoutputstyle--doc-system)).

As **capturas de tela colocalizadas** se aplicam quando os documentos traduzidos de cada localidade armazenam ativos ao lado do markdown (sem reescrita de URL). Seu script de captura de tela deve gravar PNGs em caminhos derivados de `{outputDir}`, `{locale}` e `{localeSubpath}` — o preset Docusaurus abaixo é o layout de referência.

<a id="docusaurus-preset"></a>
#### Preset Docusaurus

Dois hábitos na configuração do projeto eliminam toda a necessidade de expressões regulares posteriormente:

1. Crie um link simbólico `documentation/docs/assets → ../static/assets` antes de adicionar qualquer captura de tela. O webpack do Docusaurus segue links simbólicos por padrão, o que permite que os documentos de origem usem caminhos relativos que também serão usados pelos documentos traduzidos.

2. Coloque todos os ativos da documentação — PNGs e SVGs — em `static/assets/` (um único diretório). Não os separe entre `static/img/` (SVGs) e `static/assets/` (PNGs). Um local unificado significa que cada página de documento, em inglês ou traduzida, poderá referenciar o mesmo caminho relativo `../assets/name.ext`.

Referencie cada ativo com o caminho relativo estável `../assets/name.ext` no markdown de origem. Nunca use URLs absolutas `/img/` ou `/assets/` para ativos da documentação — essas URLs diferem entre a origem em inglês (servida de `static/`) e as localidades traduzidas (co-localizadas com os documentos traduzidos), o que obriga uma regra `regexAdjustments` a fazer a ponte entre elas.

Quando você adicionar i18n posteriormente, o script de captura de tela adota a divisão `getScreenshotDir` (consulte [Capturas de tela colocalizadas](/guide/images-and-screenshots/colocated-screenshots)) e `translate-svg` usa um `pathTemplate`. Não são necessários ajustes de regex.

> **Observação:** `resolve.symlinks = false` em um `next.config.ts` desativa a resolução de symlinks apenas para a compilação webpack do aplicativo Next.js. Isso não afeta a compilação do site de documentação Docusaurus, que usa uma instância webpack separada.

<a id="astrostarlight-preset"></a>
#### Preset Astro/Starlight

Equivalente a `docsOutput.style = "doc-system"` com `localeSubpath: ""` — páginas traduzidas ficam diretamente sob `{outputDir}/{locale}/`.

Armazene capturas de tela em um caminho codificado por localidade desde o início:

```
public/img/screenshots/en-GB/screenshot.png
```

Use a expressão regular genérica em `regexAdjustments`:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Aplicativos web (Next.js, Vite, etc.) com ativos SVG

Mantenha os arquivos-fonte SVG em um diretório dedicado (por exemplo, `images/` ou `src/assets/`) e configure `svg.outputDir` para um diretório de serviço separado (por exemplo, `public/assets/`). Nunca misture SVGs de origem e arquivos de saída `translate-svg` na mesma pasta — torna-se impossível identificar quais arquivos são gerados.

Projete os SVGs para serem traduzíveis desde o início: use elementos `<text>`, `<title>` e `<desc>` para todos os rótulos legíveis por humanos. Evite incorporar texto como dados de caminho.

Habilite `forceLowercase: true` no bloco de configuração `svg` para evitar incompatibilidades de diferenciação de maiúsculas e minúsculas entre sistemas de arquivos e CDNs.

---

<a id="decision-guide"></a>
# Guia de decisão

```
Is the asset an SVG with translatable text or labels?
  Yes → Web app SVG or Colocated SVG
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Colocated screenshots (rasters) + Colocated SVG (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Shared image
    Otherwise → Per-locale folder
```

Os layouts SVG são abordados no guia [Tradução SVG](/guide/svg-translation/).

| Layout | Tipo de ativo               | Tipo de site                                                              | Mecanismo da ferramenta                                      |
|--------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| [Imagem compartilhada](/guide/images-and-screenshots/shared-image) | Raster (compartilhado)      | Documentos `docsOutput.style = "flat"`                                     | Reescritor de link por arquivo; geralmente sem regex         |
| [Pasta por localidade](/guide/images-and-screenshots/per-locale-folder) | Raster (por localidade)     | `"flat"` ou `"doc-system"` (incluindo `"docusaurus"`, `"astro-starlight"`)   | Troca de segmento de localidade `regexAdjustments`                    |
| [Capturas de tela colocalizadas](/guide/images-and-screenshots/colocated-screenshots) | Raster (colocalizado)       | `"doc-system"` com ativos colocalizados (preset Docusaurus)                  | O script de captura de tela coloca os arquivos; sem regex    |
| [SVG de aplicativo web](/guide/svg-translation/translated-svg-web-app) | SVG (traduzido)             | Aplicativo web                                                            | `translate-svg` com `svg.style = "flat"`                                      |
| [SVG colocalizado](/guide/svg-translation/translated-svg-colocated) | SVG (traduzido, colocalizado) | `"doc-system"` com ativos colocalizados (preset Docusaurus)                  | `translate-svg` com `svg.style = "nested"` + `pathTemplate`                          |
