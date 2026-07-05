<a id="translated-svg-with-svgstyle--flat"></a>
# SVG traduzido com `svg.style = "flat"`

Use quando um aplicativo web incorporar ilustrações ou diagramas SVG específicos do idioma e fizer referência a eles pelo código de idioma em tempo de execução.

<a id="config"></a>
### Configuração

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` lê todos os `.svg` dentro de `images/` e gera um arquivo por idioma:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### Referência do aplicativo

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Recomendação de estrutura de origem

Mantenha os SVGs de origem separados do diretório de saída. Com `sourcePath: "images"` e `outputDir: "public/assets"`, os dois diretórios são distintos. Nunca defina ambos como o mesmo diretório.

<a id="implementation-example"></a>
### Exemplo de implementação

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — bloco `svg` em [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); fonte [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); saídas por localidade em [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) (por exemplo, `translation_demo_svg.de.svg`); URL de tempo de execução em [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
