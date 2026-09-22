<a id="migrating-from-intlayer"></a>
# Intlayer에서 마이그레이션

[Intlayer](https://intlayer.org/)에서 이전하시나요? 이 명령어는 기존 번역 사전과 앱 내 가장 기본적인 번역 사용 방식을 ai-i18n-tools로 가져옵니다. 자동으로 안전하게 업데이트를 수행한 후, 여전히 확인이 필요한 항목에 대한 명확한 보고서를 생성합니다. 이를 통해 모든 차이점을 사전에 파악할 필요 없이 점진적으로 이전할 수 있습니다.

이미 i18next JSON 번역 파일을 사용하고 계신가요? 이 마이그레이션 명령어는 필요하지 않습니다. 대신 [JSON 파이프라인](/ko/guide/json#i18next-namespace-files)을 사용하십시오.

<a id="what-migrate-intlayer-does"></a>
## `migrate-intlayer`의 기능

1. `*.content.ts` 기본 내보내기를 구문 분석합니다(`key` + `content` + `t({ locale: '…' })` 리프).
2. 소스 로케일 텍스트와 사전에 이미 있는 번역을 기반으로 `ui.stringsJson` 및 `ui.flatOutputDir` 아래의 로케일별 파일을 시딩합니다. 가져온 행에는 `models` 필드가 없습니다(이 실행에서 기계 번역되지 않음).
3. **안전한** 호출 사이트를 다시 작성합니다:
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. 나머지 모든 항목(동적 키, JSX 스프레드, 체인 `.replace().replace()`, 구조 분해)은 변경하지 않고 그대로 둡니다. 보고서는 정확한 표현식, 구체적인 `t()` 또는 JSX 대체 항목, 추가할 `import { t } from '…';` 줄과 함께 이러한 각 사이트를 나열합니다.
5. 기본적으로 드라이 런을 실행합니다. 카탈로그 시딩 및 안전한 재작성을 적용하려면 `--write`을(를) 전달하십시오. 보고서는 항상 작성됩니다. 또한 수동 재작성 후 삭제할 사전 파일과 남은 `useIntlayer` / `IntlayerProvider` 사용법, 여전히 `extract` 그 다음 `translate-ui`이(가) 필요한 카탈로그 키, 앱의 i18n 모듈에 붙여넣을 런타임 부트스트랩을 나열합니다.

<a id="migrate-your-project"></a>
## 프로젝트 마이그레이션

1. `ai-i18n-tools` 설치([설치](/ko/guide/installation) 참조). 프로젝트에 아직 `ai-i18n-tools.config.json`이(가) 없다면 스캐폴딩합니다:

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

Intlayer 사전에 이미 있는 로캘과 일치하도록 `sourceLocale` 및 `targetLocales`을(를) 편집하고, `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir`을(를) 앱의 소스 및 원하는 카탈로그 경로를 가리키도록 설정합니다. 이는 `translate-ui`에서 사용하는 키와 동일합니다. [UI 문자열 — 1단계: 초기화](/ko/guide/ui-strings/#step-1-initialise)를 참조하세요.
2. 먼저 드라이 런을 실행합니다: `ai-i18n-tools migrate-intlayer` (`--write` 없음). 파일 변경 전에 어떤 항목을 찾았는지, 어떤 호출 사이트가 수동 검토가 필요한지 확인하려면 `migrate-intlayer-report.md`을(를) 읽어보세요.
3. `ui.stringsJson` / `ui.flatOutputDir`을(를) 시드하고 안전한 호출 사이트를 다시 작성하려면 `ai-i18n-tools migrate-intlayer --write`을(를) 실행합니다.
4. 재생성된 보고서 `migrate-intlayer-report.md`을(를) AI 코딩 에이전트에게 전달하거나(권장), 다음 단계에 따라 직접 처리합니다.

- 보고서는 **단계별 TODO**로 끝납니다. 여기에 표시된 구체적인 `t('…')`/JSX로 각 수동 검토 사이트를 완료하고, `import { t } from '…';` 줄을 추가한 다음, 보고서에 나열된 남은 `*.content.ts` 파일과 `useIntlayer` / `IntlayerProvider` 사용을 삭제합니다.
   - 보고서의 런타임 부트스트랩을 앱의 i18n 모듈 위에 붙여넣습니다. 로캘 제어에서 `loadLocale(next)`을(를) 호출한 다음 `i18n.changeLanguage(next)`을(를) 호출합니다. `loadLocale`은(는) 플랫 번들만 등록하고 활성 언어를 전환하지 않습니다.
   - 보고서에서 새 문자열로 표시된 모든 소스 문자열에 대해 `ai-i18n-tools extract`을(를) 실행한 다음 `ai-i18n-tools translate-ui` (또는 `sync`)을(를) 실행합니다. `extract`은(는) 부트스트랩이 가져오는 `ui-languages.json`도 작성하므로, 새 문자열이 추가되지 않았더라도 앱을 시작하기 전에 실행하세요. `strings.json`, 플랫 로캘 파일 또는 `ui-languages.json`을(를) 수동으로 편집하지 마세요. 해당 명령어가 이를 관리합니다.
   - 보고서의 정리 목록이 완료되고 앱이 ai-i18n-tools에서 실행되면 `intlayer` / `react-intlayer` 종속성과 사전 파일을 제거합니다.

<a id="run-the-example"></a>
## 예제 실행

위의 단계는 모든 Intlayer 프로젝트에 적용됩니다. [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) 예제에서는 기본(자동 재작성 가능) 및 복잡한(수동 검토) 사례가 포함된 작은 Vite + React 앱에서 이 단계를 진행하므로, 자체 코드에 적용해 보기 전에 보고서와 런타임 부트스트랩을 확인할 수 있습니다. `intlayer-pristine/`은(는) 수정되지 않으며, `src/`이(가) 작업 사본입니다.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

AI 코딩 에이전트에게 `migrate-intlayer-report.md`을(를) 전달하십시오(또는 플래그가 지정된 파일을 직접 편집하십시오). 보고서에는 `src/i18n.ts` 위에 붙여넣을 런타임 모듈이 포함되어 있습니다. 로케일 제어에서 `loadLocale(next)`을(를) 호출한 다음 `i18n.changeLanguage(next)`을(를) 호출하십시오. `loadLocale`은(는) 플랫 번들만 등록합니다.

```bash
pnpm i18n:sync
pnpm dev
```

먼저 `pnpm i18n:sync`에서 `extract`을 실행하면 `ui-languages.json`가 생성됩니다. 부트스트랩에서 해당 파일을 불러오므로 추출 작업 후에만 앱을 시작하십시오. `strings.json`, 플랫 로케일 파일 또는 `ui-languages.json`는 수동으로 편집하지 마십시오.

`pnpm reset`는 `intlayer-pristine/`를 `src/` 위로 다시 복사하고 생성된 카탈로그를 지워서 다시 시작할 수 있게 합니다.

전체 안내: [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md).

<a id="command"></a>
## 명령

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

구성에 `ui.stringsJson` 및 `ui.flatOutputDir`가 필요합니다(`translate-ui`와 동일). LLM을 호출하지 않습니다.

| 옵션 | 의미 |
| --- | --- |
| `[paths...]` | 스캔할 파일/디렉터리/글로브(기본값: `ui.sourceRoots`) |
| `--write` | 카탈로그를 시드하고 안전한 호출 위치를 다시 작성합니다(기본값: 드라이 런) |
| `--report <path>` | 보고서 경로(기본값: `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | 사전 파일명 글롭(기본값: `**/*.content.ts`) |
| `--t-import <specifier>` | 생성된 `t()`의 가져오기 지정자(기본값: `src/i18n.ts`가 존재하면 상대적 `./i18n`, 그렇지 않으면 `i18next`) |

`--write` 실행 후에는 보고서의 수동 검토 사이트 작업을 완료하고, 보고서에 나열된 미사용 `*.content.ts` 파일 및 `IntlayerProvider` 래퍼를 삭제한 뒤 런타임 부트스트랩을 붙여넣고 로케일 컨트롤에서 `i18n.changeLanguage`을 호출하십시오. 보고서에서 신규로 표시된 소스 문자열에 대해 `extract`를 실행한 다음 `translate-ui`(또는 `sync`)를 실행하십시오. `extract`에서는 `ui-languages.json`도 생성하며, 부트스트랩에서 이를 불러옵니다. `strings.json`, 플랫 로케일 파일 또는 `ui-languages.json`은 수동으로 편집하지 마십시오.

**참고 항목:** [CLI — UI 문자열](/ko/reference/cli-commands/ui-strings#migrate-intlayer), [i18next 연결](/ko/guide/ui-strings/i18next-runtime)
