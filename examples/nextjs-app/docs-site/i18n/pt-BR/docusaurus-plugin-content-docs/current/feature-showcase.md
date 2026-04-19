---
sidebar_position: 1
title: Exemplo de Recursos de Tradução
description: >-
  Um documento de referência que demonstra todos os elementos Markdown que o
  ai-i18n-tools sabe como traduzir.
translation_last_updated: '2026-04-18T22:42:45.762Z'
source_file_mtime: '2026-04-18T18:55:00.042Z'
source_file_hash: 9a1262e2b79dcc6a169c7429b15224715eea5880586ab4d9763c1176ae358e99
translation_language: pt-BR
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Exemplo de Recursos de Tradução

Esta página existe para demonstrar como o `ai-i18n-tools` lida com todos os elementos Markdown comuns. Execute `sync` nela e compare a saída em cada pasta de localidade para ver exatamente o que é traduzido e o que permanece inalterado.

---

## Prosa simples

Internacionalização vai além de trocar palavras. Um bom pipeline de tradução preserva a estrutura do documento, mantém os identificadores técnicos intactos e envia apenas texto legível por humanos ao modelo de linguagem.

O `ai-i18n-tools` divide cada documento em **segmentos** antes de enviá-los ao LLM. Cada segmento é traduzido independentemente e depois recombinado, de modo que uma alteração em um parágrafo não invalida as traduções em cache do restante do arquivo.

---

## Formatação em linha

O tradutor deve manter toda a formatação em linha sem alterar a marcação:

- **Texto em negrito** sinaliza importância e deve permanecer em negrito após a tradução.
- _Texto em itálico_ é usado para ênfase ou títulos; o significado deve ser preservado.
- ~~Tachado~~ marca conteúdo obsoleto ou removido.
- `código em linha` é **nunca** traduzido — identificadores, nomes de funções e caminhos de arquivos devem permanecer inalterados.
- Um [hiperlink](https://github.com/your-org/ai-i18n-tools) mantém sua URL original; apenas o rótulo do link é traduzido.

---

## Cabeçalhos em todos os níveis

### H3 — Configuração

#### H4 — Diretório de saída

##### H5 — Nomeação de arquivos

###### H6 — Tratamento de extensões

Todos os níveis de cabeçalho traduzem o texto, mas mantêm os IDs de âncora inalterados para que links profundos existentes continuem funcionando.

---

## Tabelas

Tabelas são uma fonte comum de erros de tradução. Cada célula é traduzida individualmente; os separadores de coluna e a sintaxe de alinhamento são preservados.

| Recurso | Status | Notas |
|---|---|---|
| Tradução de Markdown | ✅ Estável | Segmentos armazenados em cache no SQLite |
| Extração de strings da interface | ✅ Estável | Lê chamadas `t("…")` |
| Strings de interface com plurais cardinais | ✅ Estável | `t("…", { plurals: true, count })`; catálogo + sufixos JSON planos |
| Tradução de rótulos JSON | ✅ Estável | JSON de barra lateral/barra de navegação do Docusaurus |
| Tradução de texto SVG | ✅ Estável | Preserva a estrutura SVG |
| Aplicação de glossário | ✅ Estável | Glossário CSV por projeto |
| Concorrência em lote | ✅ Configurável | chave `batchConcurrency`

### Variantes de alinhamento

| Alinhado à esquerda | Centralizado | Alinhado à direita |
|:---|:---:|---:|
| Localidade de origem | `en-GB` | obrigatório |
| Localidades de destino | até 20 | recomendado |
| Concorrência | 4 | padrão |

---

## Listas

### Não ordenadas

- O cache de tradução armazena um hash de cada segmento de origem.
- Apenas segmentos cujo hash foi alterado desde a última execução são enviados ao LLM.
- Isso torna as execuções incrementais muito rápidas — normalmente apenas algumas chamadas à API para pequenas edições.

### Ordenadas

1. Adicione `ai-i18n-tools` como dependência de desenvolvimento.
2. Crie `ai-i18n-tools.config.json` na raiz do seu projeto.
3. Execute `npx ai-i18n-tools sync` para realizar a primeira tradução completa.
4. Confirme os arquivos de localidade gerados junto com seu código-fonte.
5. Em execuções subsequentes, apenas os segmentos alterados são traduzidos novamente.

### Aninhadas

- **Pipeline de documentos**
  - Origem: qualquer arquivo `.md` ou `.mdx`
  - Saída: árvore Docusaurus `i18n/` ou cópias traduzidas planas
  - Cache: SQLite, indexado por caminho do arquivo + hash do segmento
- **Pipeline de strings de interface**
  - Origem: arquivos JS/TS com chamadas `t("…")` (incluindo plurais cardinais via `{ plurals: true, count }`)
  - Saída: JSON plano por localidade (`de.json`, `fr.json`, …) com chaves sufixadas para categorias plurais quando aplicável
  - Cache: o próprio catálogo mestre `strings.json`

---

## Strings de interface com plurais cardinais (aplicativo complementar Next.js)

Os documentos Markdown neste site mostram a tradução de **documento**. O comportamento de **plurais cardinais** para textos de interface é mais fácil de observar no **exemplo Next.js agrupado**, localizado ao lado de `docs-site/` em `examples/nextjs-app/`.

A página inicial desse aplicativo (`src/app/page.tsx`) inclui uma seção de **demonstração de plurais** e repete uma mensagem em várias contagens de exemplo para que você possa comparar a gramática entre localidades (por exemplo, árabe versus inglês). Cada linha chama:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Use **`plurals: true`** para que **`extract`** registre um grupo plural em `locales/strings.json` e **`translate-ui`** preencha os arquivos planos por localidade em `public/locales/`. Em tempo de execução, o i18next resolve a chave sufixada correta para o **`count`** ativo; o exemplo Next.js integra helpers em **`src/lib/i18n.ts`**.

Para capturas de tela, URLs de localidade e estrutura de arquivos, consulte o **exemplo de plurais cardinais** no [README do exemplo Next.js](../../README.md).

---

## Blocos de código

Blocos de código são **nunca** traduzidos. O texto ao redor é traduzido, mas cada caractere dentro do bloco delimitado é mantido exatamente como está.

### Shell

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### Configuração JSON

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

### TypeScript

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

## Citações em bloco

> "A melhor internacionalização é invisível ao usuário — eles simplesmente veem seu próprio idioma."
>
> Uma tradução adequada vai além do vocabulário. Ela adapta o tom, formatos de data, formatação numérica e direção da leitura para parecer nativa em cada localidade.

---

## Advertências (Docusaurus)

Os títulos das advertências do Docusaurus são traduzidos; as cercas `:::` e palavras-chave de tipo são preservadas.

:::note
Este documento é intencionalmente rico em recursos Markdown. Seu propósito principal é servir como um exemplo de teste de tradução — execute `sync` e inspecione a saída para verificar se cada elemento é tratado corretamente.
:::

:::tip
Você pode substituir a redação traduzida de qualquer segmento editando o arquivo de saída e executando `sync` novamente. A ferramenta detectará suas edições e adicionará automaticamente a frase corrigida ao glossário do projeto.
:::

:::warning
Não confirme o diretório `.translation-cache/` no controle de versão. O cache é específico da máquina e será regenerado em cada nova clonagem.
:::

:::danger
Excluir o diretório de cache força a tradução de todos os segmentos do zero. Isso pode ser custoso se seus documentos forem grandes. Use `sync --no-cache-write` para fazer um teste sem salvar os resultados.
:::

---

## Imagens e reescrita de caminhos com reconhecimento de localidade

O texto alternativo da imagem é traduzido para cada localidade. Além disso, `ai-i18n-tools` também pode **reescrever caminhos de imagens** na saída traduzida por meio de `postProcessing.regexAdjustments` — para que cada localidade possa apontar para sua própria captura de tela, em vez de sempre mostrar a versão em inglês.

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

Aqui está a captura de tela real em inglês — se você estiver lendo isto em uma localidade traduzida, a imagem abaixo deverá mostrar o aplicativo no seu idioma:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/pt-BR/screenshot.png)

---

## Linhas horizontais e quebras de linha

Uma linha horizontal (`---`) é um elemento estrutural e não é traduzida.

O conteúdo acima e abaixo dela é tratado como segmentos separados, fornecendo janelas de contexto mais claras para o LLM.
