<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# 플랫 링크 재작성기와 2단계 흐름

스크린샷 URL 레이아웃과 플랫 2단계 에셋 흐름은 이 페이지를 참조하세요. 페이지 간 마크다운 링크 및 `replace` 플레이스홀더에 대해서는 [문서 — 링크 재작성](/ko/guide/documents/link-rewriting)을 참조하세요.

`docsOutput.style = "flat"`의 경우(및 `rewriteRelativeLinks: false` 또는 사용자 지정 `pathTemplate`가 설정되지 않은 경우), 내장된 재작성기가 `postProcessing` 전에 실행됩니다. 이는 교차 문서 링크(로케일 접미사 추가)를 처리하고 비마크다운 자산 URL에 깊이 접두사를 추가합니다. 로케일별 자산 경로(스크린샷, `/img/…` 브리지)는 `docsOutput.postProcessing.regexAdjustments`에 의해 재작성됩니다.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"`일 때의 두 단계 흐름

1. **소스 URL** — 번역된 마크다운의 이미지 경로(세그먼트 재조립 후)
2. **플랫 링크 재작성기** — 깊이 접두어를 추가(`../`, `../../docs/`, …)
3. **`regexAdjustments`** — 로케일 폴더 세그먼트를 교체(`en-GB` → `${translatedLocale}`)
4. **출력 URL** — 번역된 파일에 기록되는 최종 경로

`outputDir: "translated-docs/"`이고 소스 `README.md`이 리포지토리 루트에 있는 예시:

1. 플랫 링크 재작성기: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/`용 `../` 하나)
2. `regexAdjustments` 규칙 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`flat` 스타일이 아닌 모든 경우(`"nested"`, `"doc-system"` 및 `"docusaurus"`, `"astro-starlight"`, `"vitepress"`와 같은 프리셋 포함)에는 플랫 링크 재작성기가 실행되지 않습니다. `regexAdjustments`는 번역된 마크다운의 원본 URL(일반적으로 `/img/screenshots/en-GB/foo.png`와 같은 절대 경로)을 그대로 봅니다.

**Astro Starlight MDX:** Starlight 콘텐츠는 종종 `.mdx`입니다. 해당 파일에 대해서는 `translate-docs`이 `postProcessing.regexAdjustments`만 실행합니다 — 플랫, VitePress, Nextra 또는 Fumadocs 링크 재작성기는 실행하지 않습니다. 로케일별 스크린샷 경로는 여전히 동일한 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 규칙을 사용합니다. [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/)를 참조하세요.

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress 링크 정규화 도구 (`style: "vitepress"`)

`docsOutput.rewriteVitepressLinks`가 `true`일 때(기본값은 `style`가 `"vitepress"`일 때), 세그먼트 재조립 후에 별도의 정규화 도구가 실행됩니다(플랫 재작성기 대신). 이는 영어가 콘텐츠 루트에 있고 로케일이 형제 폴더(예: `docs/de/guide/…`)에 있는 VitePress/문서 시스템 사이트를 대상으로 합니다.

1. **소스 href** — 번역된 마크다운의 링크(세그먼트 재조립 후)
2. **VitePress 링크 정규화기** — 문서 경로를 사이트 라우트로 재작성(`/guide/…`)
3. **`regexAdjustments`** — 스크린샷을 위한 선택적 로케일 폴더 교체(`screenshots/en-GB/` → `screenshots/de/`, …)
4. **출력 href** — 번역된 파일에 기록되는 최종 URL

일반적인 재작성:

| 소스 패턴 | 정규화된 대상 |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (로케일 파일에서) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 변경 없음(리포지토리 경로에는 전체 URL 사용) |

`README.md` → `docs/index.md`로 동기화하는 프로젝트의 경우, VitePress 트리 외부의 `LICENSE`, `examples/` 및 기타 파일에 대해 `README.md`에서 전체 GitHub URL을 사용하세요. [VitePress 통합 — README를 문서 홈페이지로 사용](/ko/guide/integrations/vitepress#readme-as-homepage)을 참조하세요.

플랫 리라이터와 VitePress 노멀라이저는 `docs[]` 블록마다 상호 배타적이며, `regexAdjustments` 이전에 하나만 실행됩니다. [VitePress 통합 — 링크 규칙](/ko/guide/integrations/vitepress#link-conventions)을 참조하세요.

로케일별 스크린샷 폴더는 필요 시 여전히 동일한 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` `regexAdjustments` 규칙을 사용합니다. [로케일별 폴더](/ko/guide/images-and-screenshots/per-locale-folder)를 참조하세요.

<a id="nextra-link-normalizer-style-nextra"></a>
### Nextra 링크 정규화 도구 (`style: "nextra"`)

`docsOutput.rewriteNextraLinks`이(가) `true`인 경우(`style`이(가) `"nextra"`일 때 기본값), 세그먼트 재조립 후 별도의 노멀라이저가 실행됩니다. 이 노멀라이저는 `content/en/…` 및 상대적 `.mdx` 경로를 로케일 중립 경로(`/guide/…`)로 다시 작성합니다. [Nextra 통합 — 링크 규칙](/ko/guide/integrations/nextra#link-conventions)을 참조하세요.

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Fumadocs 링크 정규화 도구 (`style: "fumadocs"`)

`docsOutput.rewriteFumadocsLinks`이(가) `true`인 경우(`style`이(가) `"fumadocs"`일 때 기본값), 세그먼트 재조립 후 별도의 노멀라이저가 실행됩니다. 이 노멀라이저는 `content/docs/…` 및 상대적 `.mdx` 경로를 로케일 중립 경로(`/docs/…`)로 다시 작성합니다. [Fumadocs 통합 — 링크 규칙](/ko/guide/integrations/fumadocs#link-conventions)을 참조하세요.

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir`과 함께 사용하는 파일별 깊이 접두사

깊이 접두사는 전체 일괄 처리에 대해 전역으로 계산되는 것이 아니라 출력 파일별로 개별적으로 계산됩니다. 각 소스 파일에 대해 재작성기는 출력 파일 디렉터리에서 소스 파일 디렉터리까지의 상대 경로를 계산하고 이를 접두사로 사용합니다.

이는 `flatPreserveRelativeDir: true`를 사용하면 하위 디렉터리의 소스 파일이 올바른 접두사를 자동으로 얻게 됨을 의미합니다. 예를 들어, `docs/guide/quick-start.md`는 `translated-docs/docs/guide/quick-start.<locale>.md`로 출력됩니다. 파일별 접두사는 `../../docs/`이므로, 애셋 `translation-dashboard.png`(소스 트리의 형제)는 `../../docs/translation-dashboard.png`가 됩니다. 이는 `translated-docs/docs/guide/`에서 `docs/translation-dashboard.png`로 올바르게 확인됩니다.

소스 파일과 함께 있는 상대 경로 자산의 경우 `regexAdjustments` 수정이 필요하지 않습니다.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 및 `linkRewriteDocsRoot`

| 옵션                                   | 효과                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 평면 링크 리라이터를 명시적으로 활성화하거나 비활성화함(`docsOutput.style = "flat"`일 때 기본값을 재정의함) |
| `docsOutput.linkRewriteDocsRoot`     | `depthPrefix`가 계산되는 기준 루트(기본값 `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | 출력 경로 레이아웃에 영향을 주며, 리라이터는 알려진 번역 파일의 대상 경로를 계산할 때 이를 사용함       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

내장 재작성기가 처리하지 않는 이미지, 스크린샷 및 기타 자산 URL을 재작성하려면 `docs[].docsOutput.postProcessing` 아래에 정렬된 `{ "description"?, "search", "replace" }` 규칙을 구성하십시오. 일반적으로 로케일 폴더 세그먼트(`screenshots/en-GB/` → `screenshots/de/`)를 교환하거나 절대 정적 경로(`/img/…` → `../assets/…`)를 연결합니다.

규칙은 세그먼트 재조립 및 내장 링크 재작성(플랫 또는 VitePress) 후, 그리고 `addFrontmatter` 전에 번역된 마크다운 **본문**에서 실행됩니다. 플랫 레이아웃에서 깊이 접두사가 적용된 **후** URL에 대해 `search` 패턴을 작성하십시오. 선행 `../`가 아닌 경로 내의 로케일 세그먼트와 일치시키십시오.

**로케일별 스크린샷 폴더(플랫 레이아웃):**

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
    ]
  }
}
```

소스 로케일(`en-GB`)을 하드코딩하는 대신 `[^/]+`를 사용하여 규칙이 `sourceLocale` 변경 후에도 유지되도록 하십시오. 가장 일반적인 자리 표시자는 `${translatedLocale}`입니다. `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}` 및 경로 변수도 사용할 수 있습니다. [문서 — 링크 재작성](/ko/guide/documents/link-rewriting#replace-placeholders)을 참조하십시오.

레이아웃별 예시(플랫, 문서 시스템, Docusaurus, Starlight): [로케일별 폴더](/ko/guide/images-and-screenshots/per-locale-folder). 일반적인 페이지 간 링크 규칙: [문서 — 링크 재작성](/ko/guide/documents/link-rewriting). 필드 참조: [구성 — `docs`](/ko/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

하드코딩된 로케일 정규식, 누락된 스크린샷 디렉터리 및 Docusaurus `/img/` 브리징에 대해서는 [일반적인 실수 및 문제 해결](/ko/guide/images-and-screenshots/troubleshooting)을 참조하십시오.
