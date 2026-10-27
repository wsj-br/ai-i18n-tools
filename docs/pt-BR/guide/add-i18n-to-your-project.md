<a id="add-i18n-to-your-project"></a>
# Adicionar i18n ao seu projeto

Esta seção é o conjunto de tutoriais para um projeto que atualmente está em um único idioma. Comece aqui. Cada página abaixo aborda um tipo de projeto, desde a configuração até os primeiros arquivos traduzidos. A seção [Comece a usar](/pt-BR/guide/what-is-ai-i18n-tools) aborda o que é a ferramenta, as opções de instalação e os provedores e modelos. Você pode abrir um tutorial sem ler essas páginas primeiro.

<a id="what-you-do-and-what-the-tool-does"></a>
## O que você faz e o que a ferramenta faz

| Você | A ferramenta |
| --- | --- |
| Escolha os idiomas, um provedor e os modelos para testar | Extrai o texto, o traduz, verifica o resultado e grava os catálogos ou as páginas |
| Torna o texto visível: `t()` no código do aplicativo, o i18n do framework do seu site ou um marcador de lista de idiomas em um README | Armazena em cache todas as traduções e as reutiliza na próxima execução |
| Carrega os arquivos e verifica um idioma | Mostra o progresso e permite que você revise o texto no [Painel de Tradução](/pt-BR/guide/translation-dashboard/) |

Os guias indicam quais edições de código-fonte são suas. Prompts de agente de codificação são incluídos onde essas edições são mecânicas. A CLI grava os catálogos e os arquivos traduzidos. Ela não instala o i18next nem o i18n do framework do seu site.

<a id="shared-setup"></a>
## Configuração compartilhada

Todo guia segue a mesma ordem. A página que você escolher preenche os detalhes.

1. Instale a CLI e defina a chave de API do seu provedor. O Ollama não precisa de chave. [Instalação](/pt-BR/guide/installation) e [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).
2. Execute `init` com o template indicado na página. Isso grava o `ai-i18n-tools.config.json`.
3. Prepare o projeto para que a ferramenta possa ver o texto.
4. Execute `ai-i18n-tools sync` e, em seguida, `ai-i18n-tools status`.
5. Carregue a saída, verifique um idioma de destino e execute novamente o `sync` quando a origem for alterada. O cache envia apenas o texto novo ou alterado para o modelo.

<a id="pages-in-this-section"></a>
## Páginas nesta seção

| Se você tem | Página | O que essa página aborda |
| --- | --- | --- |
| Um aplicativo JS/TS (React, Next.js, Node, CLI) cujos botões e mensagens ainda estão em texto simples | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) | Instalar o i18next, adicionar o bootstrap, envolver literais em `t()` e, em seguida, `extract` e `translate-ui` |
| Um aplicativo Python (Streamlit, FastAPI, Flask, Django, gettext) | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) | Envolver `t()` ou `_()`, ou manter o GNU gettext. A CLI pode ser executada a partir de um executável autônomo sem a instalação do Node.js |
| Um site de documentação ou marketing (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, HTML simples) | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website) | Habilitar as rotas de idioma do próprio framework e, em seguida, traduzir páginas e rótulos de tema |
| Um README de repositório e outros arquivos Markdown, geralmente ao lado de um aplicativo | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) | Um arquivo por idioma (`translated-docs/README.de.md`) e uma linha de idioma no README. O `init --with-readme` adiciona esse bloco a qualquer template |
| Mais de um dos itens acima em um repositório | [Combinando pipelines](/pt-BR/guide/combining-pipelines) | Uma configuração e um `sync`. O par usual são as strings da interface do usuário do aplicativo mais o README |
| Dicionários do Intlayer, e você quer manter o Intlayer | [Traduzindo o Intlayer no local](/pt-BR/guide/translating-intlayer) | O `translate-intlayer` preenche as folhas ausentes e desatualizadas dentro do `*.content.ts` |
| Dicionários do Intlayer, e você está migrando do Intlayer | [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer) | O `migrate-intlayer` preenche os catálogos a partir dos dicionários e reescreve os locais de chamada seguros para `t()` |

Um aplicativo que também tem um README usa a página do aplicativo e a página do README juntas. Um site que também tem um README usa a página do site e o `init … --with-readme` para o bloco do README.

<a id="where-to-go-deeper"></a>
## Para se aprofundar

Os tutoriais terminam assim que o primeiro idioma é configurado. As páginas de referência continuam a partir daí:

- [Strings de IU](/pt-BR/guide/ui-strings/), [Documentos](/pt-BR/guide/documents/), [JSON](/pt-BR/guide/json) e [SVG](/pt-BR/guide/svg-translation/) para um pipeline por vez.
- [Integrações](/pt-BR/guide/integrations/) para strings do shell do framework (navegação, barra lateral, tema).
- [Início rápido](/pt-BR/guide/quick-start) para a lista de comandos e os scripts `package.json` recomendados.
- [Provedores de LLM](/pt-BR/guide/providers-and-models) para predefinições e chaves de API.
- [Modelos de IA](/pt-BR/guide/ai-models) para a lista restrita classificada e a cadeia de fallback.
