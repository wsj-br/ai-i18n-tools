<a id="runtime-helpers"></a>
# Auxiliares de tempo de execução

Esses auxiliares são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

Use-os na inicialização do seu aplicativo (`src/i18n.js`), no seletor de idioma e em qualquer código não-React que precise de utilitários de direção ou string. Para conexão de ponta a ponta, comece com [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime); para menus de idioma e RTL, consulte [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher).

<a id="import-patterns"></a>
## Padrões de importação

A **exportação padrão** é apenas o namespace i18next-helper (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importe `interpolateTemplate`, `flipUiArrowsForRtl`, auxiliares de exibição e tipos como **exportações nomeadas** — eles não são propriedades na exportação padrão.

```js
// Namespace style (common in i18n bootstrap files)
import aiI18n from 'ai-i18n-tools/runtime';
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

// Named imports (language switcher, one-off utilities)
import {
  getUILanguageLabel,
  getTextDirection,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
```

<a id="quick-reference"></a>
## Referência rápida

| Exportação | Função |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | Opções padrão de i18next `init()` para configurações de chave como padrão. |
| `setupKeyAsDefaultT(i18n, options)` | **Ponto de entrada de aplicativo recomendado** — wrapper de corte de chave, pacote plural de origem opcional, `wrapT` com reconhecimento de plural. |
| `wrapT(i18n, options)` | Wrapper de `t()` plural de nível inferior (geralmente instalado por `setupKeyAsDefaultT`). |
| `buildPluralIndexFromStringsJson(entries)` | Constrói o mapa `literal → groupId` que `wrapT` usa a partir de linhas `strings.json` com `"plural": true`. |
| `extractInterpolationNamesForWrap(message)` | Analisa nomes de placeholders <code v-pre>{{var}}</code> de uma string de origem. |
| `wrapI18nWithKeyTrim(i18n)` | Apenas fallback de <code v-pre>{{var}}</code> de localidade de origem + key-trim. **Obsoleto** para conexão de aplicativo — use `setupKeyAsDefaultT`. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | Constrói o mapa `localeLoaders` para `makeLoadLocale` a partir de `ui-languages.json` (cada `code` exceto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | Fábrica para carregamento assíncrono de JSON de localidade via `addResourceBundle`. |
| `RTL_LANGS` | Conjunto somente leitura de códigos de idioma base RTL (fallback quando uma localidade está faltando no catálogo empacotado). |
| `getTextDirection(lng)` | Retorna `'ltr'` ou `'rtl'` para um código BCP-47. |
| `applyDirection(lng, element?)` | Define o atributo `dir` em `document.documentElement` (navegador) ou em um elemento personalizado. |
| `getUILanguageLabel(lang, t)` | Rótulo do menu de idioma usando `t(englishName)` quando traduzido. |
| `getUILanguageLabelNative(lang)` | Rótulo do menu de idioma apenas dos campos do manifesto (`englishName / label`). |
| `interpolateTemplate(str, vars)` | Substituição de <code v-pre>{{var}}</code> de baixo nível em uma string simples (prefira `t()` em React/i18next). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverte `→` para `←` em layouts da direita para a esquerda (RTL). |

<a id="rtl-helpers"></a>
### Auxiliares de RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` consulta primeiro o catálogo `data/ui-languages-complete.json` empacotado (mesma fonte que `generate-ui-languages`), depois retorna para `RTL_LANGS` para códigos não presentes no catálogo.

`applyDirection` é seguro no Node.js — ele não faz nada quando `document` não está disponível. No navegador, omita `element` para atualizar `document.documentElement`. Conecte-o na mudança de idioma: `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### Fábricas de configuração do i18next

```ts
defaultI18nInitOptions(sourceLocale?: string): {
  resources: Record<string, never>;
  lng: string;
  fallbackLng: string;
  parseMissingKeyHandler: (key: string) => string;
  interpolation: { escapeValue: false };
  nsSeparator: false;
}

setupKeyAsDefaultT(
  i18n: I18nLike & Partial<Pick<I18nWithResources, 'addResourceBundle'>>,
  options: SetupKeyAsDefaultTOptions
): void

// SetupKeyAsDefaultTOptions:
// {
//   stringsJson: Record<string, { plural?: boolean; source?: string }>;
//   sourcePluralFlatBundle?: { lng: string; bundle: Record<string, string> };
// }

wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
// WrapTOptions: { pluralIndex: Record<string, string> }

buildPluralIndexFromStringsJson(
  entries: Record<string, { plural?: boolean; source?: string }>
): Record<string, string>

extractInterpolationNamesForWrap(message: string): string[]

makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>

makeLoadLocale(
  i18n: I18nLike & Pick<I18nWithResources, 'addResourceBundle'>,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Use `setupKeyAsDefaultT` como ponto de entrada habitual do aplicativo (chave recortada + plural `wrapT` + opcional `translate-ui` `{sourceLocale}.json`). Chamar apenas `wrapI18nWithKeyTrim` é **obsoleto** para configuração de aplicativos.

`sourcePluralFlatBundle` requer uma instância i18next com `addResourceBundle()`. O campo `lng` deve corresponder a `SOURCE_LOCALE` no seu arquivo de inicialização e a `sourceLocale` em `ai-i18n-tools.config.json`.

Crie `localeLoaders` com `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que as chaves permaneçam alinhadas com `targetLocales` após `generate-ui-languages`. Consulte [Wire i18next](/pt-BR/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) e [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`makeT` personalizado sem i18next).

<a id="display-helpers"></a>
### Auxiliares de exibição

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` é exportado como `{ readonly code: string }` — o formato mínimo para linhas de manifesto em `makeLocaleLoadersFromManifest`. Os auxiliares de exibição também precisam de `englishName` (e `label` para `getUILanguageLabelNative`) das entradas `ui-languages.json` do seu projeto (`{ code, label, englishName, direction }`). Consulte [Language switcher & RTL](/pt-BR/guide/ui-strings/language-switcher#language-switcher-ui) para um exemplo completo.

<a id="string-helpers"></a>
### Auxiliares de string

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` substitui placeholders <code v-pre>{{name}}</code> onde `name` corresponde a `\w+` (apenas caracteres de palavra ASCII). Chaves com espaços ou hífens não são suportadas. `wrapI18nWithKeyTrim` usa isso internamente para fallback de localidade de origem quando nenhuma tradução existe.

Em componentes React/i18next, prefira <code v-pre>t('key {{var}}', { var })</code> — o i18next lida com a interpolação nativamente.

<a id="exported-types"></a>
### Tipos exportados

Também exportado para consumidores TypeScript: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
