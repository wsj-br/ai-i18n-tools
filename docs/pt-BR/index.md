---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  Torne seu aplicativo, site ou documentação de repositório multilíngue com
  configuração guiada, tradução por IA e reexecuções em cache. Comece com
  JavaScript, TypeScript, Python ou um README.
hero:
  name: ai-i18n-tools
  text: Torne seu projeto de idioma único multilíngue.
  tagline: >-
    Adicione idiomas ao seu app, site ou à documentação do seu repositório com a
    configuração guiada e a tradução por IA. Escolha seu provedor e seus modelos
    e reutilize as traduções em cache à medida que seu projeto cresce.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: Logotipo ai-i18n-tools
  actions:
    - theme: brand
      text: Escolha seu projeto
      link: '#start-here'
    - theme: alt
      text: Explore os exemplos
      link: /pt-BR/examples
---



<a id="start-with-the-project-you-have"></a>
## Comece com o projeto que você já tem

Um idioma hoje? Comece aqui. Esse idioma pode ser qualquer um: defina-o como `sourceLocale`. O inglês é um exemplo comum nestes guias. A internacionalização (i18n) prepara seu projeto para suportar diferentes idiomas; estes guias levam você da configuração até sua primeira experiência traduzida, incluindo o README que seu repositório já exibe no GitHub, GitLab ou em qualquer outro host.

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="javascript-or-typescript-app"></a>
### Aplicativo JavaScript ou TypeScript

Transforme botões, rótulos e mensagens de texto simples em uma IU multilíngue. Configure seu ambiente de execução, marque o texto a ser traduzido e conecte a troca de idioma. Inclui prompts do agente de codificação para a etapa de preparação.

React · Next.js · Node.js · CLI

[Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-app"></a>
### Aplicativo Python

Encapsule o texto voltado para o usuário e carregue mensagens traduzidas com um auxiliar gerado. Já usa Django ou GNU gettext? Mantenha suas chamadas gettext e deixe a ferramenta preencher os arquivos `.po`. Execute a CLI de tradução a partir de um executável autônomo, sem uma instalação separada do Node.js.

Streamlit · FastAPI · Flask · Django · CLI

[Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) · [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="website-or-documentation"></a>
### Site ou documentação

Publique páginas localizadas e conecte-as às rotas de idioma do seu site. Siga as etapas específicas do framework para navegação, rótulos de tema e o menu de idioma.

VitePress · Starlight · Docusaurus · Astro

[Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="repository-readme-and-docs"></a>
### README e documentos do repositório

Traduza o `README.md` e outros arquivos Markdown em um arquivo por idioma, com uma linha de links entre eles. Combine-o com as strings da interface do seu app ou traduza o README separadamente.

GitHub · GitLab · Bitbucket

[Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme)

</article>
</div>

Não tem certeza de qual caminho seguir? O guia [Adicionar i18n ao seu projeto](/pt-BR/guide/add-i18n-to-your-project) lista todos os tutoriais. [Veja o que o ai-i18n-tools faz](/pt-BR/guide/what-is-ai-i18n-tools) para entender como os pipelines se encaixam.

<a id="from-setup-to-your-first-new-language"></a>
## Da configuração ao seu primeiro novo idioma

<div class="home-steps">

1. **Prepare seu projeto.** Escolha seus idiomas, um provedor de tradução e os modelos a serem testados. Para aplicativos, marque o texto voltado para o usuário e configure o ambiente de execução de tradução. Para sites, habilite o roteamento de idioma do seu framework. Os guias incluem prompts do agente de codificação onde são necessárias alterações no código-fonte.
2. **Traduza para arquivos que você pode usar.** Assim que a configuração estiver pronta, execute `sync`. Ele extrai strings de aplicativo compatíveis, traduz o conteúdo que você habilitou e escreve arquivos de localidade ou páginas localizadas.
3. **Carregue, verifique e continue.** Conecte a saída ao seu aplicativo ou site, conecte a troca de idioma e verifique um idioma de destino. Execute novamente após alterações no código-fonte para traduzir texto novo ou alterado.

</div>

Você cuida da configuração do runtime e do roteamento, manualmente ou com um agente de codificação. A CLI cuida da extração, tradução, validação e geração de arquivos — não da reescrita automática do código-fonte ou da instalação do seletor de idiomas. [Siga o guia de início rápido completo](/pt-BR/guide/quick-start).

<a id="your-source-text-ready-for-more-languages"></a>
## Seu texto de origem. Pronto para mais idiomas.

Este exemplo ilustrativo de JS/TS mostra o formato do resultado após a configuração e a tradução em tempo de execução. Marcar a string de origem a torna detectável; cada arquivo de localidade gerado mapeia essa frase para a tradução correspondente.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

A frase original permanece legível em seu código. Seu aplicativo carrega os arquivos de localidade gerados em tempo de execução. Quer ver a configuração completa? [Explore o exemplo funcional do Next.js](/pt-BR/examples#nextjs-app). Sites seguem um caminho diferente: [gerar páginas localizadas](/pt-BR/guide/add-i18n-to-website) em vez de encapsular cada parágrafo.

<a id="built-for-the-next-update-too"></a>
## Desenvolvido também para a próxima atualização

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="choose-your-provider-and-models"></a>
### Escolha seu provedor e modelos

Use provedores compatíveis como OpenAI, Anthropic, OpenRouter, Gemini, Ollama local ou nove outras opções integradas. Você também pode usar qualquer provedor compatível com a OpenAI. A qualidade da tradução segue a lista de modelos (`translationModels`, mais substituições por localidade). O `suggest-models` e a mesma classificação no painel **Modelos** montam essa lista a partir de benchmarks de tradução publicados.

[Provedores de LLM](/pt-BR/guide/providers-and-models) · [Modelos de IA](/pt-BR/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="reuse-work-already-done"></a>
### Reutilize o trabalho já feito

As traduções em cache permitem que as reexecuções se concentrem em textos novos ou alterados, em vez de traduzir tudo novamente.

[Manter as traduções](/pt-BR/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="review-ai-output-locally"></a>
### Revise a saída da IA localmente

Inspecione as traduções, corrija a formulação e gerencie a terminologia no Painel de Tradução.

[Ver o dashboard](/pt-BR/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="keep-app-and-content-together"></a>
### Mantenha o aplicativo e o conteúdo juntos

Traduza mensagens do aplicativo, documentação, JSONs de localidade aninhados e rótulos de texto SVG a partir de uma única configuração. Ative apenas o que você precisa.

[Combinando pipelines](/pt-BR/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="translate-the-readme-with-the-app"></a>
### Traduza o README com o aplicativo

Uma única `sync` abrange as strings da UI e o Markdown do repositório, e escreve uma linha de idioma no README.

[Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme)

</article>
</div>

<a id="see-a-working-project-first"></a>
## Veja primeiro um projeto em funcionamento

Estes exemplos incluem a configuração e os arquivos traduzidos commitados. Explore a saída sem uma chave de API; executar a tradução novamente exige um provedor configurado e, geralmente, uma chave. O Ollama local não precisa de chave de API.

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="a-multilingual-app"></a>
### Um aplicativo multilíngue

Veja componentes React, configuração de tempo de execução, plurais e troca de idioma em um projeto Next.js funcional.

[Explorar o exemplo do Next.js](/pt-BR/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-in-practice"></a>
### Python na prática

Veja como um aplicativo Streamlit encapsula suas mensagens e usa JSON traduzido sem adicionar um tempo de execução JavaScript ao aplicativo.

[Explorar o exemplo do Streamlit](/pt-BR/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="docs-in-more-languages"></a>
### Documentos em mais idiomas

Veja páginas VitePress traduzidas juntamente com navegação e rótulos de tema localizados.

[Explorar o exemplo do VitePress](/pt-BR/examples#vitepress-docs)

</article>
</div>

[Navegue por todos os exemplos executáveis](/pt-BR/examples), incluindo HTML puro, outros frameworks e fluxos de trabalho de i18n existentes.

<a id="already-have-i18n-keep-what-works"></a>
## Já usa i18n? Mantenha o que funciona.

Você não precisa começar do zero.

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="source-string-calls"></a>
### Chamadas de string de origem

Mantenha o `t()` e as chamadas do gettext já existentes no projeto.

[Strings de UI em JS/TS](/pt-BR/guide/ui-strings/) · [Python e gettext](/pt-BR/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="json-bundles"></a>
### Pacotes JSON

Traduza arquivos de localidade aninhados, incluindo namespaces do i18next. A navegação do site e os catálogos de temas pertencem à [tradução de documentos](/pt-BR/guide/add-i18n-to-website#what-gets-translated), não a este caminho.

[Traduzir pacotes JSON](/pt-BR/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="intlayer-dictionaries"></a>
### Dicionários do Intlayer

Mantenha o Intlayer e preencha as traduções ausentes ou migre o aplicativo para chamadas de string de origem.

[Traduzir no local](/pt-BR/guide/translating-intlayer) · [Migrar para chamadas de string de origem](/pt-BR/guide/migrating-from-intlayer)

</article>
</div>

Também tem diagramas? [Traduza os rótulos de texto SVG](/pt-BR/guide/svg-translation/) juntamente com seu aplicativo ou documentação.

<a id="ready-to-add-your-first-language"></a>
## Pronto para adicionar seu primeiro idioma?

<div class="home-cta">

[Escolha seu projeto](#start-here) para o passo a passo completo ou [abra o início rápido](/pt-BR/guide/quick-start) para instalação e configuração.

Instale o [pacote npm](/pt-BR/guide/installation) para um projeto Node.js.

<a id="python-no-nodejs"></a>

Para Python, [baixe o executável autônomo](/pt-BR/guide/installation#standalone-executables) — não é necessária uma instalação separada do Node.js.

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="go-deeper-when-you-need-to"></a>
## Aprofunde-se quando precisar

[Integrações](/pt-BR/guide/integrations/) · [Provedores de LLM](/pt-BR/guide/providers-and-models) · [Modelos de IA](/pt-BR/guide/ai-models) · [Configuração](/pt-BR/reference/configuration) · [Referência da CLI](/pt-BR/reference/cli-commands/)

<br/>

<br/>

::: info Sobre este site
A interface e a documentação em outros idiomas foram traduzidas com o ai-i18n-tools. As traduções por IA podem conter erros.

Todos os nomes de produtos, logotipos e marcas registradas são propriedade de seus respectivos donos. Ícones e nomes são usados apenas para fins de identificação. Este projeto não é afiliado ou endossado por essas marcas.
:::
