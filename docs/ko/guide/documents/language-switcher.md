<a id="language-switcher-languagelistblock"></a>
# 언어 전환기(`languageListBlock`)

번역된 마크다운 파일에 **"다른 언어로 읽기"** 링크 행(로케일당 하나의 링크, 각 출력 파일에 상대적으로 계산된 `href` 값 포함)을 포함해야 하는 경우 `docsOutput.postProcessing.languageListBlock`를 사용합니다.

이 저장소는 [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)(`translated-docs/` 아래의 플랫 출력)에 이를 사용합니다. `translate-docs` 후, 각 번역된 사본은 새로 고쳐진 블록을 얻습니다. 예를 들어 [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md)는 `translated-docs/` 아래의 형제 로케일 파일과 저장소 루트의 영어 소스로 다시 연결됩니다.

`docsOutput.style = "flat"`(또는 형제 로케일 파일을 상대 경로로 주소 지정할 수 있는 다른 레이아웃)가 필요합니다. [출력 레이아웃](/guide/documents/output-layouts)을 참조하십시오.

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. 소스 마크다운에서 블록 표시

전환기 블록을 `start`과 `end`이라는 하위 문자열 마커로 구분된 HTML(또는 기타 라인)로 감쌉니다. 이 저장소에서는 다음을 사용합니다.

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
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

1. **추출** — 언어 목록 블록은 모델로 **전송되지 않음** (`translatable: false`).
2. **각 번역 파일별 처리** — 세그먼트 번역 및 선택적 평면 링크 재작성 후, `postProcessing`이 블록을 재구성합니다. 각 로케일마다 하나의 마크다운 링크를 생성하며, 레이블은 `ui-languages.json`에 존재하면 그 값을 사용하고(없으면 기본 마스터 카탈로그, 그 외에는 `localeDisplayNames` 사용), 경로는 현재 작성 중인 파일 기준의 상대 경로로 설정됩니다.
3. **소스 새로 고침** — `translate-docs` / `sync` 문서 처리가 끝난 후, 동일한 표준 블록이 `contentPaths`의 **영어 소스 파일**에 다시 쓰여지므로, 새로운 로케일 추가 시 모든 링크를 수동으로 편집하지 않고도 저장소 내 전환기가 자동으로 업데이트됩니다.

파일에 일치하는 블록이 없으면 CLI는 경고를 기록하고(`--verbose` 시), 본문은 그대로 유지됩니다.

<a id="4-label-manifest"></a>
## 4. 레이블 매니페스트

내부 레이블(`label: "local"`)의 경우 `generate-ui-languages`를 통해 `ui-languages.json`을 생성하거나 유지 관리합니다([`uiLanguagesPath`](/reference/configuration#uilanguagespath-optional) 필요). 이 저장소의 문서 전용 구성에는 UI 파이프라인이 없으므로 레이블은 `sourceLocale` + `targetLocales`의 번들 마스터 카탈로그에서 가져옵니다.

<a id="5-examples-in-this-repository"></a>
## 5. 이 저장소의 예시

| 예시 | 파일 |
|---|---|
| 이 패키지(플랫 README + VitePress 사이트) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README 블록: `docsOutput.style = "flat"`; 사이트 블록: `docsOutput.style = "vitepress"`; `json[]`를 통한 테마 JSON) |
| 플랫 README + Docusaurus 문서 | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (두 번째 블록: `docsOutput.style = "flat"`; 첫 번째 블록: `docsOutput.style = "docusaurus"`) |
| VitePress 문서(최소 데모) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `json[]` 테마 카탈로그) |

`<small id="lang-list">` 바로 이전 줄(예: `**Read in other languages:**`)은 일반적인 번역 가능한 구문이며 각 대상 로케일에서 현지화되며, 마커 내부의 링크 행은 `href` 및 매니페스트 기반 레이블을 제외하고는 원본 그대로 재생성됩니다.
