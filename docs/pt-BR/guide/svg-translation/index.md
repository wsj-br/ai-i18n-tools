<a id="svg-translation"></a>
# Tradução de SVG

Projetado para **ilustrações e diagramas SVG** que contêm rótulos legíveis por humanos. O comando `translate-svg` lê arquivos `.svg` de origem, extrai texto dos elementos `<text>`, `<title>` e `<desc>`, traduz essas strings por meio do provedor LLM ativo e grava **um SVG de saída por localidade de destino**.

Este é o único pipeline que emite arquivos SVG **binários** específicos da localidade. O `translate-docs` traduz o texto alternativo do markdown e as referências de link, mas não modifica nem copia os ativos SVG. Quando uma página precisa de um diagrama com rótulos traduzidos, ative o `features.translateSVG` e configure o bloco `svg` de nível superior.

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

O `translate-svg` resolve modelos **por localidade de destino**: primeiro o `localeModels(locale)`, quando configurado, e depois o `translationModels`. A execução de cada SVG por localidade utiliza sua própria cadeia de fallback — útil quando rótulos de diagramas em localidades CJK precisam de um modelo ajustado para o script (por exemplo, `ja`). Consulte [Provedores e modelos](/guide/providers-and-models#model-fallback-chain).

A tradução SVG usa o mesmo cache SQLite que `translate-docs` e `translate-json` (`cacheDir`). Segmentos de texto já traduzidos são servidos do cache; apenas texto de origem novo ou alterado é enviado para o LLM.

<a id="when-to-use-svg-translation"></a>
### Quando usar a tradução SVG

Use `translate-svg` quando:

- Um SVG contém rótulos, títulos ou descrições visíveis que devem mudar por localidade.
- Um aplicativo da web carrega arquivos de diagrama específicos da localidade em tempo de execução (por exemplo, `dashboard.de.svg`).
- Um site de sistema de documentação (Docusaurus, Astro Starlight, VitePress) coloca SVGs traduzidos ao lado de markdown traduzido.

**Não** use `translate-svg` para:

- SVGs decorativos sem texto traduzível (ícones, logotipos, planos de fundo).
- Capturas de tela raster (PNG, JPEG, WebP) — estas são tratadas por meio de [Imagens e capturas de tela](/guide/images-and-screenshots/).
- Texto incorporado em dados de caminho em vez de elementos `<text>` — o extrator não consegue ler contornos de caminho.

<a id="design-for-i18n-from-the-start"></a>
### Projete para i18n desde o início

SVGs são mais fáceis de traduzir quando os rótulos são elementos de texto reais desde o primeiro dia:

- Coloque texto legível por humanos em `<text>`, `<title>` e `<desc>`.
- Evite converter rótulos em caminhos em sua ferramenta de design — os dados de caminho são opacos para o tradutor.
- Mantenha os **SVGs de origem** em um diretório dedicado separado de `svg.outputDir`. Misturar arquivos de origem e arquivos de localidade gerados torna impossível saber quais arquivos são seguros para editar ou regenerar.

Para aplicativos da web, ative `forceLowercase: true` quando seu design usar rótulos em minúsculas — isso evita incompatibilidades de sensibilidade a maiúsculas e minúsculas em sistemas de arquivos e CDNs.

<a id="output-layouts"></a>
### Layouts de saída

`translate-svg` suporta duas formas de saída comuns. Escolha com base em como seu aplicativo ou site de documentação referencia arquivos SVG em tempo de execução.

| Layout | `svg.style` | Melhor para | Guia filho |
|--------|-------------|----------|-------------|
| **Plano (aplicativo web)** | `"flat"` | Next.js, Vite e outros aplicativos que incorporam SVGs por nome de arquivo codificado por localidade | [Aplicativo web (SVG plano)](/guide/svg-translation/translated-svg-web-app) |
| **Colocado (sistema de documentação)** | `"nested"` + `pathTemplate` | Docusaurus e outros sites de sistema de documentação onde os ativos traduzidos ficam ao lado das páginas traduzidas | [SVG colocado](/guide/svg-translation/translated-svg-colocated) |

O **layout plano** grava arquivos como `public/assets/diagram.de.svg` ao lado de `diagram.en-GB.svg`. Seu aplicativo os referencia com um sufixo de localidade:

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

O **layout colocado** grava o SVG de cada localidade na árvore de conteúdo dessa localidade (por exemplo, `i18n/de/.../assets/diagram.svg`). O markdown de origem e traduzido usa o mesmo caminho relativo (`../assets/diagram.svg`) — nenhuma regra `regexAdjustments` é necessária.

Consulte o [guia de decisão de Imagens e capturas de tela](/guide/images-and-screenshots/#decision-guide) para saber como os layouts SVG se encaixam nas estratégias de captura de tela raster.

<a id="step-1-enable-and-configure"></a>
### Etapa 1: Habilitar e configurar

Habilite o recurso e aponte `translate-svg` para seus arquivos de origem e raiz de saída:

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Campos-chave `svg`:

- `sourcePath` — um ou mais diretórios ou padrões glob (por exemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Escaneado recursivamente a partir da raiz do projeto.
- `outputDir` — diretório raiz para a saída SVG traduzida.
- `style` — `"flat"` ou `"nested"` quando você não está usando um `pathTemplate` personalizado.
- `pathTemplate` — caminho de saída personalizado opcional com placeholders `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}` e outros (necessário para layouts de sistema de documentos colocados).
- `forceLowercase` — texto traduzido em letras minúsculas na remontagem.

Referência completa do campo: [Configuração — `svg`](/reference/configuration#svg).

<a id="step-2-translate"></a>
### Passo 2: Traduzir

```bash
npx ai-i18n-tools translate-svg
```

Traduzir um único local:

```bash
npx ai-i18n-tools translate-svg --locale de
```

Visualizar sem gravar arquivos:

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync` executa a etapa SVG automaticamente quando `features.translateSVG` e `svg` estão ambos definidos (pule com `--no-svg`). As flags compartilhadas incluem `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency` e `--force` / `--force-update`.

<a id="troubleshooting"></a>
### Solução de problemas

Problemas comuns de SVG — diretórios de origem/saída mistos, URLs estáticas absolutas no Docusaurus e erros de layout de caminho — são abordados em [Solução de problemas de SVG](/guide/svg-translation/troubleshooting). Para ativos raster e reescrita de links, consulte [Solução de problemas de imagens e capturas de tela](/guide/images-and-screenshots/troubleshooting).
