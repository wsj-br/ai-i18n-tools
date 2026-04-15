# ai-i18n-tools

Kit de ferramentas CLI e programático para internacionalização de aplicações e sites de documentação em JavaScript/TypeScript. Extrai strings de interface, traduz com LLMs via OpenRouter e gera arquivos JSON prontos para uso em múltiplos idiomas para o i18next, além de pipelines para markdown, JSON do Docusaurus e (por meio de `features.translateSVG`, `translate-svg` e o bloco `svg`) ativos SVG autônomos.

<small>**Leia em outros idiomas:** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## Dois fluxos de trabalho principais

**Fluxo de Trabalho 1 - Tradução de UI** (React, Next.js, Node.js, qualquer projeto i18next)

Cria um catálogo mestre (`strings.json` com metadados opcionais por localidade **`models`**) a partir de literais **`t("…")` / `i18n.t("…")`**, opcionalmente **`package.json` `description`**, e opcionalmente cada **`englishName`** de `ui-languages.json` quando habilitado na configuração. Traduz entradas ausentes por localidade via OpenRouter e gera arquivos JSON planos (`de.json`, `pt-BR.json`, …) prontos para uso com i18next.

**Fluxo de Trabalho 2 - Tradução de Documentos** (Markdown, JSON do Docusaurus)

Traduz arquivos `.md` e `.mdx` dos `contentPaths` de cada bloco `documentations` e arquivos JSON de rótulos da `jsonSource` desse bloco quando habilitado. Suporta layouts com sufixos de idioma no estilo Docusaurus e layouts planos por bloco (`documentations[].markdownOutput`). O `cacheDir` raiz compartilhado armazena o cache SQLite para que apenas segmentos novos ou alterados sejam enviados ao LLM. **SVG:** habilite `features.translateSVG`, adicione o bloco `svg` no nível superior e use `translate-svg` (também executado por `sync` quando ambos estiverem configurados).

Ambos os fluxos de trabalho compartilham um único arquivo `ai-i18n-tools.config.json` e podem ser usados de forma independente ou em conjunto. A tradução autônoma de SVG usa `features.translateSVG` mais o bloco `svg` no nível superior e é executada por meio de `translate-svg` (ou pelo estágio SVG dentro de `sync`).

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

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
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
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
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
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Opções globais para todos os comandos: `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (verboso), opcional `-w` / `--write-logs [path]` para redirecionar a saída do console para um arquivo de log (padrão: dentro do diretório de cache de traduções), `-V` / `--version` e `-h` / `--help`. Veja [Introdução](docs/GETTING_STARTED.pt-BR.md#cli-reference) para as opções específicas de cada comando.

---

## Documentação

- [Introdução](docs/GETTING_STARTED.pt-BR.md) - guia completo de configuração para ambos os fluxos de trabalho, referência da CLI e referência dos campos de configuração.
- [Visão Geral do Pacote](docs/PACKAGE_OVERVIEW.pt-BR.md) - arquitetura, componentes internos, API programática e pontos de extensão.
- [Contexto do Agente de IA](../docs/ai-i18n-tools-context.md) - **para aplicativos que usam o pacote:** prompts de integração para projetos downstream (copie para as regras do agente no seu repositório).
- Internals do mantenedor para **este** repositório: `dev/package-context.md` (apenas clone; não está no npm).

---

## Licença

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
