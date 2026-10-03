<a id="html-pages"></a>
# Páginas HTML

Use o pipeline de Documentos quando um site estático precisar de um arquivo `.html` ou `.htm` traduzido por localidade. O `translate-docs` traduz a página de origem, reescreve seus links relativos e grava as cópias de localidade em `outputDir`. Nenhum tempo de execução de i18n de navegador ou marcadores `data-i18n*` são necessários.

Use [Aplicativos HTML simples](/pt-BR/guide/ui-strings/plain-html) quando um único arquivo HTML permanecer no lugar e um script de navegador trocar strings de um JSON simples dinamicamente. Não coloque o mesmo arquivo em ambos os pipelines; a CLI avisa quando um arquivo HTML é simultaneamente uma origem `docs[]` e uma origem de catálogo `ui.sourceRoots`.

O site executável [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) serve inglês na porta 3092 e grava o português em `site/pt-BR/`.

<a id="quick-start"></a>
## Início rápido

Crie a estrutura de uma configuração funcional:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

Ou adicione esta parte HTML a um `ai-i18n-tools.config.json` que já tenha um [provedor](/pt-BR/guide/providers-and-models) de LLM:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

O `docsRoot` deve ser a árvore de origem dentro de `contentPaths`. Ele é removido antes que o diretório de localidade seja inserido. Com a configuração acima:

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

Opcionalmente, adicione os [marcadores de lista de idiomas e hreflang](#language-list-and-hreflang) a cada página de origem e execute:

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

O comando também atualiza o conteúdo dos marcadores nos arquivos do idioma de origem. Trate os arquivos de localidade em `outputDir` como saída gerada; edite as páginas de origem e execute o comando novamente.

<a id="what-is-translated"></a>
## O que é traduzido

O extrator HTML traduz:

- texto visível que contenha letras, incluindo `<title>` e texto ao redor de marcação em linha
- valores dos atributos `alt`, `title`, `aria-label` e `placeholder`
- `value` em `<input type="submit">` e `<input type="button">`
- `content` em `meta name="description"`, `meta property="og:title"` e `meta property="og:description"`

Elementos em linha como `<a>`, `<em>`, `<strong>`, `<span>`, `<img>` e `<br>` são preservados enquanto a frase ao redor é traduzida. Elementos em linha semelhantes a código, como `<code>` e `<kbd>`, são mantidos intactos:

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

Subárvores inteiras de `script`, `style`, `textarea`, `pre` e `code` são copiadas sem alterações. Outros atributos — incluindo `class`, `id`, `src`, `href` e metadados que contêm URLs — não são enviados ao modelo.

Em cada cópia de localidade, o pipeline define `<html lang="…">` e o `dir` da localidade (`ltr` ou `rtl`). A página de origem mantém seu `lang` e `dir` originais. Use HTML em UTF-8; a CLI avisa quando um `<meta charset>` declara outra codificação.

<a id="output-layout"></a>
## Layout de saída

Para o layout usual de site estático, defina:

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

O `style: "nested"` grava `{outputDir}/{locale}/{path relative to docsRoot}`. O `style: "flat"` grava arquivos com sufixo de localidade, como `site/about.pt-BR.html`. Consulte [Layouts de saída](/pt-BR/guide/documents/output-layouts) para todos os estilos e modelos de caminho personalizados.

Os diretórios de localidade gerados e os nomes de arquivos de localidade simples em `outputDir` são excluídos de descobertas de origem futuras. Isso impede que `site/pt-BR/index.html` ou `site/index.pt-BR.html` sejam traduzidos novamente.

<a id="links-and-images"></a>
## Links e imagens

Links relativos que terminam em `.html` ou `.htm` são reescritos quando seu destino é outra página de origem no mesmo bloco `docs[]`. Strings de consulta e fragmentos são preservados. Por exemplo, `href="about.html#history"` em `site/index.html` se torna `href="./about.html#history"` em `site/pt-BR/index.html`.

Outras URLs relativas `href`, `src`, `srcset` e `poster` recebem um prefixo de profundidade para que os arquivos compartilhados ainda sejam resolvidos a partir da página de localidade. URLs absolutas, URLs relativas ao protocolo, URLs `data:` e links apenas de fragmento permanecem inalterados. URLs relativas à raiz permanecem relativas à raiz.

O `docsOutput.localizedAssets` pode selecionar um nome de arquivo de imagem ou ícone específico da localidade:

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

`img/trulli.jpg` se torna `img/trulli-pt-BR.jpg`. Com `onlyIfExists: true` (o padrão), essa URL é usada apenas quando o arquivo localizado existe; caso contrário, o asset compartilhado original é mantido. Defina `onlyIfExists: false` apenas quando outra etapa de build ou CDN garantir esses arquivos.

`include` corresponde a caminhos de URL como `img/**`. Use `assetRoot` para definir o diretório do sistema de arquivos no qual os candidatos localizados — especialmente URLs relativas à raiz, como `/img/trulli.jpg` — são verificados.

As mesmas regras de localização se aplicam a `srcset`, `poster`, `<source src>`, ícone `<link href>` e `og:image` / `twitter:image`. O pipeline reescreve as referências, mas não cria, traduz ou copia arquivos de asset. Os valores de `url()` do CSS não são reescritos.

<a id="language-list-and-hreflang"></a>
## Lista de idiomas e hreflang

Coloque um par de lista de idiomas onde a navegação visível pertence, e um par hreflang dentro de `<head>`:

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

A cada execução, o pipeline substitui apenas o conteúdo entre cada par. Ele atualiza cada cópia de localidade e a página de origem, mantendo os links alternativos recíprocos. Marcadores dentro de `script`, `style`, `pre` e `code` são ignorados. Com `--verbose`, a CLI avisa quando um par configurado está ausente.

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

Os comentários padrão funcionam mesmo quando `docsOutput.html` é omitido. Defina `languageList.start` / `end` ou `hreflang.start` / `end` apenas quando a origem usar um texto de marcador diferente.

<a id="visible-language-navigation"></a>
### Navegação visível de idiomas

- `format: "links"` escreve elementos `<a>`. Dentro de um `<ul>`, `<ol>` ou `<nav>`, cada link é envolto em `<li>`; nos demais casos, `separator` une os links.
- `format: "select"` escreve linhas `<option>`. Coloque os marcadores dentro do seu próprio `<select data-lang-select>`, copie `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` para o site e carregue esse script clássico. Ele navega para a URL gerada da opção selecionada.
- `label` é `local` (endônimo), `english` ou `both` (`English / endonym` quando diferem). Os rótulos vêm de `ui-languages.json` quando disponível, e depois da lista de localidades integrada ao pacote.

Um bloco de marcador usa um formato. Os links gerados incluem `lang`, `hreflang` e `aria-current`; a opção gerada para a página atual tem `selected`.

<a id="search-engine-alternates"></a>
### Alternativas para mecanismos de busca

`hreflang.siteUrl` prefixa URLs alternativas. Defina-o como a origem pública do site antes da implantação. Quando omitido, o pipeline escreve links alternativos relativos e registra um aviso.

`xDefault` tem como padrão `sourceLocale`; ele é emitido apenas quando essa localidade está configurada para a página. `stripIndexHtml: true` transforma um alternativo `index.html` em uma URL de diretório.

O bloco de marcador é obrigatório: o pipeline não injeta tags em `<head>` automaticamente. Ele também não gera um sitemap, URL canônica ou `og:locale`, e não redireciona pelo idioma do navegador.

Apenas as localidades de origem e de destino configuradas são elegíveis para blocos de idioma. Quando `ui-languages.json` existe, suas linhas e ordem determinam quais localidades elegíveis aparecem, portanto, mantenha o manifesto alinhado com a configuração. Se você traduzir com `--locale` para gerar apenas um subconjunto, não publique até que a saída de cada localidade vinculada exista.

<a id="second-run"></a>
## Segunda execução

As traduções de frases permanecem no cache. O hash de rastreamento de arquivos também inclui a lista de localidades, o estilo de saída, `docsOutput.html` e `localizedAssets`. Adicionar uma localidade ou alterar essas opções reescreve os blocos e links gerados mesmo quando todas as frases já estão em cache. Um hash correspondente e um arquivo de saída atualizado ignoram essa página de localidade.

<a id="troubleshooting"></a>
## Solução de problemas

| Sintoma | O que verificar |
| --- | --- |
| A saída é `site/pt-BR/site/index.html` | Defina `docsOutput.docsRoot` como `"site"` para que o prefixo de origem seja removido. |
| O link ainda aponta para a página em inglês | Use um link `.html` / `.htm` relativo e inclua a página de destino no mesmo bloco `docs[]`. |
| O caminho da imagem está quebrado a partir de uma página de localidade | Mantenha-o relativo para que a reescrita de profundidade possa ser aplicada; lembre-se de que o `url()` do CSS não é reescrito. |
| A imagem localizada não está selecionada | Verifique `localizedAssets.include`, o nome do arquivo `pattern` e se o candidato existe quando `onlyIfExists` é verdadeiro. |
| A lista de idiomas está vazia ou inalterada | Mantenha ambos os comentários de marcador na ordem correta e fora de `script`, `style`, `pre` e `code`. |
| O menu suspenso não navega | Adicione `data-lang-select` ao `<select>` e carregue `html-runtime/lang-select.js`. |
| As URLs hreflang usam o host incorreto | Defina `hreflang.siteUrl` para a origem pública final. |
| Uma página traduzida é traduzida novamente | Mantenha os arquivos de localidade gerados no `outputDir` configurado; não os adicione como fontes separadas. |
