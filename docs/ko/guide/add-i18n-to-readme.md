<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# README 및 마크다운 문서에 i18n 추가

이 페이지는 독자들이 `README.md` 및 몇몇 다른 마크다운 파일에서 시작하는 GitHub, GitLab, Bitbucket 또는 기타 호스트의 저장소를 위한 것입니다. 구성할 문서 사이트 프레임워크는 없습니다. 일반적인 프로젝트에는 앱 또는 CLI도 있으며, README는 해당 앱과 동일한 언어 및 동일한 제품 용어를 사용해야 합니다. UI 문자열이 없는 라이브러리 또는 문서 전용 저장소는 아래에서 다루는 다른 경우입니다.

이 도구는 `README.md`을 그대로 두고 언어당 하나의 로케일 파일을 작성합니다(예: `translated-docs/README.de.md`). README 내의 언어 행이 해당 파일들을 서로 연결합니다.

<a id="which-setup-are-you-in"></a>
## 어떤 설정에 해당하나요?

| 가지고 있는 것 | 스캐폴드 | 그 다음 |
| --- | --- | --- |
| JS/TS 앱과 README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, 기본값) | `t()`의 경우 [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js), README의 경우 이 페이지 |
| Python 앱과 README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | 앱의 경우 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python), README의 경우 이 페이지 |
| 다른 템플릿과 README | 해당 `init` 명령에 `--with-readme` 추가 | README 블록의 경우 이 페이지 |
| README 및 마크다운만 | `ai-i18n-tools init -t docs-markdown -P openrouter` | 이 페이지 |

`--with-readme`은 `ui-markdown` 및 `docs-markdown`에서 아무 작업도 수행하지 않습니다. 해당 템플릿에는 이미 README 블록이 포함되어 있기 때문입니다.

<a id="what-you-get"></a>
## 얻게 되는 것

- `README.md`은 원본 파일로 유지됩니다. 호스트는 이를 저장소의 첫 페이지로 계속 렌더링합니다.
- 각 대상 로케일은 `translated-docs/README.de.md`과 같은 형제 파일입니다.
- 원본 및 모든 번역본의 언어 행은 모든 로케일을 나열하며, 독자가 보고 있는 파일에서 작동하는 링크를 포함합니다.

해당 파일들도 번역되어야 하는 경우 `CONTRIBUTING.md`, `CHANGELOG.md` 또는 `docs/` 폴더를 동일한 블록에 추가합니다. [README 이상](#more-than-the-readme)을 참조하세요.

<a id="install"></a>
## 설치

CLI를 설치하고([설치](/ko/guide/installation)) 공급자용 API 키를 설정합니다([공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key)). Ollama는 키가 필요 없습니다.

`package.json`이 있는 저장소는 패키지를 개발 종속성으로 설치합니다. Node.js 프로젝트가 없는 저장소는 `npx ai-i18n-tools`을 실행하거나 [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables)을 사용할 수 있습니다.

<a id="scaffold"></a>
## 스캐폴드

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

`init`은 `ai-i18n-tools.config.json`만 작성합니다. `README.md`는 편집하지 않습니다. 구성에 README 블록이 포함된 경우, 붙여넣을 마커 라인을 출력하고 `README.md`이 누락된 경우 경고합니다. 기존 구성은 그대로 둡니다. [이미 가지고 있는 구성에 블록 추가](#add-the-block-to-a-config-you-already-have)에서와 같이 블록을 수동으로 추가하세요.

<a id="configure"></a>
## 구성

네 가지 주요 키가 중요합니다:

- `sourceLocale`: README가 작성된 언어. 어떤 언어든 유효합니다. 이 가이드에서는 영어가 일반적인 예시입니다.
- `targetLocales`: 추가할 언어.
- `features.translateDocs`: true여야 합니다. 하이브리드 구성은 `features.translateUIStrings`도 설정합니다.
- `docs[].contentPaths`: 번역할 Markdown 파일 및 폴더. 스캐폴드는 `README.md`를 나열합니다.

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

<a id="language-list"></a>
## 언어 목록 추가

독자들이 다른 언어를 볼 수 있도록 이 줄을 `README.md`에 넣으세요. 그 위에 있는 짧은 레이블은 일반적인 산문이며 번역될 것입니다.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

이 줄은 비어 있을 수 있습니다. `translate-docs`는 시작 마커부터 끝 마커까지의 모든 것을 로케일당 하나의 링크로 대체합니다. 펜스 코드 블록 내부의 마커는 무시되므로, 동일한 파일에 있는 구성 샘플은 일치하지 않습니다. 자세한 내용: [언어 전환기](/ko/guide/documents/language-switcher).

<a id="translate"></a>
## 번역

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync`는 활성화된 단계를 순서대로 실행합니다: UI 문자열이 켜져 있을 때 `extract` 및 `translate-ui`, 그 다음 `translate-docs`. 하나의 캐시가 공유되므로, 앱용으로 이미 번역된 문장은 README에 나타날 때 재사용됩니다. UI 카탈로그는 용어집 힌트(`ui[].uiGlossary`, 기본적으로 켜짐)로 문서 번역에 전달되어 버튼 및 기능 이름의 일관성을 유지합니다. [용어집](/ko/guide/glossary)을 참조하세요.

행의 언어 이름은 `ui-languages.json`에서 가져오며, `extract`은 이를 UI 카탈로그 옆에 작성합니다. README 전용 구성에는 UI 카탈로그가 없으므로, 이 행은 번들된 언어 목록을 대신 사용합니다. 레이블은 여전히 원어 이름입니다. 자신만의 프로젝트 매니페스트를 원할 때만 `generate-ui-languages`를 실행하세요.

`translated-docs/`를 커밋하고 호스트에서 번역된 README를 엽니다. 원본 README와 `translated-docs/README.de.md` 사이의 상대 링크는 각 파일에 대해 다시 작성됩니다.

<a id="hybrid-tips"></a>
## 하이브리드 팁

- `docs[].targetLocales`를 사용하여 README를 앱보다 적은 수의 언어로 번역하세요. [문서에 대한 적은 로케일](/ko/guide/combining-pipelines#fewer-locales-for-documents)을 참조하세요.
- 제품 용어를 `glossary.userGlossary`에 넣으세요. 동일한 CSV가 UI 문자열과 README에 사용됩니다.
- `ai-i18n-tools sync --no-docs` 또는 `ai-i18n-tools sync --no-ui`를 사용하여 한쪽만 실행하세요.

<a id="more-than-the-readme"></a>
## README 이상

`contentPaths`에 경로를 추가하세요. `flatPreserveRelativeDir`은 폴더를 유지하므로, `docs/guide.md`는 다른 `guide.md`와 충돌하는 대신 `translated-docs/docs/guide.de.md`가 됩니다.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore` 파일은 번역을 원하지 않는 경로를 건너뜁니다. `init --with-translate-ignore`은 시작 파일을 작성합니다. 코드 펜스, URL 및 헤딩 앵커는 번역되지 않습니다. [출력 레이아웃](/ko/guide/documents/output-layouts), [앵커 링크](/ko/guide/documents/anchor-links) 및 [링크 재작성](/ko/guide/documents/link-rewriting)을 참조하세요.

언어별로 다른 스크린샷: [이미지 및 스크린샷](/ko/guide/images-and-screenshots/).

<a id="links-on-the-host"></a>
## 호스트의 링크

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

<a id="keep-it-translated"></a>
## 번역 유지

소스 README 또는 앱 문자열이 변경되면 `sync`를 다시 실행하세요. 캐시는 새롭거나 변경된 텍스트만 모델로 보냅니다. `translated-docs/` 아래의 업데이트된 파일을 커밋하세요.

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

<a id="quality"></a>
## 번역이 자동임을 명시

AI 번역은 틀릴 수 있습니다. [이 저장소의 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)에 있는 것과 같이 README 하단에 짧은 메모를 추가하여 독자들에게 다른 언어는 기계 번역되었으며 의존하기 전에 확인해야 한다고 알립니다.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 가지고 있는 것 | 읽어볼 것 |
| --- | --- |
| 번역할 README가 없는 앱 UI 문자열 | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) |
| VitePress, Docusaurus, Starlight, Nextra, Fumadocs 또는 Astro 사이트 | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website). 저장소 README도 번역해야 하는 경우 `--with-readme`를 추가하세요. |
| 로케일당 하나의 HTML 파일 | [HTML 페이지](/ko/guide/documents/html-pages) |
| 전체 `translate-docs` 참조 | [문서](/ko/guide/documents/) |

<a id="examples"></a>
## 예시

| 프로젝트 | 표시 내용 |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | 작은 Node 앱과 플랫 README 블록 |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI 문자열, 문서 사이트 및 별도의 플랫 README 블록 |
| 이 저장소 | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): 플랫 README 블록, 그 다음 VitePress 사이트 |

<a id="agent-prompt"></a>
## 에이전트 프롬프트

이것을 Cursor 또는 다른 코딩 에이전트에 복사하세요. 저장소를 준비합니다. README를 번역하지 않습니다.

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
