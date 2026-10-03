<a id="html-pages"></a>
# HTML 페이지

정적 사이트에서 로캘당 번역된 `.html` 또는 `.htm` 파일 하나가 필요할 때 Documents 파이프라인을 사용하십시오. `translate-docs`은(는) 소스 페이지를 번역하고 상대 링크를 다시 작성한 후 `outputDir` 아래에 로캘 사본을 기록합니다. 브라우저 i18n 런타임이나 `data-i18n*` 마커는 필요하지 않습니다.

하나의 HTML 파일이 제자리에 유지되고 브라우저 스크립트가 플랫 JSON에서 문자열을 즉석에서 교체할 때는 대신 [Plain HTML apps](/ko/guide/ui-strings/plain-html)를 사용하십시오. 동일한 파일을 두 파이프라인에 모두 넣지 마십시오. CLI는 HTML 파일이 `docs[]` 소스이면서 동시에 `ui.sourceRoots` 카탈로그 소스일 때 경고를 표시합니다.

실행 가능한 [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) 사이트는 포트 3092에서 영어를 서비스하고 포르투갈어를 `site/pt-BR/`에 기록합니다.

<a id="quick-start"></a>
## 빠른 시작

작동하는 구성을 스캐폴딩합니다:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

또는 이미 LLM [provider](/ko/guide/providers-and-models)가 있는 `ai-i18n-tools.config.json`에 이 HTML 부분을 추가합니다:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot`은(는) `contentPaths` 내부의 소스 트리여야 합니다. 로캘 디렉터리가 삽입되기 전에 제거됩니다. 위의 구성을 사용하면:

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

선택적으로 각 소스 페이지에 [language-list and hreflang markers](#language-list-and-hreflang)를 추가한 다음 다음을 실행합니다:

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

이 명령은 소스 언어 파일의 마커 내부도 새로 고칩니다. `outputDir` 아래의 로캘 파일은 생성된 출력으로 취급하십시오. 소스 페이지를 편집하고 명령을 다시 실행하십시오.

<a id="what-is-translated"></a>
## 번역 대상

HTML 추출기는 다음을 번역합니다:

- 문자가 포함된 표시 텍스트(`<title>` 및 인라인 마크업 주변 텍스트 포함)
- `alt`, `title`, `aria-label` 및 `placeholder` 속성 값
- `<input type="submit">` 및 `<input type="button">`의 `value`
- `meta name="description"`, `meta property="og:title"` 및 `meta property="og:description"`의 `content`

`<a>`, `<em>`, `<strong>`, `<span>`, `<img>` 및 `<br>`와 같은 인라인 요소는 주변 문장이 번역되는 동안에도 유지됩니다. `<code>` 및 `<kbd>`과 같은 코드 유사 인라인 요소는 그대로 유지됩니다:

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

전체 `script`, `style`, `textarea`, `pre` 및 `code` 하위 트리는 변경 없이 복사됩니다. `class`, `id`, `src`, `href` 및 URL 포함 메타데이터를 포함한 다른 속성은 모델로 전송되지 않습니다.

각 로캘 사본에서 파이프라인은 `<html lang="…">`과(와) 로캘의 `dir`(`ltr` 또는 `rtl`)을(를) 설정합니다. 소스 페이지는 작성된 `lang` 및 `dir`을(를) 유지합니다. UTF-8 HTML을 사용하십시오. CLI는 `<meta charset>`이(가) 다른 인코딩을 선언할 때 경고를 표시합니다.

<a id="output-layout"></a>
## 출력 레이아웃

일반적인 정적 사이트 레이아웃의 경우 다음을 설정합니다:

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"`은(는) `{outputDir}/{locale}/{path relative to docsRoot}`을(를) 기록합니다. `style: "flat"`은(는) `site/about.pt-BR.html`과(와) 같은 로캘 접미사가 붙은 파일을 기록합니다. 모든 스타일 및 사용자 지정 경로 템플릿은 [Output layouts](/ko/guide/documents/output-layouts)를 참조하십시오.

`outputDir` 아래에 생성된 로캘 디렉터리 및 플랫 로캘 파일 이름은 향후 소스 검색에서 제외됩니다. 이렇게 하면 `site/pt-BR/index.html` 또는 `site/index.pt-BR.html`이(가) 다시 번역되는 것을 방지할 수 있습니다.

<a id="links-and-images"></a>
## 링크 및 이미지

`.html` 또는 `.htm`(으)로 끝나는 상대 링크는 대상이 동일한 `docs[]` 블록 내의 다른 소스 페이지일 때 다시 작성됩니다. 쿼리 문자열과 프래그먼트는 유지됩니다. 예를 들어 `site/index.html`의 `href="about.html#history"`은(는) `site/pt-BR/index.html`의 `href="./about.html#history"`이(가) 됩니다.

다른 상대 `href`, `src`, `srcset` 및 `poster` URL은 공유 파일이 로캘 페이지에서 계속 확인될 수 있도록 깊이 접두사가 추가됩니다. 절대 URL, 프로토콜 상대 URL, `data:` URL 및 프래그먼트 전용 링크는 변경되지 않습니다. 루트 상대 URL은 루트 상대 상태로 유지됩니다.

`docsOutput.localizedAssets`은(는) 로캘별 이미지 또는 아이콘 파일 이름을 선택할 수 있습니다:

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| 자리 표시자 | 의미 |
| --- | --- |
| `{stem}` | 확장자를 제외한 파일 이름 |
| `{ext}` | 점을 포함한 확장자 |
| `{basename}` | 확장자를 포함한 파일 이름 |
| `{locale}` | 구성된 로케일 코드(`pt-BR`) |
| `{llocale}` | 소문자 로케일 |
| `{LOCALE}` | 대문자 로케일 |

`img/trulli.jpg`은 `img/trulli-pt-BR.jpg`이 됩니다. `onlyIfExists: true`(기본값)를 사용하면 해당 URL은 지역화된 파일이 존재할 때만 사용되며, 그렇지 않으면 원본 공유 자산이 유지됩니다. 다른 빌드나 CDN 단계에서 해당 파일을 보장하는 경우에만 `onlyIfExists: false`을 설정하세요.

`include`은 `img/**`과 같은 URL 경로와 일치합니다. `assetRoot`를 사용하여 지역화 후보, 특히 `/img/trulli.jpg`과 같은 루트 상대 URL이 확인되는 파일 시스템 디렉터리를 설정하세요.

동일한 지역화 규칙이 `srcset`, `poster`, `<source src>`, 아이콘 `<link href>` 및 `og:image` / `twitter:image`에 적용됩니다. 파이프라인은 참조를 재작성하지만 자산 파일을 생성, 번역 또는 복사하지는 않습니다. CSS `url()` 값은 재작성되지 않습니다.

<a id="language-list-and-hreflang"></a>
## 언어 목록 및 hreflang

표시되는 탐색이 위치할 곳에 언어 목록 쌍을 배치하고, `<head>` 내부에 hreflang 쌍을 배치하세요:

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

실행할 때마다 파이프라인은 각 쌍 사이의 콘텐츠만 대체합니다. 모든 로캘 사본과 소스 페이지를 업데이트하여 대체 링크가 상호 연결되도록 유지합니다. `script`, `style`, `pre` 및 `code` 내부의 마커는 무시됩니다. `--verbose`를 사용하면 구성된 쌍이 누락된 경우 CLI에서 경고합니다.

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

기본 주석은 `docsOutput.html`이 생략된 경우에도 작동합니다. 소스에서 다른 마커 텍스트를 사용하는 경우에만 `languageList.start` / `end` 또는 `hreflang.start` / `end`를 설정하세요.

### 표시되는 언어 탐색

- `format: "links"`은 `<a>` 요소를 작성합니다. `<ul>`, `<ol>` 또는 `<nav>` 내부에서는 각 링크가 `<li>`로 래핑되며, 다른 곳에서는 `separator`이 링크를 연결합니다.
- `format: "select"`은 `<option>` 행을 작성합니다. 마커를 고유한 `<select data-lang-select>` 내부에 배치하고, `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js`을 사이트에 복사한 다음 해당 클래식 스크립트를 로드하세요. 선택한 옵션의 생성된 URL로 이동합니다.
- `label`은 `local`(자국어명), `english` 또는 `both`(다를 경우 `English / endonym`)입니다. 레이블은 사용 가능한 경우 `ui-languages.json`에서 가져오고, 그 다음으로 패키지에 번들된 로캘 목록에서 가져옵니다.

하나의 마커 블록은 하나의 형식을 사용합니다. 생성된 링크에는 `lang`, `hreflang` 및 `aria-current`이 포함되며, 현재 페이지에 대해 생성된 옵션에는 `selected`이 있습니다.

### 검색 엔진 대체 링크

`hreflang.siteUrl`은 대체 URL의 접두사입니다. 배포 전에 사이트의 공개 오리진으로 설정하세요. 생략하면 파이프라인은 상대적 대체 링크를 작성하고 경고를 기록합니다.

`xDefault`의 기본값은 `sourceLocale`이며, 해당 로캘이 페이지에 구성된 경우에만 내보내집니다. `stripIndexHtml: true`는 `index.html` 대체를 디렉터리 URL로 변환합니다.

마커 블록은 필수입니다. 파이프라인은 `<head>`에 태그를 자동으로 삽입하지 않습니다. 또한 사이트맵, 표준 URL 또는 `og:locale`을 생성하지 않으며, 브라우저 언어에 따라 리디렉션하지도 않습니다.

구성된 소스 및 대상 로캘만 언어 블록에 사용할 수 있습니다. `ui-languages.json`이 존재하는 경우 해당 행과 순서에 따라 표시되는 적격 로캘이 결정되므로 매니페스트를 구성과 일치시키세요. `--locale`을 사용하여 하위 집합만 생성하도록 번역하는 경우, 연결된 모든 로캘 출력이 존재할 때까지 게시하지 마세요.

<a id="second-run"></a>
## 두 번째 실행

문장 번역은 캐시에 유지됩니다. 파일 추적 해시에는 로캘 목록, 출력 스타일, `docsOutput.html` 및 `localizedAssets`도 포함됩니다. 로캘을 추가하거나 해당 옵션을 변경하면 모든 문장이 이미 캐시된 경우에도 생성된 블록과 링크가 재작성됩니다. 일치하는 해시와 최신 출력 파일이 있으면 해당 로캘 페이지를 건너뜁니다.

<a id="troubleshooting"></a>
## 문제 해결

| 증상 | 확인할 사항 |
| --- | --- |
| 출력이 `site/pt-BR/site/index.html`임 | 소스 접두사가 제거되도록 `docsOutput.docsRoot`을 `"site"`로 설정하세요. |
| 링크가 여전히 영어 페이지를 가리킴 | 상대적 `.html` / `.htm` 링크를 사용하고, 대상 페이지를 동일한 `docs[]` 블록에 포함하세요. |
| 로캘 페이지에서 이미지 경로가 손상됨 | 깊이 재작성이 적용될 수 있도록 상대 경로로 유지하세요. CSS `url()`은 재작성되지 않는다는 점을 유의하세요. |
| 지역화된 이미지가 선택되지 않음 | `localizedAssets.include`, 파일 이름 `pattern`, 그리고 `onlyIfExists`이 true일 때 후보가 존재하는지 확인하세요. |
| 언어 목록이 비어 있거나 변경되지 않음 | 두 마커 주석을 올바른 순서로 유지하고 `script`, `style`, `pre` 및 `code` 외부에 배치하세요. |
| 드롭다운이 탐색되지 않음 | `<select>`에 `data-lang-select`을(를) 추가하고 `html-runtime/lang-select.js`을(를) 로드합니다. |
| Hreflang URL이 잘못된 호스트를 사용함 | `hreflang.siteUrl`을(를) 최종 퍼블릭 오리진으로 설정합니다. |
| 번역된 페이지가 다시 번역됨 | 생성된 로케일 파일을 구성된 `outputDir` 아래에 두고, 별도 소스로 추가하지 마십시오. |
