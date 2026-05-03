<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Versão do npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Downloads do npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licença: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

Kit de ferramentas CLI e programático para internacionalização de aplicações e sites de documentação em JavaScript/TypeScript. Extrai strings da interface, traduz com LLMs via OpenRouter e gera arquivos JSON prontos para uso com i18next, além de pipelines para markdown, JSON do Docusaurus e ativos SVG autônomos.

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabela de Conteúdos**

- [Dois fluxos de trabalho principais](#two-core-workflows)
- [Instalação](#installation)
  - [Usando a CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Primeiros passos](#quick-start)
  - [Fluxo de trabalho 1 - Strings da interface](#workflow-1---ui-strings)
  - [Fluxo de trabalho 2 - Documentação](#workflow-2---documentation)
  - [Ambos os fluxos de trabalho](#both-workflows)
- [Auxiliares de tempo de execução](#runtime-helpers)
- [Comandos da CLI](#cli-commands)
- [Documentação](#documentation)
- [Licença](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Dois fluxos de trabalho principais

**Fluxo 1 - Tradução da interface** (React, Next.js, Node.js, qualquer projeto com i18next)

Gera um catálogo mestre (`strings.json` com metadados opcionais por localidade `models`) a partir de **literais** `t("…")` / `i18n.t("…")`, opcionalmente `package.json` `description`, e opcionalmente cada `englishName` de `ui-languages.json` quando habilitado na configuração. Traduz entradas ausentes por localidade via OpenRouter e gera arquivos JSON planos (`de.json`, `pt-BR.json`, …) prontos para i18next.

**Fluxo 2 - Tradução de documentos** (Markdown, JSON do Docusaurus)

Traduz `.md` e `.mdx` do conteúdo `contentPaths` de cada bloco `documentations` e arquivos JSON de rótulos desse bloco `jsonSource` quando habilitado. Suporta layouts estilo Docusaurus e planos com sufixo de localidade por bloco (`documentations[].markdownOutput`). O `cacheDir` raiz compartilhado armazena o cache em SQLite, de modo que apenas segmentos novos ou alterados são enviados ao LLM. **SVG:** habilite `features.translateSVG`, adicione o bloco `svg` no nível superior e use `translate-svg` (também executado a partir de `sync` quando ambos estiverem definidos).

Ambos os fluxos compartilham um único arquivo `ai-i18n-tools.config.json` e podem ser usados independentemente ou em conjunto. A tradução autônoma de SVG usa `features.translateSVG` mais o bloco `svg` no nível superior e é executada por meio de `translate-svg` (ou do estágio SVG dentro de `sync`).

---

<a id="installation"></a>
## Instalação

O pacote publicado é apenas **ESM** (`"type": "module"`). Use `import` no Node.js, em bundlers ou no `import()` — `require('ai-i18n-tools')` **não é suportado.** O pacote declara **`engines.node` `>=22.16.0`**; versões mais antigas do Node.js não são suportadas.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

### Usando a CLI

**Por projeto (recomendado)** — instale como dependência ou devDependency, depois execute via `npx`, `pnpm exec` ou um script `package.json`:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

O gerenciador de pacotes grava `node_modules/.bin/ai-i18n-tools` com as permissões corretas no Linux e macOS e os shims `.cmd` / `.ps1` no Windows; os executores de scripts o detectam automaticamente.

**Bare** `ai-i18n-tools` **no terminal** — os scripts `package.json` já são executados com `node_modules/.bin` no `PATH`, então comandos como `pnpm run i18n:sync` invocam a CLI sem digitar `npx`. Para executar `ai-i18n-tools` diretamente em um shell interativo (a partir da raiz do projeto, após instalação local), adicione o diretório bin local ao `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Com [direnv](https://direnv.net/), adicione `PATH_add node_modules/.bin` a um `.envrc` na raiz do projeto para que o comando puro esteja disponível após entrar no repositório com `cd`. Sem ajustar `PATH`, continue usando `npx ai-i18n-tools …` ou `pnpm exec ai-i18n-tools …`.

**Execução única sem instalação** — use `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (faz o download do pacote para aquela execução; sem entrada em `package.json`).

No Linux, macOS e WSL, as instalações do registro definem automaticamente o bit executável no script CLI. No Windows, os gerenciadores de pacotes geram `.cmd` e `.ps1` shims que invocam o Node explicitamente.

Defina sua chave de API do OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Comandos que chamam o OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models` e scripts relacionados) precisam de `OPENROUTER_API_KEY` no ambiente.

Em `ai-i18n-tools.config.json`, o objeto `openrouter` inclui listas de modelos, `baseUrl`, `maxTokens`, `temperature` e `requestTimeoutMs`: o tempo máximo em milissegundos para aguardar cada requisição HTTP ao OpenRouter (conclusões de chat e chamadas internas `GET /models`). O padrão é `30000` (30 segundos).

Execute `ai-i18n-tools check-models` para verificar cada ID de modelo configurado em relação ao catálogo atualizado do OpenRouter. Ele informa os IDs ausentes ou expirados `expiration_date`, lista os modelos válidos com preços estimados de entrada/saída (USD por 1 milhão de tokens) e encerra com um status diferente de zero caso algum ID configurado seja inválido. Requer `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Primeiros passos

<a id="workflow-1---ui-strings"></a>
### Fluxo de trabalho 1 - Strings da interface

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Integre o i18next em seu aplicativo usando os auxiliares de `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### Fluxo de trabalho 2 - Documentação

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### Ambos os fluxos de trabalho

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## Auxiliares de tempo de execução

Os seguintes auxiliares são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript. Você não precisa importar o i18next para usá-los:

| Auxiliar | Descrição |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Opções padrão de inicialização do i18next para configurações com chave como valor padrão. |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Conexão recomendada: key-trim + plural `wrapT` de `strings.json`, opcionalmente mescla chaves plurais `translate-ui` `{sourceLocale}.json`. |
| `wrapI18nWithKeyTrim(i18n)` | Apenas um invólucro de nível inferior para key-trim (obsoleto para conexão de aplicativo; prefira `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Gera o mapa `localeLoaders` para `makeLoadLocale` a partir de `ui-languages.json` (cada `code` exceto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para carregamento assíncrono de arquivos de localidade. |
| `getTextDirection(lng)` | Retorna `'ltr'` ou `'rtl'` para um código BCP-47. |
| `applyDirection(lng, element?)` | Define o atributo `dir` em `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Rótulo exibido para uma linha no menu de idiomas (com i18n). |
| `getUILanguageLabelNative(lang)` | Rótulo exibido sem chamar `t()` (estilo cabeçalho). |
| `interpolateTemplate(str, vars)` | Substituição de baixo nível `{{var}}` em uma string simples (usado internamente; o código do aplicativo deve usar `t()`). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverte `→` para `←` em layouts da direita para a esquerda (RTL). |

---

<a id="cli-commands"></a>
## Comandos da CLI

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Opções globais em todos os comandos: `-c <config>` (padrão: `ai-i18n-tools.config.json`), `-v` (verboso), opcional `-w` / `--write-logs [path]` para duplicar a saída do console em um arquivo de log (padrão: no diretório de cache de traduções), `-V` / `--version`, e `-h` / `--help`. Veja [Introdução](docs/GETTING_STARTED.pt-BR.md#cli-reference) para as opções específicas de cada comando.

---

<a id="documentation"></a>
## Documentação

- [Introdução](docs/GETTING_STARTED.pt-BR.md) - guia completo de configuração para ambos os fluxos de trabalho, referência da CLI e referência dos campos de configuração.
- [Visão Geral do Pacote](docs/PACKAGE_OVERVIEW.pt-BR.md) - arquitetura, componentes internos, API programática e pontos de extensão.
- [Contexto para Agentes de IA](../docs/ai-i18n-tools-context.md) - **para aplicativos que usam o pacote:** prompts de integração para projetos downstream (copie para as regras do agente no seu repositório).
- Detalhes internos para mantenedores **deste** repositório: `dev/package-context.md` (apenas clone; não está no npm).

---

<a id="license"></a>
## Licença

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
