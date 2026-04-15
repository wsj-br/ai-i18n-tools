# ai-i18n-tools

JavaScript/TypeScript 애플리케이션 및 문서 사이트의 국제화를 위한 CLI 및 프로그래밍 도구모음입니다. UI 문자열을 추출하고 OpenRouter를 통해 LLM을 사용하여 번역한 후 i18next용 로케일 대응 JSON 파일을 생성하며, 마크다운, Docusaurus JSON, 그리고 (`features.translateSVG`, `translate-svg` 및 `svg` 블록을 통해) 독립형 SVG 자산에 대한 파이프라인도 제공합니다.

<small>**다른 언어로 읽기:** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## 두 가지 핵심 워크플로우

**워크플로우 1 - UI 번역** (React, Next.js, Node.js, 모든 i18next 프로젝트)

**`t("…")` / `i18n.t("…")` 리터럴**에서 마스터 카탈로그(`strings.json` 및 선택적 로케일별 **`models`** 메타데이터 포함)를 생성하고, 선택적으로 **`package.json` `description`** 를 포함하며, 구성에서 활성화된 경우 각 **`englishName`** 을 `ui-languages.json`에서 생성합니다. OpenRouter를 통해 로케일별 누락된 항목을 번역하고 i18next에서 사용할 수 있도록 평면 JSON 파일(`de.json`, `pt-BR.json`, …)을 작성합니다.

**워크플로우 2 - 문서 번역** (마크다운, Docusaurus JSON)

`documentations` 블록의 `contentPaths`에서 `.md` 및 `.mdx` 파일을, 해당 블록의 `jsonSource`에서 JSON 레이블 파일을 활성화 시 번역합니다. 블록별로 Docusaurus 스타일 또는 단순 로케일 접미사 형식 레이아웃을 지원합니다(`documentations[].markdownOutput`). 공유 루트 `cacheDir`에 SQLite 캐시를 저장하여 새로운 또는 변경된 세그먼트만 LLM으로 전송합니다. **SVG:** `features.translateSVG`를 활성화하고 최상위 `svg` 블록을 추가한 후 `translate-svg`를 사용하세요(둘 다 설정된 경우 `sync`에서도 실행됨).

두 워크플로우는 동일한 `ai-i18n-tools.config.json` 파일을 공유하며 독립적으로 또는 함께 사용할 수 있습니다. 독립형 SVG 번역은 `features.translateSVG`와 최상위 `svg` 블록을 사용하며 `translate-svg`(또는 `sync` 내의 SVG 단계)를 통해 실행됩니다.

---

## 설치

배포된 패키지는 **ESM 전용**입니다(`"type": "module`). Node.js, 번들러 또는 `import()`에서 `import`를 사용하세요 — **`require('ai-i18n-tools')`는 지원되지 않습니다.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

OpenRouter API 키를 설정하세요:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 빠른 시작

### 워크플로우 1 - UI 문자열

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

`'ai-i18n-tools/runtime'`의 헬퍼를 사용하여 앱에 i18next를 연결하세요:

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

### 워크플로우 2 - 문서

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### 두 워크플로우 모두

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## 런타임 헬퍼

`'ai-i18n-tools/runtime'`에서 내보내집니다 - 모든 JS 환경에서 작동하며, i18next 가져오기가 필요하지 않습니다:

| 헬퍼 | 설명 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 키를 기본값으로 사용하는 설정을 위한 표준 i18next 초기화 옵션입니다. |
| `wrapI18nWithKeyTrim(i18n)` | 키가 조회되기 전에 트리밍되도록 `i18n.t`를 래핑합니다. |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 비동기 로케일 파일 로딩을 위한 팩토리 함수입니다. |
| `getTextDirection(lng)` | BCP-47 코드에 대해 `'ltr'` 또는 `'rtl'`을 반환합니다. |
| `applyDirection(lng, element?)` | `document.documentElement`에 `dir` 속성을 설정합니다. |
| `getUILanguageLabel(lang, t)` | 언어 메뉴 행에 대한 표시 레이블입니다(i18n 사용). |
| `getUILanguageLabelNative(lang)` | `t()`를 호출하지 않는 표시 레이블입니다(헤더 스타일). |
| `interpolateTemplate(str, vars)` | 일반 문자열에 대한 `{{var}}` 치환을 위한 저수준 함수(내부적으로 사용됨; 앱 코드는 대신 `t()`를 사용해야 함). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL 레이아웃을 위해 `→`를 `←`로 뒤집습니다. |

---

## CLI 명령어

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

모든 명령어의 전역 옵션: `-c <config>` (기본값: `ai-i18n-tools.config.json`), `-v` (상세 출력), 콘솔 출력을 로그 파일로 중계하기 위한 선택적 `-w` / `--write-logs [path]` (기본값: 번역 캐시 디렉터리 하위), `-V` / `--version`, 그리고 `-h` / `--help`. 명령어별 플래그는 [시작하기](docs/GETTING_STARTED.ko.md#cli-reference)를 참조하세요.

---

## 문서

- [시작하기](docs/GETTING_STARTED.ko.md) - 두 가지 워크플로우에 대한 전체 설정 안내, CLI 참조, 구성 항목 참조.
- [패키지 개요](docs/PACKAGE_OVERVIEW.ko.md) - 아키텍처, 내부 구조, 프로그래밍 방식 API 및 확장 포인트.
- [AI 에이전트 컨텍스트](../docs/ai-i18n-tools-context.md) - **이 패키지를 사용하는 앱을 위한 것:** 하위 프로젝트를 위한 통합 프롬프트 (리포지토리의 에이전트 규칙에 복사하세요).
- **이** 저장소 전용 유지 관리자 내부 정보: `dev/package-context.md` (복제 전용; npm에 없음).

---

## 라이센스

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
