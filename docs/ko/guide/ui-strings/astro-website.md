<a id="astro-website"></a>
# Astro 웹사이트

정적 Astro 마케팅 또는 앱 사이트(일반 Astro, Starlight 아님)의 경우 [Astro 내장 i18n 라우팅](https://docs.astro.build/en/guides/internationalization/)과 ai-i18n-tools를 결합합니다. [Astro 통합](/guide/astro-integration)도 참조하세요.

참조 구현은 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)입니다([README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)도 참조). 영어는 `/`에 있고, 9개의 대상 로케일은 `/{locale}/`에 있습니다(`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## 하이브리드 파이프라인

대부분의 팀은 두 파이프라인의 **하이브리드**를 사용합니다(서로 충돌하지 않음):

| 파이프라인 | 용도 | 명령어 | 출력 |
|----------|---------|----------|--------|
| **페이지 HTML** | 템플릿 본문의 제목, 단락, 내비게이션 레이블, 인라인 배열 | `translate-docs` | 로케일별 `src/pages/{locale}/index.astro` |
| **UI 문자열(`t()`)** | 프론트매터 데이터, 스크린샷 탭 레이블, 공유 배열 | `extract` → `translate-ui` | `public/locales/{locale}.json`(영문 원문을 키로 사용) |

언어를 추가하거나 제거할 때 세 목록을 정렬된 상태로 유지합니다. `ai-i18n-tools.config.json`의 `targetLocales`, `astro.config.mjs`의 `i18n.locales`(Astro는 **소문자** 경로 코드(예: `pt-br`)를 사용함), `ui-languages.json`(`generate-ui-languages`를 통해). 플랫 번들 **파일 이름**은 구성 대소문자(예: `pt-BR.json`)를 사용합니다. Astro의 `pt-br` 경로를 매니페스트 `code` 필드를 통해 해당 파일에 매핑합니다(`examples/astro-website/src/i18n/locale.ts` 참조).

참조 프로젝트에서 가져온 예제 `package.json` 스크립트:

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI 문자열(SSG)

`init -t ui-astro-website`를 사용하여 UI 추출을 스캐폴드한 다음, 페이지 HTML도 번역할 때 `docs[]` 블록에 병합합니다([페이지 구문 분석 및 바꾸기](#astro-website-pages-parse-and-replace) 참조). TypeScript 모듈의 `t('…')`와 `.astro` 프런트매터(그리고 중복된 로케일 페이지보다 UI 문자열을 선호하는 경우 템플릿 `{expression}` 블록)에 복사본을 래핑합니다.

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

`astro.config.mjs`의 `i18n.defaultLocale`과 일치하도록 `sourceLocale`을 설정하세요. Astro가 빌드 시 가져올 수 있는 디렉터리에 평면 번들을 작성하세요(템플릿은 `public/locales/` 사용). 영문 원문 리터럴을 키로 조회하여 **빌드 시** `t('…')`를 해결하세요(`examples/astro-website/src/i18n/t.ts` 참조; `strings.json`은 런타임 번들이 아닌 추출 캐시임). 로드 후 언어 전환 기능을 클라이언트 아일랜드에 추가하지 않는 한 정적 사이트에서는 `ai-i18n-tools/runtime`이나 i18next가 **필요하지 않습니다**.

`t()`을 호출하는 모든 페이지(영문 루트 페이지 및 각 `src/pages/{locale}/` 복사본)에 연결하세요:

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

예제의 지원 헬퍼: 레이블, 방향, BCP-47 코드용 `src/i18n/utils.ts`, `src/i18n/locale.ts`, `ui-languages.json`. `targetLocales`를 변경한 후 `generate-ui-languages`을 실행하세요(`ui.uiLanguagesPath`를 설정하여 매니페스트가 헬퍼 옆에 위치하도록 할 수 있음, 예: `src/i18n/ui-languages.json`). `resolveUiLanguage(Astro.currentLocale)`에서 `<html lang>`과 `<html dir>`를 설정하는 `MainLayout.astro`; `astro:i18n`에서 `getRelativeLocaleUrl`를 사용하는 `LanguagePicker.astro`.

<a id="pages-parse-and-replace"></a>
## 페이지(구문 분석 및 바꾸기)

`.astro` 파일에 하드코딩된 HTML이 포함된 마케팅 페이지의 경우, `translate-docs`이 텍스트 노드 및 속성(`alt`, `title`, `aria-label`, `placeholder`)을 추출하고 문서 캐시로 번역한 후 페이지 트리 아래에 로케일별 사본을 작성하도록 하세요. 대부분의 가시적 텍스트에는 `t()`이 **필요하지 않습니다**.

구조적 속성 및 키 값은 기본적으로 **번역되지 않습니다**. 내장 보호 기능은 `class`, `id`, `style`, `src`, `href`, `data-*`와 대부분의 `aria-*`와 같은 JSX/HTML 속성, 그리고 템플릿 `{expression}` 블록 내의 `class`, `key`, `id`와 같은 객체 키를 보호합니다. 사용자 지정 속성(예: Tailwind `variant` 또는 CMS `slug` 필드)을 사용하는 경우 `docs[].protectAttributes` 및 `docs[].protectKeys`를 사용하여 해당 목록을 확장합니다. 동일한 옵션이 마크다운 번역 중 MDX JSX에 적용됩니다([protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys) 참조).

`features.translateDocs`를 활성화하고 `docs[]` 블록을 추가하십시오. 예를 들면:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

`npx ai-i18n-tools translate-docs`를 실행합니다([`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)에서 `pnpm i18n:translate`). 영어 원본은 `src/pages/index.astro`에 유지됩니다. 각 대상 로케일은 추가 디렉터리 수준에 맞게 조정된 가져오기(예: `../layouts/` → `../../layouts/`)와 함께 `src/pages/{locale}/index.astro`를 가져옵니다.

**템플릿 본문** 내에서 `{expression}` 블록(인라인 배열, 객체 `title`/`desc` 필드)의 문자열 리터럴은 사용자에게 표시될 때 번역됩니다. 보호된 속성/키의 따옴표로 묶인 값, `t('…')`, `<script>`, `<style>` 내의 리터럴은 변경되지 않습니다. **프런트매터 TypeScript는 이 경로로 번역되지 않습니다**. 공유 프런트매터(`t()` 가져오기 및 데이터 배열 포함)를 영어 및 로케일 페이지에서 동일하게 유지하거나, 영어 페이지를 편집한 후 `translate-docs`를 다시 실행하여 로케일 복사본이 프런트매터 변경 사항을 반영하도록 합니다. 프런트매터 전용 복사본의 경우 대신 [UI 문자열 파이프라인](#astro-website-ui-strings-ssg)을 사용합니다.

전체 하이브리드 랜딩 페이지([`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/))는 HTML은 `translate-docs`을 통해, 스크린샷 탭 레이블은 `t()` + `translate-ui`을 통해 확인하세요.
