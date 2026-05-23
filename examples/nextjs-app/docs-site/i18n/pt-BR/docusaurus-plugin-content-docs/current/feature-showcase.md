---
sidebar_position: 1
title: Demonstração de Recursos de Tradução
description: >-
  Um documento de referência que demonstra todos os elementos Markdown que o
  ai-i18n-tools sabe traduzir.
translation_last_updated: '2026-05-23T15:50:15.857Z'
source_file_mtime: '2026-05-04T21:42:57.361Z'
source_file_hash: fc1e59d495d99d93de4381fb9475734f0221307ceac660a82ac03cdc06acc320
translation_language: pt-BR
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Esta página existe para demonstrar como o `ai-i18n-tools` lida com cada construção comum do Markdown. Execute o `sync` contra ela e compare a saída em cada pasta de localidade para ver exatamente o que é traduzido e o que permanece inalterado.

---

## Texto simples {#plain-text}

Internacionalização vai além de trocar palavras. Um bom pipeline de tradução preserva a estrutura do documento, mantém os identificadores técnicos intactos e envia apenas texto legível por humanos ao modelo de linguagem.

O `ai-i18n-tools` divide cada documento em **segmentos** antes de enviá-los ao LLM. Cada segmento é traduzido independentemente e depois recombinado, de modo que uma alteração em um parágrafo não invalida as traduções armazenadas em cache do restante do arquivo.

---

## Formatação de texto {#text-formatting}

O tradutor deve manter toda a formatação em linha sem alterar a marcação:

- **Texto em negrito** indica importância e deve permanecer em negrito após a tradução.
- _Texto em itálico_ é usado para ênfase ou títulos; o significado deve ser preservado.
- ~~Tachado~~ marca conteúdo obsoleto ou removido.
- `inline code` é **nunca** traduzido — identificadores, nomes de funções e caminhos de arquivos devem permanecer inalterados.
- Um [hyperlink](https://github.com/wsj-br/ai-i18n-tools) mantém sua URL original; somente o rótulo do link é traduzido.

---

## Cabeçalhos em todos os níveis {#headings-at-every-level}

### H3 — Configuração {#h3--configuration}

#### H4 — Diretório de saída {#h4--output-directory}

##### H5 — Nomeação de arquivos {#h5--file-naming}

###### H6 — Tratamento de extensões {#h6--extension-handling}

Todos os níveis de título traduzem o texto, mas mantêm os IDs de âncora inalterados para que os links de âncora existentes continuem funcionando.

---

## Tabelas {#tables}

Tabelas são uma fonte comum de erros de tradução. Cada célula é traduzida individualmente; os separadores de coluna e a sintaxe de alinhamento são preservados.

| Recurso                | Status         | Observações                                                      |
|------------------------|----------------|------------------------------------------------------------------|
| Tradução Markdown      | ✅ Estável      | Segmentos armazenados em cache no SQLite                         |
| Extração de strings da interface | ✅ Estável | Lê chamadas `t("…")` |
| Strings de interface com plurais | ✅ Estável      | `t("…", { plurals: true, count })`; sufixos de catálogo + JSON plano |
| Tradução de rótulos JSON | ✅ Estável | JSON da barra lateral/navegação do Docusaurus |
| Tradução de texto SVG | ✅ Estável | Preserva a estrutura SVG |
| Aplicação de glossário | ✅ Estável | Glossário CSV por projeto |
| Concorrência em lote | ✅ Configurável | chave `batchConcurrency` |

### Suporte a Texto da Esquerda para a Direita e da Direita para a Esquerda {#left-to-right-and-right-to-left-support}

A internacionalização moderna precisa acomodar tanto idiomas da esquerda para a direita (LTR) quanto da direita para a esquerda (RTL). `ai-i18n-tools` garante o tratamento correto da direção do texto em todo o fluxo de tradução:

- O pipeline preserva automaticamente a direcionalidade de cada localidade. Por exemplo, o árabe (`ar`) é exibido em RTL, enquanto o inglês (`en-GB`), o português (`pt`) e outros permanecem em LTR.
- Ao traduzir tabelas em Markdown, exemplos de código ou strings de interface, as ferramentas mantêm o alinhamento e a estrutura do conteúdo, de modo que tabelas e blocos formatados sejam exibidos naturalmente em contextos LTR e RTL.
- O Docusaurus e o aplicativo exemplo Next.js respeitam a direção do localidade no navegador, alternando o layout e o alinhamento do texto conforme apropriado.

| Direcionalidade | Exemplo de Localidade  | Exibição               |
|:--------------:|:-----------------------|:-----------------------|
|      LTR       | `en-GB`, `es`, `pt-BR` | Padrão da esquerda para a direita |
|      RTL       | `ar`, `fa`, `he`       | Layout da direita para a esquerda  |

Isso garante que documentos e interfaces sejam exibidos corretamente, independentemente do idioma ou direção de leitura do usuário.

---

## Listas {#lists}

### Não ordenadas {#unordered}

- O cache de tradução armazena um hash de cada segmento de origem.
- Apenas segmentos cujo hash foi alterado desde a última execução são enviados ao LLM.
- Isso torna as execuções incrementais muito rápidas — normalmente apenas algumas chamadas à API para pequenas edições.

### Ordenadas {#ordered}

1. Adicione `ai-i18n-tools` como dependência de desenvolvimento.
2. Crie `ai-i18n-tools.config.json` na raiz do seu projeto.
3. Execute `npx ai-i18n-tools sync` para realizar a primeira tradução completa.
4. Confirme os arquivos de localidade gerados junto com seu código-fonte.
5. Em execuções subsequentes, apenas os segmentos alterados são traduzidos novamente.

### Aninhadas {#nested}

- **Pipeline de documentos**
  - Origem: qualquer arquivo `.md` ou `.mdx`
  - Saída: árvore Docusaurus `i18n/` ou cópias traduzidas planas
  - Cache: SQLite, indexado por caminho do arquivo + hash do segmento
- **Pipeline de strings de interface**
  - Origem: arquivos JS/TS com chamadas `t("…")` (incluindo plurais via `{ plurals: true, count }`)
  - Saída: JSON plano por localidade (`de.json`, `fr.json`, …) com chaves sufixadas para categorias de plural quando aplicável
  - Cache: o próprio catálogo mestre `strings.json`

---

## Strings de interface com plurais {#plural-ui-strings}

Documentos Markdown neste site mostram tradução de **documento**. O comportamento de **plural** para textos de interface é mais fácil de ver no **exemplo Next.js agrupado** localizado ao lado de `docs-site/` em `examples/nextjs-app/`.

A página inicial desse aplicativo (`src/app/page.tsx`) inclui uma seção de **demonstração de plurais** e repete uma mensagem em várias contagens de exemplo, permitindo comparar a gramática entre localidades (por exemplo, árabe versus inglês). Cada linha chama:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Use `plurals: true` para que `extract` registre um grupo no plural em `locales/strings.json` e `translate-ui` preencha os arquivos planos por localidade em `public/locales/`. Em tempo de execução, o i18next resolve a chave com sufixo correta para o `count` ativo; o exemplo do Next conecta os auxiliares em `src/lib/i18n.ts`.

Para capturas de tela, URLs de localidade e estrutura de arquivos, consulte o **exemplo de plurais** no [README do exemplo Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Blocos de código {#code-blocks}

Blocos de código **nunca** são traduzidos. O texto ao redor é traduzido, mas cada caractere dentro do bloco delimitado é mantido exatamente como está.

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

> "A melhor internacionalização é invisível ao usuário — eles simplesmente veem seu próprio idioma."
>
> Uma tradução adequada vai além do vocabulário. Ela adapta o tom, formatos de data, formatação numérica e direção da leitura para parecer nativa em cada localidade.

---

## Guias (Docusaurus) {#tabs-docusaurus}

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

## Avisos (Docusaurus) {#admonitions-docusaurus}

Os títulos das advertências do Docusaurus são traduzidos; as cercas `:::` e as palavras-chave de tipo são preservadas.

:::note
Este documento é intencionalmente rico em recursos Markdown. Seu propósito principal é servir como um conjunto de testes para tradução — execute `sync` e inspecione a saída para verificar se cada elemento é tratado corretamente.
:::

:::tip
Você pode substituir a tradução de qualquer segmento editando o arquivo de saída e executando `sync` novamente. A ferramenta detectará suas edições e adicionará automaticamente a frase corrigida ao glossário do projeto.
:::

:::warning
Não confirme o diretório `.translation-cache/` no controle de versão. O cache é específico da máquina e será regenerado em cada nova clonagem.
:::

:::danger
Excluir o diretório de cache força a tradução completa de todos os segmentos do zero. Isso pode ser custoso se seus documentos forem grandes. Use `sync --no-cache-write` para fazer um teste sem salvar os resultados.
:::

---

## Imagens e reescrita de caminhos com reconhecimento de localidade {#images-and-locale-aware-path-rewriting}

O texto alternativo das imagens é traduzido para cada localidade. Além disso, o `ai-i18n-tools` também pode **reescrever caminhos de imagens** na saída traduzida por meio do `postProcessing.regexAdjustments` — para que cada localidade possa apontar para sua própria captura de tela, em vez de sempre mostrar a versão em inglês.

O documento de origem (inglês) faz referência a:

```markdown
![The example Next.js app running in English](/img/screenshots/pt-BR/screenshot.png)
```

A entrada de configuração para este site de documentação inclui:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/pt-BR/",
    "replace": "screenshots/${translatedLocale}/"
  }
]
```

Após a tradução, a saída em alemão torna-se:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Aqui está a captura de tela real do aplicativo Next.js — ele está em inglês por padrão, mas se você estiver lendo isto em um idioma traduzido, a imagem abaixo deve mostrar o aplicativo no seu idioma:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/pt-BR/screenshot.png)

---

## Regras horizontais e quebras de linha {#horizontal-rules-and-line-breaks}

Uma regra horizontal (`---`) é um elemento estrutural e não é traduzida.

O conteúdo acima e abaixo dela é tratado como segmentos separados, fornecendo ao LLM janelas de contexto mais limpas.
