<a id="link-rewriting"></a>
# Reescrita de links

`translate-docs` reescreve URLs em markdown traduzido para que os links ainda sejam resolvidos depois que os arquivos são movidos para caminhos específicos do local. A maioria dos links entre páginas é tratada automaticamente; quando seu site usa uma árvore de URL estática compartilhada ou pastas de ativos codificadas por local, adicione regras `docsOutput.postProcessing.regexAdjustments`.

<a id="built-in-rewriters"></a>
## Reescrevedores integrados

Qual reescrevedor é executado depende de `docsOutput.style`:

| Layout | Reescrevedor integrado | O que ele corrige |
| --- | --- | --- |
| `"flat"` (padrão quando não há `pathTemplate` personalizado) | Reescrevedor de link plano (`rewriteRelativeLinks`, ativado por padrão) | Links relativos entre páginas (`guide.md` → `guide.de.md`) e prefixos de profundidade para URLs de ativos não-markdown |
| `"vitepress"` | Normalizador de link VitePress (`rewriteVitepressLinks`, ativado por padrão) | Caminhos `docs/guide/…` estilo README → rotas do site (`/guide/…`) |
| `"nextra"` | Normalizador de links Nextra (`rewriteNextraLinks`, ativado por padrão) | Caminhos `content/en/…` e `.mdx` relativos → rotas neutras em relação ao idioma (`/guide/…`) |
| `"fumadocs"` | Normalizador de links Fumadocs (`rewriteFumadocsLinks`, ativado por padrão) | Caminhos `content/docs/…` e `.mdx` relativos → rotas neutras em relação ao idioma (`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | Nenhum | URLs de origem passam inalteradas até `postProcessing` |

`pathTemplate` personalizado desabilita o reescrevedor plano, a menos que você defina `rewriteRelativeLinks: true` explicitamente. Consulte [Layouts de saída](/pt-BR/guide/documents/output-layouts) e [Links de âncora](/pt-BR/guide/documents/anchor-links) para tratamento de `#anchor` entre páginas.

Para regras de autoria específicas do VitePress, consulte [Integração VitePress — Convenções de link](/pt-BR/guide/integrations/vitepress#link-conventions).

Para regras de autoria específicas do Nextra, consulte [Integração Nextra — Convenções de link](/pt-BR/guide/integrations/nextra#link-conventions).

Para regras de autoria específicas do Fumadocs, consulte [Integração Fumadocs — Convenções de link](/pt-BR/guide/integrations/fumadocs#link-conventions).

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

Adicione regras `{ "description"?, "search", "replace" }` ordenadas em `docs[].docsOutput.postProcessing` quando os reescrevedores integrados não forem suficientes — por exemplo:

- URLs de captura de tela ou imagem que incluem um **segmento de pasta de local** (`screenshots/en-GB/` → `screenshots/de/`)
- Caminhos absolutos da raiz do site (`/img/…`) que diferem entre a origem em inglês e as árvores de saída traduzidas
- Qualquer padrão de URL que deve mudar por local de destino, mas não é um link markdown relativo simples

`postProcessing` é executado no **corpo do markdown traduzido remontado** (chaves de front matter YAML e valores não-prosa são preservados). Ele é executado **depois** da remontagem de segmentos e da reescrita de links integrada, e **antes** de `addFrontmatter`.

<a id="two-step-flow-with-flat-layout"></a>
### Fluxo de duas etapas com layout plano

Quando `docsOutput.style = "flat"`, o reescrevedor de link plano é executado primeiro, depois `regexAdjustments`:

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

Exemplo com `outputDir: "translated-docs/"` e fonte `README.md` na raiz do repositório:

1. Reescrevedor plano: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

Escreva padrões `search` para corresponder ao segmento de local **dentro da URL já prefixada** — você não precisa incluir o prefixo de profundidade `../` na regex.

Para layouts `doc-system`, o reescrevedor plano não é executado. `regexAdjustments` vê a URL original do markdown de origem (normalmente um caminho absoluto como `/img/screenshots/en-GB/foo.png`).

Consulte [O reescrevedor de link plano e o fluxo de duas etapas](/pt-BR/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) para comportamento de prefixo de profundidade e `flatPreserveRelativeDir`.

<a id="replace-placeholders"></a>
### Espaços reservados `replace`

As strings `replace` suportam variáveis de modelo expandidas por arquivo e localidade:

| Espaço reservado | Valor |
| --- | --- |
| `${translatedLocale}` | Localidade de destino (BCP-47 normalizado) |
| `${sourceLocale}` | Localidade de origem |
| `${sourceFullPath}` | Caminho absoluto do arquivo de origem (POSIX `/`) |
| `${translatedFullPath}` | Caminho absoluto de saída traduzido |
| `${sourceFilename}` / `${translatedFilename}` | Nome base com extensão |
| `${sourceBasedir}` / `${translatedBasedir}` | Diretório pai do arquivo de origem / saída |

`search` é um padrão de regex. Uma string simples usa a flag `g`; use `/pattern/flags` quando precisar de outras flags (o padrão não deve conter caracteres `/` não escapados).

<a id="common-patterns"></a>
## Padrões comuns

<a id="per-locale-asset-folder"></a>
### Pasta de ativos por localidade

Armazene os ativos em um subdiretório codificado por localidade desde o primeiro dia e troque o segmento por uma regra genérica:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

Use `[^/]+` em vez de codificar sua localidade de origem (`en-GB`) para que a regra ainda funcione se `sourceLocale` mudar.

Passo a passo completo: [Imagens e Capturas de Tela — Pasta por localidade](/pt-BR/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### URLs estáticas do sistema de documentos

Para Docusaurus, Starlight ou outros sites `doc-system` que servem capturas de tela de uma árvore estática compartilhada:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

Prefira caminhos relativos colocados (`../assets/name.png`) no markdown de origem quando seu gerador o suportar — então nenhuma ponte `regexAdjustments` é necessária. Veja [Imagens e Capturas de Tela](/pt-BR/guide/images-and-screenshots/) para opções de layout.

<a id="when-regex-is-not-needed"></a>
### Quando regex não é necessário

Você geralmente **não** precisa de `regexAdjustments` quando:

- Links entre páginas são caminhos markdown relativos simples e `docsOutput.style = "flat"` (o reescritor integrado adiciona sufixos de localidade)
- Ativos ficam ao lado dos arquivos de origem e o prefixo de profundidade por arquivo do reescritor plano os resolve corretamente
- Inglês e todas as cópias traduzidas usam a **mesma** URL (imagens compartilhadas na raiz do site, ativos colocados, rotas do site VitePress após o normalizador)
- Links internos do VitePress usam rotas do site ou caminhos `docs/guide/…` com `rewriteVitepressLinks: true`
- Os links internos do Nextra e Fumadocs usam rotas neutras em relação ao idioma (`/guide/…`, `/docs/…`) ou caminhos de raiz de conteúdo com `rewriteNextraLinks` / `rewriteFumadocsLinks: true`

<a id="full-config-example"></a>
## Exemplo de configuração completa

README simples com capturas de tela por localidade e um bloco opcional de troca de idioma:

<details>
<summary>Layout simples: regexAdjustments + languageListBlock</summary>

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
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

Referência de campo: [Configuração — `docs`](/pt-BR/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## Solução de problemas

| Sintoma | Causa provável | O que verificar |
| --- | --- | --- |
| Página traduzida retorna 404 em uma imagem ou ativo estático | `regexAdjustments` ausente ou incorreto para o seu layout de URL | [Imagens e capturas de tela — Solução de problemas](/pt-BR/guide/images-and-screenshots/troubleshooting) |
| O link abre o arquivo certo, mas o `#section` errado | Desvio de slug de âncora, não reescrita de URL | [Links de âncora](/pt-BR/guide/documents/anchor-links) |
| A regra `regexAdjustments` não tem efeito no layout simples | `search` espera o URL pré-reescrito, mas o layout simples já adicionou um prefixo de profundidade | Corresponda ao segmento dentro do caminho prefixado (consulte [fluxo de duas etapas](#two-step-flow-with-flat-layout)) |
| Regex inválido ignorado em tempo de execução | Padrão `search` malformado | A CLI avisa com a regra `description`; teste padrões em relação à saída traduzida de exemplo |
