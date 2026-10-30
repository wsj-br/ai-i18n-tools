<a id="what-is-ai-i18n-tools"></a>
# O que é ai-i18n-tools?

Você tem um app, um site, um site de documentação ou um README de repositório em um idioma e quer adicionar mais idiomas. Esse idioma é o `sourceLocale` e pode ser qualquer um. O inglês é um exemplo comum nestes guias. O ai-i18n-tools encontra o texto, traduz com os modelos do provedor de LLM que você escolher e grava os arquivos que seu projeto já carrega. Ele armazena em cache todos os resultados, para que as reexecuções enviem apenas textos novos ou alterados para o modelo.

<a id="what-you-do-and-what-the-tool-does"></a>
## O que você faz e o que a ferramenta faz

| Você | A ferramenta |
| --- | --- |
| Escolha os idiomas, um provedor e os modelos a serem testados | Extrai o texto, traduz, valida o resultado e grava os catálogos ou as páginas |
| Torna o texto visível ao usuário visível para a ferramenta: chamadas `t()` no código do app, o i18n próprio do seu framework para um site ou um marcador de lista de idiomas em um README | Armazena traduções em cache e as reutiliza em cada nova execução |
| Conecte o resultado ao aplicativo, ao roteamento do site ou à linha de idioma do README | Mostra o progresso e permite que você revise as traduções no painel |

A ferramenta não reescreve seu código-fonte. Prompts para agentes de codificação são fornecidos para a etapa de encapsulamento. Ela não instala i18next nem o i18n do framework do seu site e não cria seu seletor de idioma, embora auxiliares de tempo de execução sejam fornecidos para isso.

<a id="where-do-i-start"></a>
## Por onde começo?

Os passo a passo estão agrupados em [Adicionar i18n ao seu projeto](/pt-BR/guide/add-i18n-to-your-project), com a configuração compartilhada e uma página para cada tipo de projeto. Escolha uma linha:

| Você tem | Comece aqui |
| --- | --- |
| Um app JS/TS (React, Next.js, Node, CLI) com texto simples no código-fonte | [Adicionar i18n a um app JS/TS](/pt-BR/guide/add-i18n-to-js) |
| Um aplicativo Python (Streamlit, FastAPI, Flask, desktop, scripts) | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Um aplicativo Django, catálogos Flask-Babel ou um aplicativo que já usa GNU gettext | [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Um site ou site de documentação (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, HTML simples) | [Adicionar i18n a um site ou site de docs](/pt-BR/guide/add-i18n-to-website) |
| Um README de repositório e outros arquivos Markdown, geralmente junto a um app | [Adicionar i18n ao seu README e à documentação em Markdown](/pt-BR/guide/add-i18n-to-readme) |
| Arquivos de locale JSON aninhados independentes | [JSON](/pt-BR/guide/json) |
| Diagramas SVG com rótulos de texto | [Tradução de SVG](/pt-BR/guide/svg-translation/) |
| Dicionários Intlayer (sair do Intlayer) | [Migração do Intlayer](/pt-BR/guide/migrating-from-intlayer) |
| Dicionários Intlayer (manter o Intlayer, traduzir no local) | [Traduzir o Intlayer no local](/pt-BR/guide/translating-intlayer) |

<a id="how-it-works"></a>
## Como funciona

1. Instale a CLI e defina a chave de API do seu provedor: [Instalação](/pt-BR/guide/installation).
2. Execute `init` para gravar `ai-i18n-tools.config.json`: [Início rápido](/pt-BR/guide/quick-start).
3. Prepare o projeto: encapsule strings em `t()`, habilite o i18n do framework do seu site ou adicione o marcador de lista de idiomas a um README.
4. Execute `sync`. Ele extrai o texto, traduz o que é novo e grava a saída.
5. Carregue a saída no seu app ou site, adicione um seletor de idioma e execute `sync` novamente quando a origem mudar.

<a id="translation-modes"></a>
## Modos de tradução

Por baixo dos panos, a ferramenta executa quatro pipelines. Sua configuração habilita os que você precisa, e `sync` os executa em ordem.

- Strings da UI — Extrai chamadas `t("…")` e `_()` do código-fonte JS/TS e Python (e marcadores semelhantes, incluindo GNU gettext) e grava JSON plano por locale ou catálogos `.po` / `.mo`. Comandos: `extract`, `translate-ui`. Guia: [Strings da UI](/pt-BR/guide/ui-strings/). Python: [Aplicações Python](/pt-BR/guide/ui-strings/python).
- Documentos — Traduz páginas Markdown, MDX e `.astro` listadas em `docs[].contentPaths`. Funciona com VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro e outros sites de documentação estática, além de README de repositório (`docsOutput.style` de `flat`). Comando: `translate-docs`. Guias: [Documentos](/pt-BR/guide/documents/) e [Adicionar i18n ao seu README e à documentação em Markdown](/pt-BR/guide/add-i18n-to-readme).
- JSON — Traduz pacotes de locale JSON aninhados (rótulos de tema, substituições de i18n, texto do app que não está no código-fonte) definidos em `json[]` no nível superior. Comando: `translate-json`. Guia: [JSON](/pt-BR/guide/json).
- SVG — Traduz o texto visível dentro de ilustrações SVG (`<text>`, `<title>`, `<desc>`) e grava um arquivo de saída por locale. Separado da tradução de documentos. Comando: `translate-svg`. Guia: [Tradução de SVG](/pt-BR/guide/svg-translation/).

Muitos projetos combinam modos. A combinação comum é de strings de UI com o README do repositório. Um site de documentação, como o VitePress, é a outra combinação frequente. Consulte [Combinando pipelines](/pt-BR/guide/combining-pipelines) e [Adicione i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="examples"></a>
## Exemplos

O repositório inclui projetos de exemplo executáveis em `examples/`, cada um com sua própria configuração, saídas de localidade commitadas e README. Explore os arquivos traduzidos sem uma chave de API; para executar a tradução novamente, é necessária uma chave de provedor.

| Se você tem | Exemplo |
| --- | --- |
| Um aplicativo JS/TS | [console-app](/pt-BR/examples#console-app), [nextjs-app](/pt-BR/examples#nextjs-app) |
| Um README de repositório junto com um aplicativo | [console-app](/pt-BR/examples#console-app), [nextjs-app](/pt-BR/examples#nextjs-app) |
| Um aplicativo Python | [python-streamlit](/pt-BR/examples#python-streamlit), [python-fastapi](/pt-BR/examples#python-fastapi), [python-gettext](/pt-BR/examples#python-gettext) |
| Um site de documentação | [docusaurus-docs](/pt-BR/examples#docusaurus-docs), [vitepress-docs](/pt-BR/examples#vitepress-docs), [astro-docs](/pt-BR/examples#astro-docs) |
| Um site ou HTML puro | [astro-website](/pt-BR/examples#astro-website), [plain-html](/pt-BR/examples#plain-html) |

Consulte [Exemplos](/pt-BR/examples) para ver a lista completa e os comandos de cópia `npx degit`.

<a id="next-steps"></a>
## Próximas etapas

1. [Instalação](/pt-BR/guide/installation) — instale o pacote npm ou baixe o [executável autônomo](/pt-BR/guide/installation#standalone-executables) para um projeto Python e defina sua chave de API do provedor.
2. [Início rápido](/pt-BR/guide/quick-start) — gere uma configuração inicial e execute sua primeira tradução.
3. [Provedores de LLM](/pt-BR/guide/providers-and-models) — escolha um provedor, uma chave de API e a substituição de `-P`.
4. [Modelos de IA](/pt-BR/guide/ai-models) — classifique uma lista restrita com `suggest-models` ou a guia **Modelos** do painel e mantenha vários modelos para que uma tradução com falha possa tentar o próximo.
