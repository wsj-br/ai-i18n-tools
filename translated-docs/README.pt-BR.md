---
translation_last_updated: '2026-04-13T00:28:22.017Z'
source_file_mtime: '2026-04-13T00:12:20.078Z'
source_file_hash: e18e8298ff645bc6b54dc44e33f5afcd538eef92699118fc92ccc8746d207cc3
translation_language: pt-BR
source_file_path: README.md
---
# ai-i18n-tools

Kit de ferramentas CLI e programático para internacionalizar aplicações e sites de documentação em JavaScript/TypeScript. Extrai strings da interface do usuário, traduz com LLMs via OpenRouter e gera arquivos JSON prontos para localidade para i18next, além de pipelines para markdown, JSON do Docusaurus e (via `translate-svg`) ativos SVG independentes.

<small>**Leia em outros idiomas:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## Dois fluxos de trabalho principais

**Fluxo de Trabalho 1 - Tradução de UI** (React, Next.js, Node.js, qualquer projeto i18next)

Escaneia arquivos fonte em busca de chamadas `t("…")`, constrói um catálogo mestre (`strings.json` com metadados **`models`** opcionais por localidade), traduz entradas ausentes por localidade via OpenRouter e escreve arquivos JSON planos (`de.json`, `pt-BR.json`, …) prontos para i18next.

**Fluxo de Trabalho 2 - Tradução de Documentos** (Markdown, JSON do Docusaurus)

Traduz `.md` e `.mdx` de cada bloco `documentations` em `contentPaths` e arquivos de rótulo JSON do `jsonSource` desse bloco quando habilitado. Suporta layouts no estilo Docusaurus e planos com sufixos de localidade por bloco (`documentations[].markdownOutput`). O diretório raiz compartilhado `cacheDir` mantém o cache SQLite, de modo que apenas segmentos novos ou alterados sejam enviados ao LLM. **SVG:** use `translate-svg` com um bloco `svg` de nível superior (também executado a partir de `sync` quando `svg` está definido).

Ambos os fluxos de trabalho compartilham um único arquivo `ai-i18n-tools.config.json` e podem ser usados de forma independente ou conjunta. A tradução SVG independente é configurada através do bloco `svg` de nível superior e é executada através de `translate-svg` (ou a etapa SVG dentro de `sync`).

---

## Instalação

O pacote publicado é **apenas ESM** (`"type": "module"`). Use `import` do Node.js, empacotadores ou `import()` — **`require('ai-i18n-tools')` não é suportado.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Defina sua chave de API do OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Início rápido

### Fluxo de Trabalho 1 - Strings da UI

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Conecte i18next em seu aplicativo usando os auxiliares de `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### Fluxo de Trabalho 2 - Documentação

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### Ambos os fluxos de trabalho

```bash
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
```

---

## Auxiliares em tempo de execução

Exportado de `'ai-i18n-tools/runtime'` - funciona em qualquer ambiente JS, sem necessidade de importação do i18next:

| Auxiliar | Descrição |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Opções padrão de inicialização do i18next para configurações de chave como padrão. |
| `wrapI18nWithKeyTrim(i18n)` | Envolve `i18n.t` para que as chaves sejam cortadas antes da busca. |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para carregamento assíncrono de arquivos de localidade. |
| `getTextDirection(lng)` | Retorna `'ltr'` ou `'rtl'` para um código BCP-47. |
| `applyDirection(lng, element?)` | Define o atributo `dir` em `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Rótulo exibido para uma linha de menu de idioma (com i18n). |
| `getUILanguageLabelNative(lang)` | Rótulo exibido sem chamar `t()` (estilo cabeçalho). |
| `interpolateTemplate(str, vars)` | Substituição de baixo nível `{{var}}` em uma string simples (usado internamente; o código do aplicativo deve usar `t()` em vez disso). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverte `→` para `←` para layouts RTL. |

---

## Comandos CLI

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Todos os comandos aceitam `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (verbose) e opcionalmente `-w` / `--write-logs [caminho]` para adicionar a saída do console a um arquivo de log (padrão: sob o diretório de cache de tradução).

---

## Documentação

- [Introdução](GETTING_STARTED.pt-BR.md) - guia completo de configuração para ambos os fluxos de trabalho, todas as flags da CLI e referência de campos de configuração.  
- [Visão Geral do Pacote](PACKAGE_OVERVIEW.pt-BR.md) - arquitetura, internos, API programática e pontos de extensão.  
- [Contexto do Agente de IA](../docs/ai-i18n-tools-context.md) - contexto conciso do projeto para agentes e mantenedores que fazem alterações de código ou configuração.

---

## Licença

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
