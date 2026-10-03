<a id="html-pages"></a>
# Páginas HTML

`translate-docs` pode gerar um arquivo HTML por localidade. Coloque arquivos `.html` ou `.htm` em uma entrada `docs[]` `contentPaths` e execute `translate-docs` ou `sync`. O arquivo em inglês permanece como fonte. As cópias de localidade são gravadas em `outputDir`.

Use esta opção quando cada idioma for sua própria página (um site estático, um conjunto de documentos HTML escritos manualmente). Use [Aplicativos HTML simples](/pt-BR/guide/ui-strings/plain-html) quando um único arquivo HTML permanecer no lugar e o navegador trocar as strings a partir de um JSON simples.

Crie a estrutura inicial com:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

A demonstração executável é [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) (porta 3092).

<a id="what-is-translated"></a>
## O que é traduzido

Traduzido: texto visível, `alt`, `title`, `aria-label`, `placeholder`, o `<title>`, `meta name="description"` e `og:title` / `og:description`.

Mantidos inalterados: elementos `script`, `style`, `textarea`, `pre` e `code`, além de `src`, `href` e outras URLs. Um parágrafo que contenha `<code>` ou `<em>` mantém essas tags e traduz as palavras ao redor.

`html lang` e `dir` são definidos no arquivo de localidade. A fonte em inglês mantém seu próprio `lang` até que você o altere.

Os arquivos de localidade gerados são ignorados na próxima execução quando estão em `outputDir` (um diretório `pt-BR/` ou um `name.pt-BR.html` simples). Um aviso é impresso quando o mesmo arquivo `.html` também é uma fonte de catálogo de UI (`ui.sourceRoots`).

<a id="links-and-images"></a>
## Links e imagens

Links para outras páginas HTML no mesmo bloco `docs[]` são reescritos para a saída de localidade dessa página. Outras URLs relativas recebem um prefixo para que ainda sejam resolvidas a partir do arquivo de localidade.

`docsOutput.localizedAssets` opcionalmente renomeia imagens e ícones quando existe um arquivo específico da localidade. O `url()` CSS não é reescrito.

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| Placeholder | Significado |
| --- | --- |
| `{stem}` | Nome do arquivo sem a extensão |
| `{ext}` | Extensão, incluindo o ponto |
| `{basename}` | Nome do arquivo com a extensão |
| `{locale}` | Código da localidade conforme configurado (`pt-BR`) |
| `{llocale}` | Localidade em minúsculas |
| `{LOCALE}` | Localidade em maiúsculas |

`img/trulli.jpg` com o padrão acima se torna `img/trulli-pt-BR.jpg`. Com `onlyIfExists: true` (o padrão), a URL original é mantida quando esse arquivo está ausente. URLs absolutas, URLs `data:` e fragmentos `#` são ignorados. URLs relativas à raiz (`/img/trulli.jpg`) são testadas em `assetRoot`, ou no diretório do arquivo HTML quando `assetRoot` é omitido.

`srcset`, `poster`, `<source src>`, URLs de ícone `<link>` e `og:image` / `twitter:image` usam as mesmas regras.

Para HTML, `docsOutput.docsRoot` é removido do caminho relativo ao projeto antes que a pasta da localidade seja adicionada. Com `docsRoot: "site"` e `style: "nested"`, `site/index.html` é gravado em `site/pt-BR/index.html`.

<a id="language-list-and-hreflang"></a>
## Lista de idiomas e hreflang

Dois pares de comentários são preenchidos em cada cópia de localidade e na fonte em inglês (para que as alternativas permaneçam recíprocas):

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

Marcadores dentro de `script`, `style`, `pre` e `code` são ignorados. Uma execução detalhada avisa quando uma página não tem par. Os mesmos comentários são os padrões quando `docsOutput.html` é omitido.

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"` grava elementos `<a>`. Dentro de um `<ul>`, `<ol>` ou `<nav>`, cada link é envolto em `<li>`. `format: "select"` grava linhas `<option>`. Coloque os marcadores dentro do seu próprio `<select data-lang-select>` e carregue `lang-select.js` (fornecido como `ai-i18n-tools/html-runtime/lang-select.js` e copiado no exemplo). Um bloco usa um formato.

`label` é `local` (endônimo), `english` ou `both` (`English / endonym` quando diferem). Localidades que não estão no conjunto configurado são omitidas.

`hreflang.siteUrl` adiciona prefixos aos links alternativos. Quando não está definido, os links são relativos e um aviso é registrado. `xDefault` tem como padrão `sourceLocale`. `stripIndexHtml` transforma `index.html` em uma URL de diretório.

Não há arquivo de sitemap, nenhuma injeção automática de `<head>` e nenhuma reescrita de `canonical` ou `og:locale`. O idioma do navegador não redireciona o visitante.

<a id="second-run"></a>
## Segunda execução

As traduções de frases permanecem no cache. O hash de rastreamento de arquivos também inclui a lista de localidades e `docsOutput.html` / `localizedAssets`. Adicionar uma localidade reescreve a lista de idiomas e o bloco hreflang mesmo quando todas as frases já estão em cache. Um hash correspondente e um arquivo de saída atualizado fazem com que a página seja ignorada.
