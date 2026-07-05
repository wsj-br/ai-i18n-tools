<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# 플랫 링크 재작성기와 2단계 흐름

`docsOutput.style = "flat"`의 경우(또는 `rewriteRelativeLinks: false`이 설정되지 않았거나 사용자 정의 `pathTemplate`가 지정되지 않은 경우), `postProcessing` 이전에 기본 제공되는 리라이터가 실행됩니다. 이 리라이터는 문서 간 링크(로케일 접미사 추가)를 처리하고 마크다운이 아닌 자산 URL에 깊이 접두사를 추가합니다.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"`일 때의 두 단계 흐름

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

`outputDir: "translated-docs/"`이고 소스 `README.md`이 리포지토리 루트에 있는 예시:

1. 평면 링크 재작성기: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/`에 대한 `../` 하나)
2. `postProcessing` 정규식 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"`의 경우(`"docusaurus"`, `"astro-starlight"`, `"nested"` 포함), 평면 링크 리라이터는 실행되지 않습니다. `postProcessing`는 번역된 마크다운에서 원본 URL(일반적으로 `/img/screenshots/en-GB/foo.png` 같은 절대 경로)을 그대로 인식합니다.

<a id="vitepress-link-normalizer"></a>
### VitePress 링크 정규화 도구 (`style: "vitepress"`)

`docsOutput.rewriteVitepressLinks`가 `true`일 때(기본값은 `style`가 `"vitepress"`일 때), 세그먼트 재조립 후에 별도의 정규화 도구가 실행됩니다(플랫 재작성기 대신). 이는 영어가 콘텐츠 루트에 있고 로케일이 형제 폴더(예: `docs/de/guide/…`)에 있는 VitePress/문서 시스템 사이트를 대상으로 합니다.

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

일반적인 재작성:

| 소스 패턴 | 정규화된 대상 |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (로케일 파일에서) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 변경 없음(리포지토리 경로에는 전체 URL 사용) |

`README.md` → `docs/index.md`을 동기화하는 프로젝트의 경우, `README.md`에 `LICENSE`, `examples/` 및 VitePress 트리 외부의 다른 파일에 대한 전체 GitHub URL을 사용하세요. [VitePress 통합 — README를 문서 홈페이지로 사용](/guide/vitepress-integration#readme-as-homepage)을 참조하세요.

플랫 재작성 도구와 VitePress 정규화 도구는 `docs[]` 블록당 상호 배타적입니다. 즉, `postProcessing` 전에 하나만 실행됩니다. [VitePress 통합 — 링크 규칙](/guide/vitepress-integration#link-conventions)을 참조하십시오.

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir`과 함께 사용하는 파일별 깊이 접두사

깊이 접두사는 전체 일괄 처리에 대해 전역으로 계산되는 것이 아니라 출력 파일별로 개별적으로 계산됩니다. 각 소스 파일에 대해 재작성기는 출력 파일 디렉터리에서 소스 파일 디렉터리까지의 상대 경로를 계산하고 이를 접두사로 사용합니다.

이는 `flatPreserveRelativeDir: true`를 사용하면 하위 디렉터리의 소스 파일이 올바른 접두사를 자동으로 얻게 됨을 의미합니다. 예를 들어, `docs/guide/quick-start.md`는 `translated-docs/docs/guide/quick-start.<locale>.md`로 출력됩니다. 파일별 접두사는 `../../docs/`이므로, 애셋 `translation-dashboard.png`(소스 트리의 형제)는 `../../docs/translation-dashboard.png`가 됩니다. 이는 `translated-docs/docs/guide/`에서 `docs/translation-dashboard.png`로 올바르게 확인됩니다.

소스 파일과 함께 있는 상대 경로 자산의 경우 `postProcessing` 정규식 수정이 필요 없습니다.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 및 `linkRewriteDocsRoot`

| 옵션                                   | 효과                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 평면 링크 리라이터를 명시적으로 활성화하거나 비활성화함(`docsOutput.style = "flat"`일 때 기본값을 재정의함) |
| `docsOutput.linkRewriteDocsRoot`     | `depthPrefix`가 계산되는 기준 루트(기본값 `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | 출력 경로 레이아웃에 영향을 주며, 리라이터는 알려진 번역 파일의 대상 경로를 계산할 때 이를 사용함       |

---

<a id="common-mistakes-and-troubleshooting"></a>
