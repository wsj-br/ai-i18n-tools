<a id="wire-i18next-at-runtime"></a>
# Conectar i18next em tempo de execução

Crie seu arquivo de configuração i18n usando os auxiliares exportados por `'ai-i18n-tools/runtime'`. Para assinaturas de API, consulte [Auxiliares de tempo de execução](/pt-BR/guide/runtime-helpers).

<details>
<summary>Exemplo completo de inicialização i18n (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
## Mantendo `SOURCE_LOCALE` alinhado

**Mantenha três valores alinhados:** `sourceLocale` em `ai-i18n-tools.config.json`, `SOURCE_LOCALE` neste arquivo e o JSON plano de plurais que `translate-ui` escreve como `{sourceLocale}.json` no seu diretório de saída plano (geralmente `public/locales/`). Use o mesmo nome base no `import` estático (exemplo acima: `en-GB` → `en-GB.json`). O campo `lng` em `sourcePluralFlatBundle` deve ser igual a `SOURCE_LOCALE`. Os caminhos estáticos ES `import` não podem usar variáveis; se você alterar o idioma de origem, atualize `SOURCE_LOCALE` e o caminho de importação juntos. Alternativamente, carregue esse arquivo com um `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch` ou `readFileSync` para que o caminho seja construído a partir de `SOURCE_LOCALE`.

O snippet usa `./locales/…` e `./public/locales/…` como se `i18n` estivesse ao lado dessas pastas. Se seu arquivo estiver em `src/` (o que é comum), use `../locales/…` e `../public/locales/…` para que as importações sejam resolvidas para os mesmos caminhos que `ui.stringsJson`, `languagesManifestPath` e `ui.flatOutputDir`.

Importe `i18n.js` antes que o React renderize (por exemplo, no topo do seu ponto de entrada). Quando o usuário alterar o idioma, chame `await loadLocale(code)` e, em seguida, `await i18n.changeLanguage(code)`.

`SOURCE_LOCALE` é exportado para que qualquer outro arquivo que precise dele (por exemplo, um seletor de idioma) possa importá-lo diretamente de `'./i18n'`. Se você estiver migrando uma configuração i18next existente, substitua strings fixas de idioma de origem (por exemplo, verificações `'en-GB'` espalhadas pelos componentes) por imports de `SOURCE_LOCALE` do seu arquivo de inicialização i18n.

Imports nomeados (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionam da mesma forma se você preferir não usar a exportação padrão.

<a id="locale-loaders"></a>
## Carregadores de localidade

Mantenha `localeLoaders` **alinhado com a configuração** derivando-os de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (isso filtra `SOURCE_LOCALE` usando a mesma normalização que `makeLoadLocale`). Quando você adiciona uma localidade a `targetLocales` e executa `generate-ui-languages`, o manifesto é atualizado e seus carregadores acompanham automaticamente a alteração — não é necessário manter um mapa fixo separado.

Para pacotes JSON em `public/` (configuração típica do Next.js), busque do seu caminho de URL pública:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Para CLIs Node sem empacotador, use `readFileSync` dentro de um pequeno auxiliar que leia e analise o arquivo JSON para cada código.

Use `setupKeyAsDefaultT` como o ponto de entrada usual do aplicativo (corte de chave + plural `wrapT` + `translate-ui` `{sourceLocale}.json` opcional). Chamar `wrapI18nWithKeyTrim` sozinho é **obsoleto** para a conexão do aplicativo — consulte [Auxiliares de tempo de execução](/pt-BR/guide/runtime-helpers).
