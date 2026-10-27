<a id="translating-intlayer"></a>
# Intlayer 인플레이스 번역

[Intlayer](https://intlayer.org/)는 형식화된 콘텐츠 사전에 번역을 보관하거나 번역 관리 시스템 및 인력 번역을 사용하는 애플리케이션에 좋은 솔루션입니다. `translate-intlayer`는 이러한 사용자를 위한 것입니다. 이 도구는 `*.content.ts` 사전 내에서 누락되거나 오래된 로캘 리프를 인플레이스 방식으로 채웁니다. 사전은 신뢰할 수 있는 단일 소스로 유지되고, Intlayer는 런타임에 유지되며, ai-i18n-tools는 번역 엔진(공급자 선택, 용어집, 번역 컨텍스트, 모델 폴백) 역할을 합니다.

<a id="which-one"></a>
## Intlayer를 유지할 것인가, 소스 문자열 호출로 이전할 것인가?

| 대상 사용자 | 명령어 | 가이드 |
| --- | --- | --- |
| 형식화된 콘텐츠 사전, 번역 관리 시스템 또는 인력 번역. Intlayer는 런타임에 유지됩니다. | `translate-intlayer` | 이 페이지 |
| 소스 문자열 호출, `t('…')`. 소스 언어 텍스트를 사용하는 코드와 함께 보관합니다. 소스 언어는 모든 언어가 될 수 있습니다. | `migrate-intlayer` | [Intlayer에서 소스 문자열 호출로 마이그레이션하기](/ko/guide/migrating-from-intlayer) |

`translate-intlayer`는 소스 문자열을 추가하거나 기존 문자열을 편집할 때마다 다시 실행하는 지속적인 작업입니다. `migrate-intlayer`는 다른 대상 사용자를 위한 일회성 이전 작업입니다. 다시 작성된 각 호출은 사용하는 코드와 함께 소스 언어 문자열을 전달하므로 유지 관리가 단순화되고 해당 코드의 복잡성이 줄어듭니다. 해당 언어는 `sourceLocale`이며, 모든 언어가 될 수 있습니다.

<a id="what-translate-intlayer-does"></a>
## `translate-intlayer`의 기능

1. `*.content.ts` 기본 내보내기를 파싱하고 모든 `t({ locale: '…' })` 리프를 수집합니다. 로캘 값은 일반 문자열 또는 Intlayer `insert('…')` 삽입 노드일 수 있습니다.
2. UI 블록의 `ui.stringsJson`에 소스 텍스트를 시드한 다음, 누락되거나 오래된 로캘에 대해 [`translate-ui`](/ko/reference/cli-commands/ui-strings#translate-ui)와 동일한 엔진을 실행합니다.
3. 로캘별 새 문자열을 각 `t({ … })` 객체에 다시 씁니다. 편집은 정밀하게 이루어집니다. 즉, 누락되거나 오래된 로캘 라인만 변경되므로 서식, 키 순서, 주석이 보존됩니다. 기존 번역은 작성된 그대로 유지됩니다. 리프가 `insert('…')`를 사용하는 경우, 새 로캘 값도 `insert(…)`로 래핑되어 런타임에 리프를 계속 호출할 수 있습니다.
4. 플레이스홀더를 보존합니다. Intlayer의 삽입 구문 <code v-pre>{{token}}</code>는 변경 없이 그대로 전달됩니다. 단일 중괄호 `{token}` 플레이스홀더도 지원됩니다. 이 플레이스홀더는 번역을 위해 <code v-pre>{{token}}</code>가 되고 쓰기 시 `{token}`로 돌아갑니다.
5. `--dry-run`로 드라이 런(dry run) 실행: LLM을 호출하거나 아무것도 쓰지 않고 누락/오래된 항목의 수를 보고합니다.

<a id="missing-vs-stale"></a>
## 누락과 오래됨의 차이

리프 + 로캘은 다음 중 하나에 해당할 때 번역됩니다.

- 로캘이 리프에 없는 경우(누락) 또는
- 해당 로캘에 대한 마지막 실행 이후 소스 로캘 텍스트가 변경된 경우(오래됨). 소스 언어는 `sourceLocale`이며 모든 언어가 될 수 있습니다.

`cacheDir`에서 리프별로 오래된 상태가 추적되므로, 영어 문자열 하나를 편집하면 다음 실행 시 해당 리프만 다시 번역되고 나머지는 모두 캐시된 상태로 유지됩니다. 첫 실행 시 이미 오래된 번역은 최신으로 간주되며, 이후 편집 시에만 오래된 것으로 표시됩니다.

<a id="translate-your-project"></a>
## 프로젝트 번역하기

1. `ai-i18n-tools` 설치([설치](/ko/guide/installation) 참조). 프로젝트에 아직 `ai-i18n-tools.config.json`이(가) 없다면 스캐폴딩합니다:

   ```bash
   ai-i18n-tools init -P gemini
   ```

사전에서 사용하는 로캘로 `sourceLocale` 및 `targetLocales`을 설정하고, `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir`가 소스 및 카탈로그 경로를 가리키도록 합니다. 이는 `translate-ui`가 사용하는 것과 동일한 키입니다. [UI 문자열 — 1단계: 초기화](/ko/guide/ui-strings/#step-1-initialise)를 참조하세요. 카탈로그는 스크래치 디렉터리(예: `.i18n/`)에 있을 수 있으며, 번역 캐시로 사용되므로 직접 편집해서는 안 됩니다.
2. 먼저 드라이 런을 실행하여 채워질 내용을 확인합니다.

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. 적용합니다(공급자 API 키 필요):

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. 새 문자열을 추가하거나 영어 문자열을 편집할 때마다 다시 실행합니다. 새 리프 또는 변경된 리프만 번역됩니다. 필요한 경우 `-l de,fr` 또는 `--ui-block`로 실행 범위를 지정합니다.

<a id="run-the-example"></a>
## 예제 실행

[intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) 예제는 작은 Vite + React 앱으로, 사전에는 영어와 브라질 포르투갈어가 포함되어 있으며 스페인어와 중국어 간체는 의도적으로 누락되었습니다. `pristine/`는 읽기 전용 참조이고 `src/`는 작업 사본입니다. `pnpm reset`는 `src/`를 해당 시작 상태로 되돌리므로(카탈로그와 캐시 지움) 연습을 반복할 수 있습니다.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev`은 앱을 [http://localhost:3093](http://localhost:3093)에서 실행합니다. 번역하기 전에 로캘을 `es` 또는 `zh-Hans`로 전환하면 문자열이 영어로 폴백됩니다. `pnpm translate` 후에는 채워진 번역이 나타납니다. 영어 문자열을 수정한 후 `pnpm translate`를 다시 실행하면 해당 리프만 새로고침되는 것을 볼 수 있습니다.

전체 가이드: [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md).

<a id="command"></a>
## 명령

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

`features.translateUIStrings` 및 UI 블록의 `ui.stringsJson`(`translate-ui`와 동일)이 필요합니다. `--dry-run`은 LLM을 호출하지 않습니다.

| 옵션 | 의미 |
| --- | --- |
| `[paths...]` | 스캔할 파일/디렉터리/글로브(기본값: `ui.sourceRoots`) |
| `-l`, `--locale <codes>` | 채울 대상 로캘(쉼표로 구분) (기본값: 블록의 `targetLocales`) |
| `--ui-block <selector>` | UI 블록: 0부터 시작하는 인덱스, 설명 또는 `stringsJson` 경로 (기본값: 블록 0) |
| `--dry-run` | 누락/오래된 개수만 보고, LLM 호출 및 쓰기 작업 없음 |
| `-j`, `--concurrency <n>` | 최대 병렬 대상 로캘 수 (기본값: 구성 `concurrency` 또는 4) |

**관련 항목:** [CLI — UI 문자열](/ko/reference/cli-commands/ui-strings#translate-intlayer), [Intlayer에서 소스 문자열 호출로 마이그레이션](/ko/guide/migrating-from-intlayer)
