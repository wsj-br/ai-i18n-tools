<a id="link-rewriting"></a>
# 링크 재작성

`translate-docs`는 번역된 마크다운에서 URL을 재작성하여 파일이 로케일별 경로로 이동한 후에도 링크가 계속 확인되도록 합니다. 대부분의 페이지 간 링크는 자동으로 처리됩니다. 사이트에서 공유 정적 URL 트리 또는 로케일 코딩된 자산 폴더를 사용하는 경우 `docsOutput.postProcessing.regexAdjustments` 규칙을 추가합니다.

<a id="built-in-rewriters"></a>
## 내장 재작성기

실행되는 재작성기는 `docsOutput.style`에 따라 달라집니다.

| 레이아웃 | 내장 재작성기 | 수정 내용 |
| --- | --- | --- |
| `"flat"` (사용자 지정 `pathTemplate`이 없을 때 기본값) | 플랫 링크 재작성기 (`rewriteRelativeLinks`, 기본적으로 켜짐) | 페이지 간 상대 링크 (`guide.md` → `guide.de.md`) 및 비마크다운 자산 URL의 깊이 접두사 |
| `"vitepress"` | VitePress 링크 정규화기 (`rewriteVitepressLinks`, 기본적으로 켜짐) | README 스타일 `docs/guide/…` 경로 → 사이트 경로 (`/guide/…`) |
| `"nextra"` | Nextra 링크 정규화 도구(`rewriteNextraLinks`, 기본적으로 켜짐) | `content/en/…` 및 상대 `.mdx` 경로 → 로케일 중립 경로(`/guide/…`) |
| `"fumadocs"` | Fumadocs 링크 정규화 도구(`rewriteFumadocsLinks`, 기본적으로 켜짐) | `content/docs/…` 및 상대 `.mdx` 경로 → 로케일 중립 경로(`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | 없음 | `postProcessing`까지 소스 URL은 변경되지 않고 통과 |

사용자 지정 `pathTemplate`는 `rewriteRelativeLinks: true`을 명시적으로 설정하지 않는 한 플랫 재작성기를 비활성화합니다. 페이지 간 `#anchor` 처리에 대해서는 [출력 레이아웃](/ko/guide/documents/output-layouts) 및 [앵커 링크](/ko/guide/documents/anchor-links)를 참조하세요.

VitePress 전용 작성 규칙은 [VitePress 통합 — 링크 규칙](/ko/guide/integrations/vitepress#link-conventions)을 참조하세요.

Nextra 전용 작성 규칙은 [Nextra 통합 — 링크 규칙](/ko/guide/integrations/nextra#link-conventions)을 참조하세요.

Fumadocs 전용 작성 규칙은 [Fumadocs 통합 — 링크 규칙](/ko/guide/integrations/fumadocs#link-conventions)을 참조하세요.

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

내장 재작성기가 충분하지 않을 때 `docs[].docsOutput.postProcessing` 아래에 정렬된 `{ "description"?, "search", "replace" }` 규칙을 추가합니다. 예를 들면 다음과 같습니다.

- **로케일 폴더 세그먼트**를 포함하는 스크린샷 또는 이미지 URL (`screenshots/en-GB/` → `screenshots/de/`)
- 영어 소스 및 번역된 출력 트리 간에 다른 절대 사이트 루트 경로 (`/img/…`)
- 대상 로케일별로 변경되어야 하지만 단순한 상대 마크다운 링크가 아닌 모든 URL 패턴

`postProcessing`는 **재조립된 번역된 마크다운 본문**에서 실행됩니다 (YAML 프런트 매터 키와 비산문 값은 보존됨). 세그먼트 재조립 및 내장 링크 재작성 **후**에 실행되며, `addFrontmatter` **전**에 실행됩니다.

<a id="two-step-flow-with-flat-layout"></a>
### 플랫 레이아웃을 사용한 2단계 흐름

`docsOutput.style = "flat"`일 때 플랫 링크 재작성기가 먼저 실행된 다음 `regexAdjustments`이 실행됩니다.

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

`outputDir: "translated-docs/"`이고 소스 `README.md`이 리포지토리 루트에 있는 예시:

1. 플랫 재작성기: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

**이미 접두사가 붙은 URL 내부**의 로케일 세그먼트와 일치하도록 `search` 패턴을 작성합니다. 정규식에 `../` 깊이 접두사를 포함할 필요는 없습니다.

`doc-system` 레이아웃의 경우 플랫 재작성기가 실행되지 않습니다. `regexAdjustments`은 소스 마크다운의 원래 URL (일반적으로 `/img/screenshots/en-GB/foo.png`와 같은 절대 경로)을 봅니다.

깊이 접두사 동작 및 `flatPreserveRelativeDir`에 대해서는 [플랫 링크 재작성기 및 2단계 흐름](/ko/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)을 참조하세요.

<a id="replace-placeholders"></a>
### `replace` 자리 표시자

`replace` 문자열은 파일 및 로케일별로 확장되는 템플릿 변수를 지원합니다.

| 플레이스홀더 | 값 |
| --- | --- |
| `${translatedLocale}` | 대상 로케일 (정규화된 BCP-47) |
| `${sourceLocale}` | 소스 로케일 |
| `${sourceFullPath}` | 절대 소스 파일 경로 (POSIX `/`) |
| `${translatedFullPath}` | 절대 번역 출력 경로 |
| `${sourceFilename}` / `${translatedFilename}` | 확장자를 포함한 기본 이름 |
| `${sourceBasedir}` / `${translatedBasedir}` | 소스 / 출력 파일의 상위 디렉터리 |

`search`는 정규식 패턴입니다. 일반 문자열은 `g` 플래그를 사용합니다. 다른 플래그가 필요한 경우 `/pattern/flags`를 사용하십시오 (패턴에 이스케이프되지 않은 `/` 문자가 포함되어서는 안 됩니다).

<a id="common-patterns"></a>
## 일반적인 패턴

<a id="per-locale-asset-folder"></a>
### 로케일별 자산 폴더

처음부터 로케일 코드가 지정된 하위 디렉터리에 자산을 저장하고 하나의 일반 규칙으로 세그먼트를 교체합니다.

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

소스 로케일(`en-GB`)을 하드코딩하는 대신 `[^/]+`를 사용하면 `sourceLocale`가 변경되어도 규칙이 계속 작동합니다.

전체 연습: [이미지 및 스크린샷 — 로케일별 폴더](/ko/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### 문서 시스템 정적 URL

공유 정적 트리에서 스크린샷을 제공하는 Docusaurus, Starlight 또는 기타 `doc-system` 사이트의 경우:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

생성기가 지원하는 경우 소스 마크다운에서 공동 배치된 상대 경로(`../assets/name.png`)를 선호합니다. 그러면 `regexAdjustments` 브리지가 필요하지 않습니다. 레이아웃 선택에 대해서는 [이미지 및 스크린샷](/ko/guide/images-and-screenshots/)을 참조하십시오.

<a id="when-regex-is-not-needed"></a>
### 정규식이 필요 없는 경우

###는 일반적으로 **필요하지 않습니다** `regexAdjustments`를 사용할 때:

- 페이지 간 링크가 간단한 상대 마크다운 경로이고 `docsOutput.style = "flat"`인 경우 (내장된 재작성기가 로케일 접미사를 추가함)
- 자산이 소스 파일 옆에 있고 플랫 재작성기의 파일별 깊이 접두사가 올바르게 해결하는 경우
- 영어 및 모든 번역된 사본이 **동일한** URL을 사용하는 경우 (사이트 루트의 공유 이미지, 공동 배치된 자산, 정규화기 후 VitePress 사이트 경로)
- VitePress 인-사이트 링크가 사이트 경로 또는 `docs/guide/…` 경로와 `rewriteVitepressLinks: true`를 사용하는 경우
- Nextra 및 Fumadocs 페이지 내 링크는 로케일 중립 경로(`/guide/…`, `/docs/…`) 또는 `rewriteNextraLinks` / `rewriteFumadocsLinks: true`가 있는 콘텐츠 루트 경로를 사용합니다.

<a id="full-config-example"></a>
## 전체 구성 예시

로케일별 스크린샷과 선택적 언어 전환 블록이 있는 플랫 README:

<details>
<summary>플랫 레이아웃: regexAdjustments + languageListBlock</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

필드 참조: [구성 — `docs`](/ko/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## 문제 해결

| 증상 | 예상 원인 | 확인할 사항 |
| --- | --- | --- |
| 번역된 페이지가 이미지 또는 정적 자산에서 404 오류 발생 | URL 레이아웃에 대한 `regexAdjustments` 누락 또는 잘못됨 | [이미지 및 스크린샷 — 문제 해결](/ko/guide/images-and-screenshots/troubleshooting) |
| 링크가 올바른 파일을 열지만 잘못된 `#section` | 앵커 슬러그 드리프트, URL 재작성 아님 | [앵커 링크](/ko/guide/documents/anchor-links) |
| `regexAdjustments` 규칙이 플랫 레이아웃에 영향을 미치지 않음 | `search`은 재작성 전 URL을 예상하지만 플랫 레이아웃은 이미 깊이 접두사를 추가함 | 접두사가 붙은 경로 내의 세그먼트와 일치시킴([두 단계 흐름](#two-step-flow-with-flat-layout) 참조) |
| 런타임에 잘못된 정규식 건너뜀 | 잘못된 `search` 패턴 | CLI는 `description` 규칙으로 경고함; 샘플 번역된 출력에 대해 패턴 테스트 |
