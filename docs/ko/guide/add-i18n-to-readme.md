<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# README 및 마크다운 문서에 i18n 추가

이 페이지는 GitHub, GitLab, Bitbucket 또는 독자가 `README.md`에서 시작하는 다른 모든 호스트의 저장소를 가져와 언어별로 파일을 하나씩 추가합니다. 구성할 문서 사이트 프레임워크는 없습니다. 일반적인 프로젝트에는 앱 또는 CLI도 있으며, README는 해당 앱과 동일한 언어 및 제품 용어를 사용해야 합니다. UI 문자열이 없는 라이브러리 또는 문서 전용 저장소는 아래에서 다루는 다른 경우입니다.

<a id="what-you-get"></a>

이 도구는 `README.md`를 그대로 둡니다. 호스트는 이를 저장소의 첫 페이지로 계속 렌더링합니다. 각 대상 로케일은 `translated-docs/README.de.md`와 같은 형제 파일입니다. README 내의 언어 행은 이 파일들을 함께 연결하며, 독자가 보고 있는 파일에서 작동하는 링크와 함께 모든 번역에 동일한 행이 작성됩니다. `translate-docs`가 해당 행을 채웁니다. 이는 시작 마커부터 끝 마커까지의 모든 것을 로케일당 하나의 링크로 대체합니다. 해당 파일도 번역해야 하는 경우 `CONTRIBUTING.md`, `CHANGELOG.md` 또는 `docs/` 폴더를 동일한 블록에 추가하세요. [README 이상](#step-3-more-than-the-readme)을 참조하세요.

가장 빠른 방법은 이 페이지의 프롬프트를 코딩 에이전트에 제공하는 것입니다. 에이전트는 구성을 확인하고 언어 목록 마커를 추가합니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화해야 합니다. 이는 API 키와 선택 사항이 필요하기 때문입니다. 또한 번역은 귀하의 계정에서 비용이 발생하므로 직접 실행해야 합니다.

VitePress, Docusaurus, Starlight, Nextra, Fumadocs 또는 Astro 사이트는 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website)를 사용합니다. 저장소 README도 번역해야 하는 경우 `--with-readme`를 추가하세요. 어떤 것이 적용되는지 확실하지 않으신가요? 마지막에 [귀하의 경우가 아닌가요?](#not-your-case)를 참조하세요.

흐름:

1. [CLI 설치 및 공급자 선택](#install-and-choose-a-provider).
2. `init`를 사용하여 [프로젝트 초기화](#initialise-the-project).
3. [에이전트 프롬프트 실행](#run-the-agent-prompt).
4. [결과 검토](#review-the-result).
5. [모델 선택 및 번역](#choose-models-and-translate) 후 한 언어를 확인합니다.
6. [번역 유지](#keep-it-translated).

변경 사항을 직접 적용하고 싶거나 프롬프트가 무엇을 하는지 알고 싶으신가요? [수동으로 진행하기](#do-it-by-hand)에서 동일한 단계를 하나씩 안내합니다.

<a id="install-and-choose-a-provider"></a>
## 설치 및 공급자 선택

이 부분은 에이전트가 아닌 사용자가 직접 수행합니다. 설치 프로그램은 사용자 시스템을 변경하며, API 키는 프롬프트가 아닌 셸에 속하는 비밀 정보입니다.

`package.json`가 있는 저장소는 패키지를 개발 종속성으로 설치합니다. 다른 설치 옵션: [설치](/ko/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 및 `yarn add --dev ai-i18n-tools`도 작동합니다.

Node.js 프로젝트가 없는 저장소는 독립 실행형 실행 파일을 사용할 수 있습니다. Linux 및 macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

설치 프로그램은 `SHA256SUMS.txt`를 확인하고, 명령어를 `ai-i18n-tools`로 설치하며, `PATH`에 추가합니다. 바이너리는 공증되거나 Authenticode 서명되지 않았습니다. 수동 단계 및 자산 이름: [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables). Node.js가 설치되어 있고 프로젝트 종속성을 원하지 않는 경우 `npx ai-i18n-tools`도 작동합니다.

설치 확인:

```bash
ai-i18n-tools --version
```

그런 다음 공급자를 선택하고 번역을 실행할 셸에 API 키를 설정합니다. 예를 들어, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama는 키가 필요 없습니다. 다른 사전 설정: [내장 공급자](/ko/guide/providers-and-models#built-in-providers). 다음 단계에서 `init`에 전달해야 하므로 공급자 이름을 기록해 두세요. 에이전트는 키가 필요 없습니다. 모델 호출을 하지 않는 명령만 실행합니다. 키는 나중에 [번역](#choose-models-and-translate)할 때 사용합니다.

<a id="initialise-the-project"></a>
## 프로젝트 초기화

프롬프트 전에 이것을 한 번 실행합니다. 이는 구성을 작성하고 위에서 선택한 공급자를 사용합니다. `README.md`를 편집하지 않습니다. 구성에 README 블록이 포함되어 있으면 붙여넣을 마커 줄을 출력하고 `README.md`가 누락된 경우 경고합니다.

| 가지고 있는 것 | 스캐폴드 | 그 다음 |
| --- | --- | --- |
| JS/TS 앱과 README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, 기본값) | `t()`의 경우 [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js), README의 경우 이 페이지 |
| Python 앱과 README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | 앱의 경우 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python), README의 경우 이 페이지 |
| 다른 템플릿과 README | 해당 `init` 명령에 `--with-readme` 추가 | README 블록의 경우 이 페이지 |
| README 및 마크다운만 | `ai-i18n-tools init -t docs-markdown -P openrouter` | 이 페이지 |

해당 템플릿에는 이미 README 블록이 포함되어 있기 때문에, `--with-readme`는 `ui-markdown` 및 `docs-markdown`에 영향을 미치지 않습니다.

JS/TS 앱 및 README (하나의 명령; `ui-markdown`은 기본 템플릿입니다):

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, 일반 HTML, VitePress, Docusaurus 또는 다른 템플릿에 동일한 README 블록이 추가된 상태:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

README 및 마크다운 파일만:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

그런 다음 `ai-i18n-tools.config.json`에서 `sourceLocale` 및 `targetLocales`를 편집합니다. `sourceLocale`는 README가 작성된 언어입니다. 모든 BCP-47 언어가 유효합니다. `features.translateDocs`는 true여야 합니다. 하이브리드 구성은 `features.translateUIStrings`도 설정합니다. `docs[].contentPaths`는 번역할 Markdown 파일 및 폴더를 나열합니다. 스캐폴드는 `README.md`를 나열합니다.

`init`를 한 번 실행합니다. 이는 매번 `ai-i18n-tools.config.json`를 다시 작성하므로, 두 번째 실행은 사용자가 변경한 내용을 삭제합니다. `init`를 건너뛰면 기존 구성은 그대로 유지됩니다. 프롬프트는 README 블록을 추가하고, [1단계](#step-1-configure-the-docs-block)는 동일한 수동 편집을 보여줍니다.

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 또는 유사한 도구)에서 프로젝트를 열고, 새 채팅을 시작한 다음, 아래 프롬프트를 붙여넣으세요. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 다른 Markdown 파일을 번역해야 하는 경우, 동일한 메시지에 해당 파일 이름을 지정하세요.

에이전트는 먼저 CLI와 구성이 존재하는지 확인하고, 하나라도 누락된 경우 지침과 함께 중단합니다. 그런 다음 두 부분으로 작동합니다:

- 1부: 구성에 `README.md`가 이미 나열되어 있지 않은 경우 플랫 README 블록을 추가합니다.
- 2부: 소스 README에 언어 목록 마커를 추가합니다.

CLI를 설치하거나, 구성을 초기화하거나, API 키를 읽거나, 언어 링크를 채우거나, 번역하지 않습니다. 번역은 검토 후 단계이며, 사용자가 실행합니다.

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
{
  "contentPaths": ["README.md"],
  "outputDir": "translated-docs",
  "addFrontmatter": false,
  "docsOutput": {
    "style": "flat",
    "flatPreserveRelativeDir": true,
    "linkRewriteDocsRoot": ".",
    "postProcessing": {
      "languageListBlock": {
        "start": "<small id=\"lang-list\">",
        "end": "</small>",
        "separator": " · "
      }
    }
  }
}
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점(diff). 구성과 마커여야 합니다. 원본 산문은 이전과 동일하게 읽혀야 합니다. `git diff --stat`는 변경된 양을 보여줍니다.
- `translated-docs/` 또는 다른 생성된 로케일 트리 아래의 어떤 것도 편집되지 않았습니다.
- `ai-i18n-tools.config.json`가 구문 분석되고, `features.translateDocs`가 true이며, 정확히 하나의 문서 블록이 `README.md`를 나열합니다.
- 마커는 `README.md`에 있으며 펜스 코드 블록 안에 있지 않습니다. 펜스 안의 마커 샘플은 괜찮습니다. 실제 마커는 외부에 있습니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 사용자가 실행합니다. 사용자 API 키를 사용하며 사용자 계정에서 비용이 발생합니다.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`는 `translationModels`만 대체합니다. 동일한 순위는 `ai-i18n-tools dashboard`의 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다.

그런 다음 번역합니다:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync`는 활성화된 단계를 순서대로 실행합니다: UI 문자열이 켜져 있을 때 `extract` 및 `translate-ui`, 그 다음 `translate-docs`. 하나의 캐시가 공유되므로, 앱용으로 이미 번역된 문장은 README에 나타날 때 재사용됩니다. UI 카탈로그는 용어집 힌트(`ui[].uiGlossary`, 기본적으로 켜짐)로 문서 번역에 전달되어 버튼 및 기능 이름의 일관성을 유지합니다. [용어집](/ko/guide/glossary)을 참조하세요.

행의 언어 이름은 `ui-languages.json`에서 가져오며, `extract`은 이를 UI 카탈로그 옆에 작성합니다. README 전용 구성에는 UI 카탈로그가 없으므로, 이 행은 번들된 언어 목록을 대신 사용합니다. 레이블은 여전히 원어 이름입니다. 자신만의 프로젝트 매니페스트를 원할 때만 `generate-ui-languages`를 실행하세요.

`translated-docs/`를 커밋하고 호스트에서 번역된 README를 엽니다. 원본 README와 `translated-docs/README.de.md` 사이의 상대 링크는 각 파일에 대해 다시 작성됩니다.

<a id="check-one-language"></a>
### 한 언어 확인

호스트와 파일 자체에서 `translated-docs/README.de.md`(또는 선택한 대상 코드)를 엽니다. 언어 행에는 모든 로케일이 나열되어야 하며, 현재 보고 있는 파일에서 작동하는 링크가 포함되어야 합니다. 원본 언어로 남아 있는 문장은 코드 펜스, URL 또는 헤딩 앵커 안에 있거나 `contentPaths`에 없었습니다.

<a id="keep-it-translated"></a>
## 번역 유지

원본 README 또는 앱 문자열이 변경된 후 `ai-i18n-tools sync`을(를) 다시 실행합니다. 캐시는 새로 추가되거나 변경된 텍스트만 모델로 보냅니다. `translated-docs/` 아래에 업데이트된 파일을 커밋합니다. `ai-i18n-tools dashboard`는 번역을 검토하기 위해 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

아래 워크플로는 게시된 작업이 아닌 샘플입니다. `README.md`이(가) 변경될 때 CLI를 설치하고 `sync`를 실행합니다. 공급자 키를 저장소 비밀로 저장하세요. `translated-docs/` 차이점을 검토하고 커밋하거나, 브랜치에 푸시하고 풀 리퀘스트를 여세요.

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

구성한 공급자의 환경 변수를 사용하세요. Ollama는 호스팅된 러너에 설치하지 않으면 적용되지 않습니다.

<a id="hybrid-tips"></a>
### 하이브리드 팁

- `docs[].targetLocales`를 사용하여 README를 앱보다 적은 수의 언어로 번역하세요. [문서에 대한 적은 로케일](/ko/guide/combining-pipelines#fewer-locales-for-documents)을 참조하세요.
- 제품 용어를 `glossary.userGlossary`에 넣으세요. 동일한 CSV가 UI 문자열과 README에 사용됩니다.
- `ai-i18n-tools sync --no-docs` 또는 `ai-i18n-tools sync --no-ui`를 사용하여 한쪽만 실행하세요.

<a id="say-that-the-translation-is-automatic"></a>
### 번역이 자동임을 알립니다

AI 번역은 틀릴 수 있습니다. [이 저장소의 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)에 있는 것과 같이 README 하단에 짧은 메모를 추가하여 독자들에게 다른 언어는 기계 번역되었으며 의존하기 전에 확인해야 한다고 알립니다.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르세요. 처음 두 단계는 프롬프트의 부분과 일치합니다. 마지막 두 단계는 추가 파일 및 게시된 사이트를 가리키는 링크를 위한 것입니다. 마지막에는 여전히 [CLI를 설치](#install-and-choose-a-provider)하고, [프로젝트를 초기화](#initialise-the-project)하고, [번역](#choose-models-and-translate)해야 합니다.

1. [문서 블록 구성](#step-1-configure-the-docs-block).
2. [언어 목록 추가](#step-2-add-the-language-list).
3. [README 이상](#step-3-more-than-the-readme).
4. [호스트의 링크](#step-4-links-on-the-host).

<a id="step-1-configure-the-docs-block"></a>
## 1단계: 문서 블록 구성

네 가지 주요 키가 중요합니다:

- `sourceLocale`: README가 작성된 언어. 어떤 언어든 유효합니다. 이 가이드에서는 영어가 일반적인 예시입니다.
- `targetLocales`: 추가할 언어.
- `features.translateDocs`: true여야 합니다. 하이브리드 구성은 `features.translateUIStrings`도 설정합니다.
- `docs[].contentPaths`: 번역할 Markdown 파일 및 폴더. 스캐폴드는 `README.md`를 나열합니다.

`init`이(가) 이미 README 블록을 작성했다면 이 단계를 건너뛰세요. 이미 존재하는 구성을 편집할 때 사용하세요.

<details>
<summary>하이브리드: UI 문자열 및 README</summary>

`ui-markdown`는 이 형태를 작성합니다. `ui`은 앱 카탈로그입니다. `docs` 항목은 README입니다.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>README 및 Markdown만</summary>

`docs-markdown`는 UI 문자열을 끄고 동일한 README 블록을 유지합니다.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

언어 목록 설정은 하이브리드 예시와 동일합니다. 여기서는 스니펫을 짧게 유지하기 위해 생략되었습니다. `init -t docs-markdown`가 이를 작성합니다.

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### 기존 구성에 블록 추가

하이브리드 예시에서 `docs` 객체를 추가하고 `features.translateDocs`을 `true`로 설정합니다. 구성에 이미 `docs` 배열(예: VitePress 또는 Docusaurus 사이트)이 있는 경우, README 객체를 두 번째 항목으로 추가합니다. `sync`는 모든 블록을 실행합니다. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)은 다음과 같이 합니다: 문서 사이트용 블록 하나, `README.md`용 플랫 블록 하나.

이미 `README.md`이(가) 나열된 블록이 있다면 두 번째 블록을 추가하지 마세요.

<a id="step-2-add-the-language-list"></a>
## 2단계: 언어 목록 추가

독자들이 다른 언어를 볼 수 있도록 이 줄을 `README.md`에 넣으세요. 그 위에 있는 짧은 레이블은 일반적인 산문이며 번역될 것입니다.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

이 줄은 비어 있을 수 있습니다. `translate-docs`는 시작 마커부터 끝 마커까지의 모든 것을 로케일당 하나의 링크로 대체합니다. 펜스 코드 블록 내부의 마커는 무시되므로, 동일한 파일에 있는 구성 샘플은 일치하지 않습니다. 자세한 내용: [언어 전환기](/ko/guide/documents/language-switcher).

<a id="step-3-more-than-the-readme"></a>
## 3단계: README 이상

`contentPaths`에 경로를 추가하세요. `flatPreserveRelativeDir`은 폴더를 유지하므로, `docs/guide.md`는 다른 `guide.md`와 충돌하는 대신 `translated-docs/docs/guide.de.md`가 됩니다.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore` 파일은 번역을 원하지 않는 경로를 건너뜁니다. `init --with-translate-ignore`은 시작 파일을 작성합니다. 코드 펜스, URL 및 헤딩 앵커는 번역되지 않습니다. [출력 레이아웃](/ko/guide/documents/output-layouts), [앵커 링크](/ko/guide/documents/anchor-links) 및 [링크 재작성](/ko/guide/documents/link-rewriting)을 참조하세요.

언어별로 다른 스크린샷: [이미지 및 스크린샷](/ko/guide/images-and-screenshots/).

<a id="step-4-links-on-the-host"></a>
## 4단계: 호스트의 링크

저장소의 다른 파일로 연결되는 링크는 로케일 파일로 다시 작성됩니다. 게시된 문서 사이트로 연결되는 링크는 그렇지 않습니다. 이 저장소는 `regexAdjustments`를 사용하여 문서 사이트 URL에 로케일을 접두사로 붙입니다.

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

플랫 링크 재작성기가 먼저 실행된 다음, 이러한 교체가 이루어집니다. [링크 재작성](/ko/guide/documents/link-rewriting)을 참조하세요.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#choose-models-and-translate)에서 계속하세요.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 가지고 있는 것 | 읽어볼 것 |
| --- | --- |
| 번역할 README가 없는 앱 UI 문자열 | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) |
| Django, Flask-Babel 카탈로그 또는 이미 GNU gettext를 사용하는 앱 | [Django / Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext) |
| VitePress, Docusaurus, Starlight, Nextra, Fumadocs 또는 Astro 사이트 | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website). 저장소 README도 번역해야 하는 경우 `--with-readme`를 추가하세요. |
| 로케일당 하나의 HTML 파일 | [HTML 페이지](/ko/guide/documents/html-pages) |
| 전체 `translate-docs` 참조 | [문서](/ko/guide/documents/) |

<a id="examples"></a>
## 예시

| 프로젝트 | 표시 내용 |
| --- | --- |
| [콘솔 앱](/ko/examples#console-app) | 작은 Node 앱과 플랫 README 블록 |
| [Next.js 앱](/ko/examples#nextjs-app) | UI 문자열, 문서 사이트, 그리고 별도의 플랫 README 블록 |
| 이 저장소 | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): 플랫 README 블록, 그 다음 VitePress 사이트 |
