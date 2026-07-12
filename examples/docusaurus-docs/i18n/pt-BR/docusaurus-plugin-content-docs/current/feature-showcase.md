---
sidebar_position: 1
title: Demonstração de Recurso de Tradução
description: >-
  Um documento de referência que demonstra cada elemento Markdown que o
  ai-i18n-tools sabe traduzir.
translation_last_updated: '2026-07-12T01:33:44.374Z'
source_file_mtime: '2026-07-12T01:15:35.404Z'
source_file_hash: ad61e5d62a39cb332852533980c1de8417791746e8053814b32c4d3785e41215
translation_language: pt-BR
source_file_path: docs/feature-showcase.md
translation_models:
  - google/gemini-2.5-flash
  - meta-llama/llama-3.3-70b-instruct
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Esta página existe para demonstrar como o `ai-i18n-tools` lida com cada construção Markdown comum. Execute o `sync` contra ela e compare a saída em cada pasta de localidade para ver exatamente o que é traduzido e o que permanece intocado.

---

## Texto simples {#plain-text}

A internacionalização é mais do que trocar palavras. Um bom pipeline de tradução preserva a estrutura do documento, mantém os identificadores técnicos intactos e envia apenas texto legível por humanos para o modelo de linguagem.

O `ai-i18n-tools` divide cada documento em **segmentos** antes de enviá-los para o LLM. Cada segmento é traduzido independentemente e depois remontado, de modo que uma alteração em um parágrafo não invalida as traduções em cache do restante do arquivo.

---

## Formatação de texto {#text-formatting}

O tradutor deve manter toda a formatação inline sem alterar a marcação:

- **Texto em negrito** sinaliza importância e deve permanecer em negrito após a tradução.
- _Texto em itálico_ é usado para ênfase ou títulos; o significado deve ser preservado.
- ~~Riscado~~ marca conteúdo obsoleto ou removido.
- `inline code` **nunca** é traduzido — identificadores, nomes de funções e caminhos de arquivo devem permanecer como estão.
- Um [hiperlink](https://github.com/wsj-br/ai-i18n-tools) mantém sua URL original; apenas o rótulo do âncora é traduzido.

---

## Títulos em todos os níveis {#headings-at-every-level}

### H3 — Configuração {#h3--configuration}

#### H4 — Diretório de saída {#h4--output-directory}

##### H5 — Nomenclatura de arquivos {#h5--file-naming}

###### H6 — Tratamento de extensão {#h6--extension-handling}

Todos os níveis de título traduzem o texto, mas deixam os IDs de âncora inalterados para que os links de âncora existentes continuem funcionando.

---

## Tabelas {#tables}

Tabelas são uma fonte comum de erros de tradução. Cada célula é traduzida individualmente; separadores de coluna e sintaxe de alinhamento são preservados.

| Recurso                | Status         | Notas                                                            |
|------------------------|----------------|------------------------------------------------------------------|
| Tradução de Markdown   | ✅ Estável       | Segmentos armazenados em cache no SQLite                         |
| Extração de string de UI   | ✅ Estável       | Lê chamadas `t("…")`                                             |
| Cadeias de interface plurais      | ✅ Estável       | `t("…", { plurals: true, count })`; catálogo + sufixos JSON planos |
| Tradução de rótulos JSON | ✅ Estável       | Barra lateral/navbar JSON do Docusaurus                                   |
| Tradução de texto SVG   | ✅ Estável       | Preserva a estrutura SVG                                          |
| Aplicação de glossário   | ✅ Estável       | Glossário CSV por projeto                                         |
| Concorrência em lote      | ✅ Configurável | Chave `batchConcurrency`                                           |

### Suporte a Esquerda para Direita e Direita para Esquerda {#left-to-right-and-right-to-left-support}

A internacionalização moderna deve acomodar tanto idiomas da esquerda para a direita (LTR) quanto da direita para a esquerda (RTL). `ai-i18n-tools` garante o tratamento correto da direção do texto em todo o fluxo de trabalho de tradução:

- O pipeline preserva automaticamente a direção de cada localidade. Por exemplo, o árabe (`ar`) é renderizado como RTL, enquanto o inglês (`en-GB`), o português (`pt`) e outros permanecem LTR.
- Ao traduzir tabelas markdown, amostras de código ou cadeias de interface, as ferramentas mantêm o alinhamento e a estrutura do conteúdo, para que as tabelas e blocos formatados sejam exibidos naturalmente em contextos LTR e RTL.
- O Docusaurus e o aplicativo Next.js de exemplo respeitam a direção da localidade no navegador, alternando o layout e o alinhamento do texto conforme apropriado.

| Direção | Exemplo de localidade         | Exibição                |
|:--------------:|:-----------------------|:-----------------------|
|      LTR       | `en-GB`, `es`, `pt-BR` | Padrão da esquerda para a direita |
|      RTL       | `ar`, `fa`, `he`       | Layout da direita para a esquerda   |

Isso garante que os documentos e interfaces sejam exibidos corretamente, independentemente do idioma ou da direção de leitura do usuário.

---

## Listas {#lists}

### Não ordenadas {#unordered}

- O cache de tradução armazena um hash de cada segmento de origem.
- Apenas os segmentos cujo hash foi alterado desde a última execução são enviados para o LLM.
- Isso torna as execuções incrementais muito rápidas — normalmente apenas algumas chamadas de API para edições pequenas.

### Ordenadas {#ordered}

1. Adicione `ai-i18n-tools` como uma dependência de desenvolvimento.
2. Crie `ai-i18n-tools.config.json` na raiz do seu projeto.
3. Execute `npx ai-i18n-tools sync` para realizar a primeira tradução completa.
4. Commit os arquivos de localidade gerados junto com o código-fonte.
5. Em execuções subsequentes, apenas os segmentos alterados são retraduzidos.

### Aninhadas {#nested}

- **Pipeline de documentos**
  - Origem: qualquer arquivo `.md` ou `.mdx`
  - Saída: árvore Docusaurus `i18n/` ou cópias traduzidas planas
  - Cache: SQLite, indexado por caminho do arquivo + hash do segmento
- **Pipeline de cadeias de interface**
  - Origem: arquivos JS/TS com chamadas `t("…")` (incluindo plurais via `{ plurals: true, count }`)
  - Saída: JSON plano por localidade (`de.json`, `fr.json`, …) com chaves sufixadas para categorias plurais quando aplicável
  - Cache: o catálogo mestre `strings.json` em si

---

## Strings de UI no plural {#plural-ui-strings}

Os documentos Markdown neste site mostram a tradução de **documentos**. O comportamento de **plural** para cópias da UI é mais fácil de ver no [exemplo Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (`examples/nextjs-app/`), que combina um aplicativo React com o mesmo modelo de conteúdo do Docusaurus.

A página inicial desse aplicativo (`src/app/page.tsx`) inclui uma seção de **demonstração de plurais** e repete uma mensagem em várias contagens de amostra para que você possa comparar a gramática entre os idiomas (por exemplo, árabe vs. inglês). Cada linha chama:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Use `plurals: true` para que `extract` registre um grupo de plural em `locales/strings.json` e `translate-ui` preencha os arquivos simples por localidade em `public/locales/`. Em tempo de execução, o i18next resolve a chave sufixada correta para o `count` ativo; o exemplo Next conecta os auxiliares em `src/lib/i18n.ts`.

Para capturas de tela, URLs de localidade e layout de arquivo, consulte **Exemplo de plurais** no [README do exemplo Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Blocos de código {#code-blocks}

Os blocos de código **nunca** são traduzidos. A prosa circundante é traduzida, mas cada caractere dentro do bloco cercado é passado literalmente.

### Shell {#shell}

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### Configuração JSON {#json-configuration}

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "es", "fr", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": { "style": "docusaurus", "docsRoot": "docs-site/docs" }
    }
  ]
}
```

### TypeScript {#typescript}

```typescript
import { createI18nConfig } from 'ai-i18n-tools/runtime';

const config = createI18nConfig({
  defaultLocale: 'en-GB',
  supportedLocales: ['de', 'es', 'fr', 'pt-BR'],
  fallback: 'en-GB',
});

export default config;
```

---

## Citações em bloco {#blockquotes}

> "A melhor internacionalização é invisível para o usuário — ele simplesmente vê seu idioma."
>
> A tradução adequada vai além do vocabulário. Ela adapta o tom, os formatos de data, a formatação de números e a direção de leitura para parecer nativa em cada localidade.

---

## Abas (Docusaurus) {#tabs-docusaurus}

<Tabs>
  <TabItem value="apple" label="Maçã" default>
    Esta é uma maçã 🍎
  </TabItem>
  <TabItem value="orange" label="Laranja">
    Esta é uma laranja 🍊
  </TabItem>
  <TabItem value="banana" label="Banana">
    Esta é uma banana 🍌
  </TabItem>
</Tabs>

---

## Advertências (Docusaurus) {#admonitions-docusaurus}

Os títulos das advertências do Docusaurus são traduzidos; os delimitadores `:::` e as palavras-chave de tipo são preservados.

:::note
Este documento é intencionalmente rico em recursos Markdown. Seu objetivo principal é servir como um dispositivo de teste de tradução — execute `sync` e inspecione a saída para verificar se cada elemento é tratado corretamente.
:::

:::tip
Você pode substituir a redação traduzida para qualquer segmento editando o arquivo de saída e executando `sync` novamente. A ferramenta detectará suas edições e adicionará a frase corrigida ao glossário do projeto automaticamente.
:::

:::warning
Não faça commit do diretório `.translation-cache/` para o controle de versão. O cache é específico da máquina e regenerado a cada novo checkout.
:::

:::danger
Excluir o diretório de cache força cada segmento a ser traduzido novamente do zero. Isso pode ser caro se seus documentos forem grandes. Use `sync --no-cache-write` para fazer uma execução de teste sem persistir os resultados.
:::

---

## Imagens e reescrita de caminho com reconhecimento de localidade {#images-and-locale-aware-path-rewriting}

O texto alternativo da imagem é traduzido para cada localidade. Além disso, `ai-i18n-tools` também pode **reescrever caminhos de imagem** na saída traduzida via `postProcessing.regexAdjustments` — para que cada localidade possa apontar para sua própria captura de tela, em vez de sempre mostrar a versão em inglês.

O documento de origem (inglês) faz referência a:

```markdown
![The example Next.js app running in English](/img/screenshots/pt-BR/screenshot.png)
```

A entrada de configuração para este site de documentação inclui:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/pt-BR/]+/",
    "replace": "screenshots/pt-BR/"
  }
]
```

Após a tradução, a saída em alemão se torna:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/pt-BR/screenshot.png)
```

Aqui está a captura de tela real do aplicativo Next.js — ele está em inglês por padrão, mas se você estiver lendo isso em uma localidade traduzida, a imagem abaixo deve mostrar o aplicativo em seu idioma:

![O aplicativo Next.js de exemplo — strings da interface do usuário e esta página traduzidas por ai-i18n-tools](/img/screenshots/pt-BR/screenshot.png)

---

## Linhas horizontais e quebras de linha {#horizontal-rules-and-line-breaks}

Uma linha horizontal (`---`) é um elemento estrutural e não é traduzida.

O conteúdo acima e abaixo dela é tratado como segmentos separados, dando ao LLM janelas de contexto mais limpas.
