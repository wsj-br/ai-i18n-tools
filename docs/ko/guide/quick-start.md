<a id="quick-start"></a>
# 빠른 시작

이 페이지는 단일 언어로 된 프로젝트를 첫 번역 파일로 만드는 과정을 다룹니다. JS/TS 앱, Python 앱, 웹사이트나 문서 사이트, 또는 저장소 README 및 기타 Markdown 파일에 적용됩니다. 다음을 가정합니다.

- Python 프로젝트의 경우 Node.js `>=22.16.0` 또는 [독립 실행 파일](/ko/guide/installation#standalone-executables).
- LLM 공급자의 API 키 또는 로컬 Ollama 설치.
- 프로젝트가 버전 관리에 있어 도구가 작성한 내용을 검토할 수 있음.

프로젝트마다 두 가지가 다릅니다. 도구가 텍스트를 찾는 방법과 앱이 결과를 로드하는 방법입니다. 아래의 [경로 선택](#pick-your-path)에서 해당 가이드로 이동할 수 있습니다.

<a id="runnable-examples"></a>
## 실행 가능한 예제

완성된 프로젝트를 먼저 살펴보고 싶으신가요? 저장소를 복제하지 않고 하나를 복사하세요:

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

`console-app`을 다른 Node.js 예제로 바꾸세요. Python 예제에는 `package.json`이 없습니다. 같은 방식으로 복사하거나 GitHub 릴리스에서 `ai-i18n-tools-python-examples.zip`를 다운로드하세요. 각 예제가 무엇을 보여주는지에 대한 전체 목록은 [예제](/ko/examples) 페이지에 있습니다.

<a id="install"></a>
## 설치

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 및 `yarn add --dev ai-i18n-tools`도 작동합니다. Python 프로젝트는 독립 실행 파일을 설치하며 Node.js가 필요하지 않습니다. Linux 및 macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`. 다른 설치 옵션: [설치](/ko/guide/installation).

<a id="provider-and-api-key"></a>
## 공급자 및 API 키

LLM을 호출하는 모든 명령어(`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`)에는 다음 두 가지가 모두 필요합니다.

1. ``ai-i18n-tools.config.json``에 하나 이상의 공급자: ``translationModels``가 있는 ``providers.<name>`` 블록 및 둘 이상의 공급자가 구성된 경우 최상위 ``provider`` 키가 있어야 합니다. ``init -P <provider>``는 해당 사전 설정을 스캐폴드합니다. 공급자를 추가하려면 [LLM 공급자](/ko/guide/providers-and-models)를 참조하세요. 모델 목록을 선택하려면 [AI 모델](/ko/guide/ai-models)을 참조하세요.
2. 환경 또는 프로젝트 루트 ``.env`` 파일에 일치하는 API 키가 있어야 합니다. 각 내장 사전 설정은 [사전 설정 테이블](/ko/guide/providers-and-models#built-in-providers)에서 명명된 변수를 읽습니다. 예를 들어 ``OPENROUTER_API_KEY``은 ``-P openrouter``을, ``OPENAI_API_KEY``은 ``-P openai``를 읽습니다. Ollama는 로컬 엔드포인트를 사용하며 키가 필요하지 않습니다.

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

LLM을 호출하지 않는 `extract`, `status` 및 기타 명령어에는 둘 다 필요하지 않습니다. 환경 파일 및 PATH에 대한 자세한 내용: [설치](/ko/guide/installation#using-the-cli).

<a id="pick-your-path"></a>
## 경로 선택

해당하는 항목을 찾아 해당 블록의 명령어를 실행한 다음, 연결된 가이드에서 계속 진행하세요.

<a id="a-jsts-app"></a>
### JS/TS 앱

버튼과 메시지가 아직 소스에 일반 텍스트로 되어 있어 도구가 아직 찾을 것이 없습니다. 먼저 `t()`으로 래핑해야 하며, 앱에는 작은 i18next 설정 파일이 필요합니다.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

그런 다음 [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js)를 따르세요. 이 가이드에서는 `extract` 및 `translate-ui` 전에 에이전트 프롬프트를 사용하여 래핑하는 단계를 다룹니다.

<a id="a-python-app"></a>
### Python 앱

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

해당 설정에는 `ui-python-gettext`, `ui-python-flask` 또는 `ui-python-django`를 사용하세요. 그런 다음 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)를 따르세요.

<a id="a-website-or-documentation-site"></a>
### 웹사이트 또는 문서 사이트

프레임워크에 맞는 템플릿을 선택하세요:

| 사이트 | 템플릿 |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| 일반 Astro 웹사이트 | `ui-astro-website` |
| 일반 HTML 페이지 | `ui-plain-html` 또는 `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

프레임워크의 자체 i18n 라우팅을 먼저 활성화해야 합니다. 그런 다음 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website)를 따르세요.

<a id="a-readme-or-markdown-docs"></a>
### README 또는 Markdown 문서

대부분의 리포지토리는 앱과 함께 이를 원합니다. 기본 `ui-markdown` 템플릿에는 이미 플랫 README 블록이 포함되어 있습니다. 다른 템플릿의 경우 `--with-readme`을 추가하세요. Markdown만 있는 리포지토리는 `docs-markdown`를 사용합니다.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

그런 다음 [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 따르세요. `sync` 앞에 언어 목록 마커를 `README.md`에 붙여넣으세요. 앱 경로가 있는 경우, 경로는 여전히 [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)입니다.

<a id="something-else"></a>
### 기타

- 그대로 유지되는 중첩된 i18next JSON: `ai-i18n-tools init -t ui-json-bundles -P openrouter` 후 [JSON](/ko/guide/json).
- 텍스트 레이블이 있는 SVG 다이어그램: [SVG 번역](/ko/guide/svg-translation/).
- Intlayer에서 마이그레이션: [Intlayer에서 마이그레이션](/ko/guide/migrating-from-intlayer).
- Intlayer를 유지하고 번역만 채우기: [Intlayer 인플레이스 번역](/ko/guide/translating-intlayer).

모든 `init` 옵션을 포함한 전체 템플릿 목록은 [CLI 설정 참조](/ko/reference/cli-commands/setup)에 있습니다.

<a id="run-and-check"></a>
## 실행 및 확인

프로젝트가 준비되면:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync`는 구성에서 활성화한 모든 단계를 순서대로 실행합니다. `status`는 로캘별로 번역된 내용을 보여줍니다. 도구가 텍스트를 볼 수 없는 프로젝트에서 처음 실행하면 오류 없이 완료되고 유용한 내용은 아무것도 기록되지 않으므로, `status`에 문자열이 표시되지 않으면 해당 경로에 대한 가이드로 돌아가세요.

``suggest-models``는 게시된 벤치마크를 기준으로 활성 공급자의 채팅 모델 순위를 매깁니다. ``suggest-models --apply``은 ``translationModels``를 대체하고 ``uiModels`` 및 ``localeModels``는 그대로 둡니다. 동일한 순위가 대시보드 **모델** 탭에 있습니다. 순위가 작동하는 방식과 목록에 둘 이상의 모델이 포함된 이유에 대한 설명은 [AI 모델](/ko/guide/ai-models)을 참조하세요. 명령어 참조: [suggest-models](/ko/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## 번역 유지

소스 텍스트가 변경될 때마다 `sync`를 다시 실행하세요. SQLite 캐시는 새 텍스트나 변경된 텍스트만 모델로 전송된다는 것을 의미하므로 재실행 비용이 저렴합니다. CI에서 `sync`를 실행하면 번역이 틀어지는 것을 방지할 수 있습니다. `ai-i18n-tools dashboard`는 캐시된 번역을 검토하고 편집할 수 있는 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

<a id="recommended-packagejson-scripts"></a>
### 권장 package.json 스크립트

패키지가 로컬에 설치된 경우 스크립트는 추가적인 셸 설정 없이 `node_modules/.bin`에서 `ai-i18n-tools`을(를) 확인합니다. 대화형 셸의 경우 먼저 PATH를 구성하세요. [CLI 사용](/ko/guide/installation#using-the-cli)을(를) 참조하세요.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

개별 번역 스크립트를 연결하는 것보다 `sync`을(를) 사용하는 것이 좋습니다. 단일 단계 스크립트는 한 단계만 단독으로 필요할 때만 사용하세요.

CLI 출력과 대시보드를 다른 언어로 표시하려면 `-L <code>`을(를) 전달하거나 `AI_I18N_LANG`을(를) 설정하세요. [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하세요.

<a id="combined-sync"></a>

앱 문자열과 문서 사이트처럼 두 가지 이상의 콘텐츠를 함께 번역하시나요? [파이프라인 결합](/ko/guide/combining-pipelines)을(를) 참조하세요.

다음: [경로 선택](#pick-your-path) 아래에서 자신의 경로에 맞는 가이드를 확인하세요.
