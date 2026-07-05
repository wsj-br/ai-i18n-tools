<a id="colocated-raster-doc-system"></a>
# Raster Colocado (`doc-system`)

Use quando um site `doc-system` colocaliza ativos específicos do idioma ao lado do markdown traduzido — nenhuma reescrita de URL é necessária. A predefinição do Docusaurus (`docsOutput.style = "docusaurus"`) é a implementação de referência; outros geradores que usam `"doc-system"` com um `localeSubpath` personalizado seguem a mesma ideia: ativos em inglês ficam em um caminho de idioma de origem, ativos traduzidos ficam em `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout"></a>
### Estrutura de diretórios

<details>
<summary>Exemplo de árvore de diretórios de ativos colocados juntos (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

Todos os documentos em todas as localidades usam o mesmo caminho relativo:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

Para a localidade em inglês (`en-GB`), `../assets/` é resolvido através do link simbólico para `static/assets/`. Para localidades traduzidas, é resolvido diretamente para o próprio diretório `current/assets/` da localidade.

<a id="screenshot-script-contract"></a>
### Contrato do script de captura de tela

O script deve gravar os arquivos PNG no diretório correto para cada localidade. A função `getScreenshotDir` codifica a divisão:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Veja uma implementação real em [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) do repositório [duplistatus](https://github.com/wsj-br/duplistatus).

<a id="config"></a>
### Configuração

Nenhuma regra `regexAdjustments` necessária para arquivos raster. `translate-docs` traduz o texto alternativo no markdown, mas a URL permanece inalterada:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Se o projeto também usa SVGs traduzidos, a [tradução de SVG colocalizada](/guide/svg-translation/translated-svg-colocated) os trata e eles são colocados junto com os PNGs em `current/assets/` sem regex adicional.

<a id="prerequisites"></a>
### Pré-requisitos

- O link simbólico `docs/assets` deve existir: `ln -s ../static/assets documentation/docs/assets`
- O webpack do Docusaurus segue links simbólicos por padrão (`resolve.symlinks` tem como padrão `true` nas compilações do Docusaurus)
- O link simbólico precisa existir apenas para o idioma de origem — compilações traduzidas não o utilizam

<a id="implementation-example"></a>
### Exemplo de implementação

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` em [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts); a documentação em inglês faz referência a PNGs colocalizados (por exemplo, [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) com `../assets/screen-dashboard-summary.png`). SVGs colocalizados do mesmo projeto são colocados nos mesmos diretórios `current/assets/` — veja [SVG Colocalizado](/guide/svg-translation/translated-svg-colocated).
