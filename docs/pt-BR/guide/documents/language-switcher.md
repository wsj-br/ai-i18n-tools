<a id="language-switcher-languagelistblock"></a>
# Seletor de idioma (`languageListBlock`)

Use `docsOutput.postProcessing.languageListBlock` quando os arquivos Markdown traduzidos devem incluir uma linha de links **"Ler em outros idiomas"** — um link por localidade, com valores `href` calculados em relação a cada arquivo de saída.

Este repositório o utiliza para [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (saída simples em `translated-docs/`). Após `translate-docs`, cada cópia traduzida recebe um bloco atualizado; por exemplo, [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) links para arquivos de localidade irmãos em `translated-docs/` e de volta para a fonte em inglês na raiz do repositório.

Requer `docsOutput.style = "flat"` (ou outro layout onde os arquivos de localidade irmãos são endereçáveis por caminho relativo). Consulte [Layouts de saída](/guide/documents/output-layouts).

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. Marque o bloco no Markdown de origem

Envolva o seletor de idiomas em HTML (ou quaisquer linhas) delimitadas pelos marcadores de substring `start` e `end`. Este repositório usa:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
```

O texto inicial do link é apenas um espaço reservado. `translate-docs` substitui toda a seção desde a primeira linha contendo `start` até a primeira linha posterior contendo `end` (marcadores dentro de blocos de código cercados são ignorados, portanto exemplos de configuração no mesmo arquivo não correspondem).

<a id="2-configure-the-block"></a>
## 2. Configure o bloco

`start` e `end` são marcadores de substring arbitrários — não precisam ser `<small id="lang-list">` / `</small>`. Escolha qualquer texto de abertura e fechamento que apareça apenas na seção do seletor de idiomas: outra tag HTML (`<div class="lang-switcher">` … `</div>`), comentários HTML (`<!-- lang-list -->` … `<!-- /lang-list -->`) ou delimitadores apenas em markdown (por exemplo, uma linha `**Languages:**` até uma linha `---`). Defina `start` e `end` na configuração para corresponder exatamente ao que você colocou no arquivo de origem.

Configuração raiz ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Campo       | Função                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Substring que identifica a linha de abertura do bloco                                                  |
| `end`       | Substring na linha de fechamento (pode ser a mesma linha que `start` quando ambos aparecem em uma linha)             |
| `separator` | Texto entre os links `[label](href)` gerados (este repositório usa `" · "`)                                    |
| `label`     | Opcional: `"local"` (padrão) usa o endônimo de cada idioma do manifesto; `"english"` usa `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. O que acontece em tempo de execução

1. **Extração** — o trecho da lista de idiomas **não** é enviado ao modelo (`translatable: false`).
2. **Por arquivo traduzido** — após a tradução dos segmentos e reescrita opcional de links planos, `postProcessing` reconstrói o bloco: um link em markdown por idioma, com rótulos de `ui-languages.json` quando presentes (senão do catálogo mestre embutido, senão `localeDisplayNames`), caminhos relativos ao arquivo sendo escrito.
3. **Atualização da fonte** — ao final de uma execução `translate-docs` / `sync` para documentos, o mesmo bloco canônico é reescrito nos **arquivos fonte em inglês** em `contentPaths`, de modo que adicionar um idioma atualiza o seletor no repositório sem precisar editar manualmente todos os links.

Se um arquivo não tiver um bloco correspondente, a CLI registra um aviso (quando `--verbose`) e mantém o conteúdo inalterado.

<a id="4-label-manifest"></a>
## 4. Manifesto de rótulos

Para rótulos endonímicos (`label: "local"`), gere ou mantenha `ui-languages.json` via `generate-ui-languages` (requer [`uiLanguagesPath`](/reference/configuration#uilanguagespath-optional)). A configuração somente de documentos deste repositório não possui pipeline de UI, então os rótulos vêm do catálogo mestre empacotado para `sourceLocale` + `targetLocales`.

<a id="5-examples-in-this-repository"></a>
## 5. Exemplos neste repositório

| Exemplo | Arquivos |
|---|---|
| Este pacote (README simples + site VitePress) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (bloco README: `docsOutput.style = "flat"`; bloco do site: `docsOutput.style = "vitepress"`; JSON do tema via `json[]`) |
| README simples + documentos Docusaurus | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (segundo bloco: `docsOutput.style = "flat"`; primeiro bloco: `docsOutput.style = "docusaurus"`) |
| Documentos VitePress (demonstração mínima) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + catálogo de tema `json[]`) |

A linha imediatamente antes de `<small id="lang-list">` (por exemplo, `**Read in other languages:**`) é um segmento normal passível de tradução e é localizada em cada localidade de destino; apenas a linha de links dentro dos marcadores é regenerada literalmente, exceto por `href` e rótulos gerados pelo manifesto.
