<a id="language-switcher-languagelistblock"></a>
# 언어 전환기(`languageListBlock`)

번역된 마크다운 파일에 **"다른 언어로 읽기"** 링크 행(로케일당 하나의 링크, 각 출력 파일에 상대적으로 계산된 `href` 값 포함)을 포함해야 하는 경우 `docsOutput.postProcessing.languageListBlock`를 사용합니다.

이 저장소는 [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)(`translated-docs/` 아래의 플랫 출력)에 이를 사용합니다. `translate-docs` 후, 각 번역된 사본은 새로 고쳐진 블록을 얻습니다. 예를 들어 [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md)는 `translated-docs/` 아래의 형제 로케일 파일과 저장소 루트의 영어 소스로 다시 연결됩니다.

``docsOutput.style = "flat"``(또는 형제 로케일 파일을 상대 경로로 지정할 수 있는 다른 레이아웃)이 필요합니다. [출력 레이아웃](/ko/guide/documents/output-layouts)을 참조하세요. 리포지토리 README에 처음으로 추가하는 경우: [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme).

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. 소스 마크다운에서 블록 표시

전환기 블록을 `start`과 `end`이라는 하위 문자열 마커로 구분된 HTML(또는 기타 라인)로 감쌉니다. 이 저장소에서는 다음을 사용합니다.

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/ko/) · [Deutsch](./README.de.md) · …</small>
```

초기 링크 텍스트는 단지 자리표시자일 뿐입니다. `translate-docs`은 `start`을 포함한 첫 번째 라인부터 이후에 등장하는 `end`를 포함한 첫 번째 라인까지의 전체 구간을 대체합니다 (코드 블록 안의 마커는 무시되므로 동일 파일 내 구성 예제는 대상에서 제외됨).

<a id="2-configure-the-block"></a>
## 2. 블록 구성

`start`과 `end`은 임의의 하위 문자열 마커입니다. 반드시 `<small id="lang-list">` / `</small>`일 필요는 없습니다. 언어 전환기 블록에만 유일하게 나타나는 시작 및 종료 텍스트를 선택하면 됩니다. 예를 들어 다른 HTML 태그(`<div class="lang-switcher">` … `</div>`), HTML 주석(`<!-- lang-list -->` … `<!-- /lang-list -->`), 또는 마크다운 전용 경계(예: `**Languages:**`로 시작하는 라인부터 `---`로 끝나는 라인까지)를 사용할 수 있습니다. 소스 파일에 입력한 내용과 정확히 일치하도록 설정 파일의 `start`과 `end`을 지정하세요.

루트 구성([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| 필드       | 역할                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | 블록의 시작 라인을 식별하는 하위 문자열                                                  |
| `end`       | 닫는 줄의 부분 문자열 (`start`와 함께 한 줄에 나타날 경우 동일한 줄일 수 있음)             |
| `separator` | 생성된 `[label](href)` 링크 사이에 삽입될 텍스트 (이 저장소는 `" · "` 사용)                                    |
| `label`     | 선택 사항: `"local"`(기본값)은 매니페스트의 각 로케일 고유명을 사용하며, `"english"`는 `englishName`을 사용함 |

<a id="3-what-happens-at-runtime"></a>
## 3. 런타임 시 발생하는 일

1. **추출** — 언어 목록 조각은 모델로 **전송되지** 않습니다(`translatable: false`).
2. **번역된 파일별** — 세그먼트 번역 및 선택적 플랫 링크 재작성 후, `postProcessing`이 블록을 다시 빌드합니다. 로캘당 마크다운 링크 하나, `ui-languages.json`가 있으면 해당 레이블(없으면 번들된 마스터 카탈로그, 그것도 없으면 `localeDisplayNames`), 작성 중인 파일을 기준으로 한 상대 경로입니다.
3. **원본 새로 고침** — `translate-docs` / `sync` 문서 처리 단계의 끝에서, 동일한 정식 블록이 `contentPaths`의 **원본 로캘 파일**에 다시 기록되므로 로캘을 추가하면 모든 링크를 직접 편집하지 않아도 저장소의 전환기가 업데이트됩니다. 해당 파일은 `sourceLocale`로 작성되며, 어떤 언어든 될 수 있습니다.

파일에 일치하는 블록이 없으면 CLI는 경고를 기록하고(`--verbose` 시), 본문은 그대로 유지됩니다.

<a id="4-label-manifest"></a>
## 4. 레이블 매니페스트

고유명 레이블(`label: "local"`)의 경우, `generate-ui-languages`를 통해 `ui-languages.json`을(를) 생성하거나 유지합니다 ([`languagesManifestPath`](/ko/reference/configuration#languagesmanifestpath-optional)에 기록되며 기본값은 `{ui.flatOutputDir}/ui-languages.json`임). 이 저장소의 문서 전용 구성에는 UI 파이프라인이 없고 디스크에 프로젝트 매니페스트가 없으므로, 레이블은 `sourceLocale` + `targetLocales`에 대한 번들 마스터 카탈로그에서 가져옵니다.

<a id="5-examples-in-this-repository"></a>
## 5. 이 저장소의 예시

| 예시 | 파일 |
|---|---|
| 이 패키지(플랫 README + VitePress 사이트) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README 블록: `docsOutput.style = "flat"`; 사이트 블록: `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| 플랫 README + Docusaurus 문서 | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (두 번째 블록: `docsOutput.style = "flat"`; 첫 번째 블록: `docsOutput.style = "docusaurus"`) |
| Docusaurus 문서 전용               | [examples/docusaurus-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) (`docsOutput.style = "docusaurus"` + `docusaurusCatalogDir`) |
| VitePress 문서 (최소 데모) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

`<small id="lang-list">` 바로 이전 줄(예: `**Read in other languages:**`)은 일반적인 번역 가능한 구문이며 각 대상 로케일에서 현지화되며, 마커 내부의 링크 행은 `href` 및 매니페스트 기반 레이블을 제외하고는 원본 그대로 재생성됩니다.

<a id="html-pages"></a>
## HTML 페이지

일반 HTML 문서는 다른 주석 쌍인 `<!-- ai-i18n:lang-list -->` 및 `<!-- ai-i18n:hreflang -->`을 사용합니다. 언어 목록은 링크 또는 `<select>`일 수 있으며, hreflang 대체 항목은 각 대상 로케일 파일뿐만 아니라 소스 로케일 파일에도 작성됩니다. [HTML 페이지](/ko/guide/documents/html-pages#language-list-and-hreflang)를 참조하세요.
