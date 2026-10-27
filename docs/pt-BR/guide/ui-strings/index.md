<a id="ui-strings"></a>
# Strings da UI

Referência para `extract` e `translate-ui`, o pipeline que transforma chamadas `t()` em catálogos por localidade. Adicionando i18n a um app pela primeira vez? Comece em [Adicionar i18n a um app JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um app Python](/pt-BR/guide/add-i18n-to-python). Eles abordam a etapa de encapsulamento e depois trazem você de volta para cá para as Etapas 2 a 4.

Este pipeline atende projetos JS/TS (React, componentes cliente e servidor do Next.js, serviços Node.js, HTML puro, sites Astro e ferramentas CLI) e aplicações Python. JS/TS procura strings com i18next depois que o código-fonte chama `t()`. Python chama `t()` ou gettext por meio de um `i18n.py` gerado (Django mantém o gettext do Django).

<a id="which-guide-to-read"></a>
## Qual guia ler

| Seu app | Leia a seguir |
| --- | --- |
| JS/TS com strings de origem codificadas diretamente, ainda sem `t()` | [Adicionar i18n a um app JS/TS](/pt-BR/guide/add-i18n-to-js) |
| React / Next.js / Node, `t()` já no código-fonte | [Conectar o i18next](/pt-BR/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Aplicações Python](/pt-BR/guide/ui-strings/python). Inicialização: `ui-python`, `ui-python-gettext`, `ui-python-flask` ou `ui-python-django`. Auxiliar: `i18n.py`. Para adicionar locales a uma aplicação existente, consulte [Adicionar i18n a uma aplicação Python](/pt-BR/guide/add-i18n-to-python). |
| HTML puro (sem `t()` na marcação) | [Aplicativos HTML puros](/pt-BR/guide/ui-strings/plain-html) |
| Site de marketing Astro (híbrido) | [Site Astro](/pt-BR/guide/ui-strings/astro-website) |
| Regras de `t()`, interpolação, plurais | [Chamadas t() e plurais](/pt-BR/guide/ui-strings/t-calls-and-plurals) |
| Seletor de idioma / RTL | [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher) |
| Assinaturas da API de tempo de execução | [Ajudantes de tempo de execução](/pt-BR/guide/runtime-helpers) |
| Dicionários `.content.ts` do Intlayer, migrando do Intlayer | [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer) |
| Dicionários `.content.ts` do Intlayer, mantendo o Intlayer | [Traduzindo o Intlayer no local](/pt-BR/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## Passo 1: Inicializar

```bash
ai-i18n-tools init -P openrouter
```

Isso grava `ai-i18n-tools.config.json` com o modelo `ui-markdown` (incluindo o bloco `provider` / `providers` dessa predefinição). Esse modelo também ativa a tradução de documentos para `README.md`, gravados como arquivos simples em `translated-docs/`. Repositórios apenas com README usam `init -t docs-markdown` em vez disso. Consulte [Adicionar i18n ao seu README e à documentação em Markdown](/pt-BR/guide/add-i18n-to-readme). Antes de executar `translate-ui` ou `sync`, defina a chave de API desse provedor no ambiente ou em `.env` — com exceção do Ollama; consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key). Quatro chaves importam para strings da interface:

- `sourceLocale`: o código BCP-47 do idioma em que o texto de origem está escrito. Qualquer idioma é válido; `"en-GB"` é apenas um exemplo. Ele deve corresponder a `SOURCE_LOCALE` exportado do arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`). A string dentro de `t()` é esse idioma de origem, e os arquivos simples de localidade a usam como chave.
- `targetLocales`: códigos BCP-47 dos seus idiomas de destino (por exemplo, `["de", "fr", "pt-BR"]`). Execute `generate-ui-languages` para criar o manifesto `ui-languages.json` a partir desta lista.
- `ui.sourceRoots`: diretórios ou padrões glob a serem verificados em busca de chamadas `t("…")` (por exemplo, `["src/"]`).
- `ui.stringsJson` e `ui.flatOutputDir`: onde o catálogo mestre e os arquivos por localidade (`de.json`, `pt-BR.json`) são gravados.

Todas as outras chaves, incluindo `providers.<active>.uiModels`, estão em [Configuração](/pt-BR/reference/configuration).

<a id="step-2-extract-strings"></a>
## Passo 2: Extrair strings

`extract` não faz nada útil até que essas chamadas `t()` / `i18n.t()` existam. Primeiro encapsule o texto codificado diretamente: [Adicionar i18n a um app JS/TS](/pt-BR/guide/add-i18n-to-js).

```bash
ai-i18n-tools extract
```

Verifica arquivos em `ui.sourceRoots` em busca de chamadas `t("literal")` e `i18n.t("literal")`. Grava (ou mescla em) `ui.stringsJson`.

O scanner é configurável: adicione nomes de funções personalizadas via `ui.uiExtractor.funcNames` (ou o legado `ui.reactExtractor.funcNames`). Para páginas e componentes Astro, adicione `.astro` a `ui.uiExtractor.extensions`. Para HTML puro, consulte [Aplicativos HTML puros](/pt-BR/guide/ui-strings/plain-html).

<a id="what-extract-scans"></a>
### O que o extract verifica

- As extensões padrão são apenas `.js`, `.jsx`, `.ts` e `.tsx`. `.mjs`, `.cjs`, `.mts` e `.cts` são incluídas somente quando você as adiciona a `ui.uiExtractor.extensions`.
- Uma chave não literal, como `t(variable)` ou um literal de template, é ignorada sem aviso.
- `package.json` `description` é incluído por padrão (`ui.uiExtractor.includePackageDescription`).
- Componentes de arquivo único do Vue e do Svelte não são compatíveis. Adicionar `.vue` ou `.svelte` a `extensions` não extrai o texto do template. Não há parser de SFC.

<a id="step-3-translate-ui-strings"></a>
## Passo 3: Traduzir strings da UI

```bash
ai-i18n-tools translate-ui
```

Lê `strings.json`, envia lotes para os modelos no provedor de LLM ativo para cada localidade de destino e grava arquivos JSON simples (`de.json`, `fr.json`, etc.) em `ui.flatOutputDir`. A seleção de modelo usa a cadeia da IU: `localeModels(locale)` → `uiModels` → `translationModels` (consulte [Modelos de IA](/pt-BR/guide/ai-models#model-fallback-chain)). Em uma localidade, até `uiBatchConcurrency` lotes são executados simultaneamente (padrão: **2**; consulte [Configuração — uiBatchConcurrency](/pt-BR/reference/configuration#uibatchconcurrency-optional)). `-j` ainda paraleliza apenas as localidades de destino.

<a id="translations-database-stringsjson"></a>
### Banco de dados de traduções (`strings.json`)

Para cada entrada, `translate-ui` armazena o **ID do modelo do provedor ativo** que traduziu com sucesso cada localidade em um objeto `models` opcional (mesmas chaves de localidade que `translated`). As strings editadas no Painel de Tradução são marcadas com o valor sentinela `user-edited` em `models` para essa localidade. Os arquivos planos por localidade em `ui.flatOutputDir` permanecem **string de origem → tradução** apenas; eles não incluem `models` (para que os pacotes de tempo de execução permaneçam inalterados).

> **Nota:** As edições do painel para strings da interface do usuário ficam em `strings.json`, não no cache de documentação do SQLite. Execute `sync` ou `translate-ui` simples (sem sinalizador especial) para reescrever arquivos de localidade simples do catálogo — `--force-update` **não** é encaminhado para a etapa da interface do usuário. Evite `--force` em comandos da interface do usuário após edições manuais: ele retraduz cada entrada e pode sobrescrever suas linhas `user-edited`. As linhas do catálogo cuja tradução armazenada falha na verificação do sistema de escrita da localidade (por exemplo, hindi romanizado para `hi`) são tratadas como ausentes e retraduzidas sem `--force`.

<a id="step-4-use-the-output-in-your-app"></a>
## Etapa 4: Use a saída no seu app

`translate-ui` apenas grava arquivos. O app precisa carregá-los.

- JS/TS: conecte o i18next com os auxiliares de runtime, carregue o arquivo de localidade escolhido pelo usuário e adicione um seletor de idioma. Consulte [Conectar o i18next](/pt-BR/guide/ui-strings/i18next-runtime) e [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher).
- Python: use o `i18n.py` gerado ou seus catálogos gettext. Consulte [Aplicações Python](/pt-BR/guide/ui-strings/python).
- HTML puro: carregue o script de runtime junto à página. Consulte [Apps em HTML puro](/pt-BR/guide/ui-strings/plain-html).
- Astro: consulte [Site Astro](/pt-BR/guide/ui-strings/astro-website).

<a id="optional"></a>
## Opcional

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

Alguns modelos traduzem determinados idiomas melhor do que outros. Por exemplo, os modelos qwen e z-ai costumam ter um bom desempenho com idiomas asiáticos. Adicione entradas `providers.<active>.localeModels` para fornecer uma lista de modelos priorizados para cada localidade BCP-47. Essas listas são testadas antes de `uiModels` e `translationModels` para essa localidade. As tags de localidade correspondem sem diferenciar maiúsculas de minúsculas (`zh-cn` e `ZH-CN` são equivalentes). Sem uma entrada correspondente, a ferramenta usa a ordem padrão de `uiModels` e `translationModels`. O mesmo mecanismo `localeModels` se aplica à tradução de documentos, JSON e SVG.

<a id="exporting-to-xliff-20"></a>
### Exportando para XLIFF 2.0

Para entregar strings da interface a um fornecedor de tradução, TMS ou ferramenta CAT, exporte o catálogo como **XLIFF 2.0** (um arquivo por localidade de destino). Este comando é **somente leitura**: não modifica `strings.json` nem chama nenhuma API.

```bash
ai-i18n-tools export-ui-xliff
```

Por padrão, os arquivos são gravados ao lado de `ui.stringsJson`, com nomes como `strings.de.xliff`, `strings.pt-BR.xliff` (nome base do seu catálogo + localidade + `.xliff`). Use `-o` / `--output-dir` para gravar em outro local. Traduções existentes de `strings.json` aparecem em `<target>`; localidades ausentes usam `state="initial"` sem `<target>`, para que as ferramentas possam preenchê-las. Use `--untranslated-only` para exportar apenas unidades que ainda precisam de tradução para cada localidade (útil para lotes enviados a fornecedores). `--dry-run` exibe os caminhos sem gravar arquivos.
