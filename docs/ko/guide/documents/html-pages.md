<a id="html-pages"></a>
# HTML 페이지

`translate-docs`을 사용하면 로케일당 하나의 HTML 파일을 생성할 수 있습니다. `docs[]` `contentPaths` 항목에 `.html` 또는 `.htm` 파일을 배치하고 `translate-docs` 또는 `sync`을 실행하십시오. 영어 파일은 소스로 유지됩니다. 로케일 사본은 `outputDir` 아래에 작성됩니다.

각 언어가 독립된 페이지인 경우(정적 사이트, 직접 작성한 HTML 문서 집합) 이 방식을 사용하십시오. 하나의 HTML 파일이 제자리에 유지되고 브라우저가 단순 JSON에서 문자열을 교체하는 경우에는 [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을 사용하십시오.

다음으로 스캐폴딩합니다:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

실행 가능한 데모는 [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs)입니다(포트 3092).

<a id="what-is-translated"></a>
## 번역 대상

번역 대상: 표시되는 텍스트, `alt`, `title`, `aria-label`, `placeholder`, `<title>`, `meta name="description"` 및 `og:title` / `og:description`.

변경되지 않음: `script`, `style`, `textarea`, `pre` 및 `code` 요소와 `src`, `href` 및 기타 URL. `<code>` 또는 `<em>`을 포함하는 단락은 해당 태그를 유지하고 주변 단어를 번역합니다.

`html lang`과 `dir`은 로케일 파일에 설정됩니다. 영어 소스는 사용자가 변경할 때까지 자체 `lang`를 유지합니다.

생성된 로케일 파일이 `outputDir`(`pt-BR/` 디렉터리 또는 플랫 `name.pt-BR.html`) 아래에 있으면 다음 실행 시 건너뜁니다. 동일한 `.html` 파일이 UI 카탈로그 소스(`ui.sourceRoots`)이기도 한 경우 경고가 출력됩니다.

<a id="links-and-images"></a>
## 링크 및 이미지

동일한 `docs[]` 블록 내의 다른 HTML 페이지에 대한 링크는 해당 페이지의 로케일 출력으로 재작성됩니다. 다른 상대 URL에는 접두사가 추가되어 로케일 파일 기준으로 경로가 계속 확인되도록 합니다.

`docsOutput.localizedAssets`은 로케일별 파일이 존재할 경우 선택적으로 이미지 및 아이콘의 이름을 변경합니다. CSS `url()`은 재작성되지 않습니다.

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

위의 패턴을 사용한 `img/trulli.jpg`은 `img/trulli-pt-BR.jpg`이 됩니다. `onlyIfExists: true`(기본값)를 사용하면 해당 파일이 없을 때 원래 URL이 유지됩니다. 절대 URL, `data:` URL 및 `#` 프래그먼트는 건너뜁니다. 루트 상대 URL(`/img/trulli.jpg`)은 `assetRoot` 아래에서 테스트되거나, `assetRoot`이 생략된 경우 HTML 파일의 디렉터리 아래에서 테스트됩니다.

`srcset`, `poster`, `<source src>`, 아이콘 `<link>` URL 및 `og:image` / `twitter:image`에는 동일한 규칙이 적용됩니다.

HTML의 경우, 로캘 폴더가 추가되기 전에 프로젝트 상대 경로에서 `docsOutput.docsRoot`이(가) 제거됩니다. `docsRoot: "site"` 및 `style: "nested"`를 사용할 경우 `site/index.html`이(가) `site/pt-BR/index.html`에 기록됩니다.

<a id="language-list-and-hreflang"></a>
## 언어 목록 및 hreflang

대체 링크가 상호 간에 일관성을 유지하도록 모든 로캘 사본과 영어 원본에 두 쌍의 주석이 채워집니다:

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

`script`, `style`, `pre` 및 `code` 내부의 마커는 무시됩니다. 상세 모드 실행 시 페이지에 쌍이 없으면 경고가 표시됩니다. `docsOutput.html`이(가) 생략되면 동일한 주석이 기본값으로 사용됩니다.

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

`format: "links"`은(는) `<a>` 요소를 작성합니다. `<ul>`, `<ol>` 또는 `<nav>` 내부에서 각 링크는 `<li>`(으)로 감싸집니다. `format: "select"`은(는) `<option>` 행을 작성합니다. 마커를 사용자 지정 `<select data-lang-select>` 안에 넣고 `lang-select.js`을(를) 로드하세요(`ai-i18n-tools/html-runtime/lang-select.js`(으)로 제공되며 예제에 복사됨). 하나의 블록에는 하나의 형식을 사용합니다.

`label`은(는) `local`(자국어 명칭), `english` 또는 `both`(서로 다른 경우 `English / endonym`)입니다. 구성된 세트에 포함되지 않은 로캘은 생략됩니다.

`hreflang.siteUrl`은(는) 대체 링크에 접두사를 추가합니다. 설정되지 않은 경우 링크는 상대 경로로 처리되며 경고가 로그에 기록됩니다. `xDefault`의 기본값은 `sourceLocale`입니다. `stripIndexHtml`은(는) `index.html`을(를) 디렉터리 URL로 변환합니다.

사이트맵 파일이 없으며, 자동 `<head>` 삽입 및 `canonical` 또는 `og:locale` 재작성 기능도 없습니다. 브라우저 언어 설정에 따라 방문자가 리디렉션되지 않습니다.

<a id="second-run"></a>
## 두 번째 실행

문장 번역은 캐시에 유지됩니다. 파일 추적 해시에는 로캘 목록 및 `docsOutput.html` / `localizedAssets`도 포함됩니다. 로캘을 추가하면 모든 문장이 이미 캐시되어 있더라도 언어 목록과 hreflang 블록이 다시 작성됩니다. 해시가 일치하고 출력 파일이 최신 상태이면 해당 페이지는 건너뜁니다.
