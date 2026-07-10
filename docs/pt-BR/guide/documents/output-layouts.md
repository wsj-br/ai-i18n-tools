<a id="output-layouts"></a>
# Layouts de saída

`docsOutput.style` controla onde os arquivos markdown traduzidos são gravados. Use os valores de string exatos abaixo em `docs[].docsOutput.style` (apelidos são layouts predefinidos, não mecanismos separados).

`docsOutput.style = "nested"` (padrão quando omitido) — espelha a árvore de origem sob `{outputDir}/{locale}/` (por exemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — árvore de documentação com prefixo de localidade para sites de documentação estáticos. Arquivos sob `docsRoot` são gravados em `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Caminhos fora de `docsRoot` voltam ao layout aninhado. Defina `docs[].docsOutput.docsRoot` como a raiz do seu código-fonte em inglês (por exemplo, `"docs"` ou `"src/content/docs"`). Quando `docsOutput.style = "doc-system"`, você deve definir `localeSubpath` explicitamente (use um apelido abaixo para configurações predefinidas).

**Aliases** (mesmo mecanismo de layout, `localeSubpath` predefinido):

- `docsOutput.style = "docusaurus"` — `localeSubpath` assume o padrão `docusaurus-plugin-content-docs/current` (layout do plugin i18n do Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` assume o padrão `""` (páginas traduzidas diretamente em `{outputDir}/{locale}/`, correspondendo ao [Starlight](https://starlight.astro.build/guides/i18n/) quando o inglês está na raiz do conteúdo e `outputDir` é igual a `docsRoot`).
- `docsOutput.style = "vitepress"` — mesmo layout que `doc-system` com `localeSubpath` vazio; os nomes das pastas de localidade BCP-47 são preservados (`localePathLowercase` assume o padrão `false`). Consulte [integração com VitePress](/pt-BR/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` — mesmo layout que `doc-system` com `localeSubpath` vazio; a fonte em inglês reside em uma pasta de localidade (por exemplo, `content/en/`). Consulte [integração com Nextra](/pt-BR/guide/integrations/nextra).
- `docsOutput.style = "fumadocs"` — mesmo layout que `doc-system` com `localeSubpath` vazio; a fonte em inglês usa arquivos com sufixo de ponto (padrão) ou uma pasta de localidade quando `fumadocsParser` é `"dir"`. Consulte [integração com Fumadocs](/pt-BR/guide/integrations/fumadocs).

Predefinição Docusaurus (páginas principais de documentação):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Predefinição Starlight (mesma estrutura de bloco, caminhos diferentes):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Predefinição VitePress (inglês na raiz do conteúdo, pastas de localidade ao lado da fonte):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Predefinição Nextra (inglês em uma pasta de localidade, pastas de localidade irmãs para destinos):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Predefinição Fumadocs — analisador de ponto (padrão; sufixo de localidade ao lado da fonte em inglês):

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Predefinição Fumadocs — analisador de diretório (pastas de localidade estilo Nextra):

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Rótulos JSON opcionais — strings do shell Docusaurus de `docusaurusCatalogDir` (não o corpo do MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

O Starlight fornece strings de interface em vários idiomas; substituições personalizadas opcionais usam `src/content/i18n/en.json` com `jsonPathTemplate: "{outputDir}/{locale}.json"` em um bloco `docs[]` separado quando necessário.

As strings de navegação/barra lateral/rodapé do VitePress não estão em markdown — configure `docsOutput.vitepressThemeCatalog` e traduza dentro de **`translate-docs`**. Consulte [integração com VitePress](/pt-BR/guide/integrations/vitepress).

O dicionário de tema Nextra (`.ts`) e os rótulos da barra lateral `_meta.ts` não estão em markdown — use `docs[].nextraDictionaryPath` e a coleta automática de `_meta` quando `style: "nextra"`, tudo dentro de **`translate-docs`**. Consulte [integração com Nextra](/pt-BR/guide/integrations/nextra).

As substituições da interface do usuário do Fumadocs (`lib/layout.shared.ts`) e os rótulos da barra lateral `meta.json` não estão em markdown — use `docsOutput.fumadocsUiCatalog` e a coleta automática de `meta.json` quando `style: "fumadocs"`, tudo dentro de **`translate-docs`**. Consulte [integração com Fumadocs](/pt-BR/guide/integrations/fumadocs).

`docsOutput.style = "flat"` — coloca os arquivos traduzidos ao lado do código-fonte com sufixo de localidade, ou em um subdiretório. Links relativos entre páginas são reescritos automaticamente quando `docsOutput.style = "flat"` (a menos que `rewriteRelativeLinks: false` ou um `pathTemplate` personalizado seja definido).

```text
docs/guide.md → i18n/guide.de.md
```

Para links âncora entre páginas em layout plano, consulte [Links âncora](/pt-BR/guide/documents/anchor-links).

Para reescrita de URL de link e ativo além das correções de link relativo integradas, consulte [Reescrita de link](/pt-BR/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Para capturas de tela e ativos rasterizados em páginas traduzidas, consulte [Imagens e Capturas de Tela](/pt-BR/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## Espaços reservados `pathTemplate` / `jsonPathTemplate`

Substitua onde os arquivos traduzidos são gravados definindo `docs[].docsOutput.pathTemplate` (markdown e MDX) ou `jsonPathTemplate` (arquivos de rótulo JSON). Ambos aceitam os mesmos espaços reservados. Os caminhos resolvidos devem permanecer dentro do `outputDir` desse bloco (a CLI rejeita caminhos que escapam dele).

Se você usar um `pathTemplate` personalizado, `rewriteRelativeLinks` assume como padrão `false` a menos que você o defina explicitamente — a reescrita de links relativos é feita para `docsOutput.style = "flat"` sem um modelo personalizado.

Para layouts integrados (`nested`, `flat`, `doc-system` sem modelo personalizado), defina `docsOutput.localePathLowercase` como `true` para gravar segmentos de pasta ou nome de arquivo em letras minúsculas (por exemplo, `pt-br` em vez de `pt-BR`). O alias `astro-starlight` define isso como padrão `true`. Valores personalizados de `pathTemplate` / `jsonPathTemplate` permanecem inalterados — use `{llocale}` ali quando precisar de segmentos em minúsculas mantendo `{locale}` como BCP-47.

| Espaço reservado       | Função                                                                                                     | Exemplo                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Caminho absoluto resolvido do `outputDir` deste bloco de documentação                                      | `/home/acme/repo/i18n`                                           |
| `{locale}` | Código da localidade de destino (mesmo formato usado na configuração / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Mesma localidade em maiúsculas | `DE`, `PT-BR` |
| `{llocale}`            | Mesmo idioma em letras minúsculas (corresponde às pastas de rotas Astro como `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Caminho do arquivo de origem relativo à raiz do projeto, formato POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nome do arquivo **sem** extensão | `guide` para `docs/guide.md` |
| `{basename}` | Nome do arquivo **com** extensão | `guide.md` |
| `{extension}` | Extensão **incluindo** o ponto | `.md`, `.mdx` |
| `{docsRoot}`           | Caminho absoluto resolvido de `docsOutput.docsRoot` (padrão `docs` se omitido)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` com prefixo `docsRoot` correspondente removido quando os caminhos coincidem (POSIX); caso contrário, inalterado | `docs/guide.md` (comum); `guide.md` somente quando a remoção é aplicada |

**Exemplo**

Trecho de configuração:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para a localidade `de` e origem `docs/guide.md`, com raiz do projeto `/home/acme/repo` e `outputDir` resolvido para `/home/acme/repo/i18n`, o caminho expandido é:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Com `docsOutput.style = "flat"` e sem `pathTemplate` personalizado, um padrão comum mantém apenas o nome do arquivo via `{stem}` e `{extension}`, por exemplo `{outputDir}/{stem}.{locale}{extension}`, o que resulta em `…/guide.de.md` sob o `outputDir` resolvido.
