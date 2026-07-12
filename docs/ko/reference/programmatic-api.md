<a id="programmatic-api"></a>
# 프로그래밍 방식 API

모든 공용 타입과 클래스는 패키지 루트에서 내보냅니다. 예: CLI 없이 Node.js에서 UI 번역 단계를 실행하는 경우:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Node.js에서 구성 스캐폴딩(선택적 네 번째 인수는 내장 프리셋을 선택; 기본값은 `openrouter`):

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
```

주요 내보내기 (일반적으로 사용됨 — 전체 공개 표면은 `src/index.ts` 참조):

| 내보내기 | 설명 |
|---|---|
| `loadI18nConfigFromFile` | JSON 파일에서 설정을 로드하고 병합한 후 유효성을 검사합니다. |
| `parseI18nConfig` | 원시 설정 객체의 유효성을 검사합니다. |
| `TranslationCache` | SQLite 캐시 - `cacheDir` 경로로 인스턴스 생성. |
| `UIStringExtractor` | JS/TS 소스에서 `t("…")` 문자열 추출. |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML에서 `data-i18n*` 마커 스캔/삽입 (`extract`용 `.html` 및 `mark-html` 명령 지원). |
| `MarkdownExtractor` | 마크다운에서 번역 가능한 구문 추출. |
| `JsonExtractor` | Docusaurus JSON 레이블 파일(UI 카탈로그, MDX 본문 아님)에서 추출합니다. |
| `SvgExtractor` | SVG 파일에서 추출. |
| `LlmClient` | 활성 LLM 공급자에게 번역 요청을 합니다( `OpenRouterClient`는 더 이상 사용되지 않는 별칭). |
| `PlaceholderHandler` | 번역 주위의 마크다운 구문 보호/복원 (HTML 태그, 주석, 앵커, MDX 주석/JSX/중괄호, URL, 인라인 코드, 강조). |
| `protectMdx` / `restoreMdx` | MDX 주석, JSX 태그, 중괄호 표현식 및 JSX 문자열 속성 보호/복원 (`PlaceholderHandler`에 의해 호출됨; 직접 사용을 위해 내보내기도 함). |
| `splitTranslatableIntoBatches` | 구문을 LLM 크기의 배치로 그룹화. |
| `validateTranslation` | 번역 후 구조 검사 (**async** — 대기해야 함). |
| `resolveDocumentationOutputPath` | 번역된 문서의 출력 파일 경로 결정. |
| `Glossary` / `GlossaryMatcher` | 번역 용어집 로드 및 적용. |
| `runTranslateUI` | 프로그래밍 방식 번역 UI 진입점. |
| `writeInitConfigFile` | 스타터 구성 JSON 작성(`template`, 선택적 `providerKey`의 기본값은 `openrouter`). |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P`에서 사용하는 내장 프리셋당 스타터 `translationModels`. |
| `PROVIDER_PRESETS` | 내장 공급자 사전 설정 맵 (`baseUrl`, `apiKeyEnv`). |
