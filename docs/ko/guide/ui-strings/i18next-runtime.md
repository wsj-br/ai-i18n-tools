<a id="wire-i18next-at-runtime"></a>
# 런타임에 i18next 연결

`'ai-i18n-tools/runtime'`에서 내보낸 헬퍼를 사용하여 i18n 설정 파일을 만듭니다. API 시그니처는 [런타임 헬퍼](/guide/runtime-helpers)를 참조하십시오.

<details>
<summary>i18n 부트스트랩 전체 예제(src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
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
## `SOURCE_LOCALE` 정렬 유지

**세 값을 일치시켜 유지하세요:** `ai-i18n-tools.config.json`의 `sourceLocale`, 이 파일의 `SOURCE_LOCALE`, 그리고 평면 출력 디렉터리 아래에 `translate-ui`이 `{sourceLocale}.json`로 작성하는 복수형 평면 JSON (보통 `public/locales/`). 정적 `import`에서 동일한 기본 이름을 사용하세요 (위의 예: `en-GB` → `en-GB.json`). `sourcePluralFlatBundle`의 `lng` 필드는 `SOURCE_LOCALE`과 같아야 합니다. 정적 ES `import` 경로는 변수를 사용할 수 없습니다. 소스 로케일을 변경하는 경우 `SOURCE_LOCALE`과 가져오기 경로를 함께 업데이트하세요. 또는 동적 `import(\`을 사용하여 해당 파일을 로드하세요. ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, 또는 `readFileSync`처럼 경로가 `SOURCE_LOCALE`에서 생성되도록 합니다.

이 코드 조각은 `i18n`가 해당 폴더 옆에 위치하는 것처럼 `./locales/…`과 `./public/locales/…`을 사용합니다. 파일이 `src/` 아래에 있는 경우(일반적인 경우), `../locales/…`와 `../public/locales/…`를 사용하여 가져오기가 `ui.stringsJson`, `uiLanguagesPath`, `ui.flatOutputDir`와 동일한 경로를 참조하도록 하세요.

React가 렌더링되기 전에 `i18n.js`을(를) 가져옵니다(예: 진입점 상단). 사용자가 언어를 변경하면 `await loadLocale(code)`을(를) 호출한 다음 `await i18n.changeLanguage(code)`을(를) 호출합니다.

`SOURCE_LOCALE`은 다른 파일(예: 언어 전환기)에서 직접 `'./i18n'`을 통해 가져올 수 있도록 내보내집니다. 기존의 i18next 설정을 마이그레이션하는 경우, 컴포넌트 전반에 흩어진 하드코딩된 소스 로케일 문자열(예: `'en-GB'` 확인 코드)을 i18n 부트스트랩 파일에서 `SOURCE_LOCALE`을 가져오는 방식으로 대체하세요.

기본 내보내기를 사용하지 않고 이름을 지정해 가져오기를 선호하는 경우에도 이름 지정된 가져오기(`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`)가 동일하게 작동합니다.

<a id="locale-loaders"></a>
## 로케일 로더

`ui-languages.json`에서 `makeLocaleLoadersFromManifest`를 사용하여 `localeLoaders`을 **구성과 동기화** 상태로 유지합니다(이 작업은 `makeLoadLocale`와 동일한 정규화를 사용하여 `SOURCE_LOCALE`를 필터링함). `targetLocales`에 로캘을 추가하고 `generate-ui-languages`을 실행하면 매니페스트가 업데이트되고 로더가 자동으로 변경 사항을 추적하므로 별도의 하드코딩된 맵을 관리할 필요가 없습니다.

`public/` 아래의 JSON 번들(일반적인 Next.js 설정)의 경우 공용 URL 경로에서 가져옵니다:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

번들러가 없는 Node CLI의 경우 각 코드에 대해 JSON 파일을 읽고 구문 분석하는 작은 도우미 내에서 `readFileSync`을 사용합니다.

일반적인 앱 진입점(키 트리밍 + 복수형 `wrapT` + 선택적 `translate-ui` `{sourceLocale}.json`)으로 `setupKeyAsDefaultT`를 사용합니다. 애플리케이션 연결을 위해 `wrapI18nWithKeyTrim`만 호출하는 것은 **더 이상 사용되지 않습니다**. [런타임 헬퍼](/guide/runtime-helpers)를 참조하십시오.
