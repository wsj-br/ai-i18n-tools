<a id="svg-translation"></a>
# SVG 번역

사람이 읽을 수 있는 레이블이 포함된 **SVG 일러스트레이션 및 다이어그램**용으로 설계되었습니다. `translate-svg` 명령은 소스 `.svg` 파일을 읽고, `<text>`, `<title>` 및 `<desc>` 요소에서 텍스트를 추출하고, 활성 LLM 공급자를 통해 해당 문자열을 번역한 다음, **대상 로케일당 하나의 출력 SVG**를 작성합니다.

이것은 로케일별 **바이너리** SVG 파일을 내보내는 유일한 파이프라인입니다. `translate-docs`는 마크다운 대체 텍스트 및 링크 참조를 번역하지만 SVG 자산을 수정하거나 복사하지 않습니다. 페이지에 번역된 레이블이 있는 다이어그램이 필요한 경우 `features.translateSVG`을 활성화하고 최상위 `svg` 블록을 구성합니다.

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

`translate-svg`는 대상 로캘**마다 모델을 해결합니다**: `localeModels(locale)`이 먼저 구성되면 `translationModels`가 사용됩니다. 각 로캘의 SVG 실행에는 자체 폴백 체인이 있습니다. CJK 로캘에서 다이어그램 레이블이 스크립트에 맞춘 모델이 필요한 경우(예: `ja`) 유용합니다. 자세한 내용은 [공급자 및 모델](/guide/providers-and-models#model-fallback-chain)을 참조하십시오.

SVG 번역은 `translate-docs` 및 `translate-json` (`cacheDir`)과 동일한 SQLite 캐시를 사용합니다. 이미 번역된 텍스트 세그먼트는 캐시에서 제공되며, 새롭거나 변경된 소스 텍스트만 LLM으로 전송됩니다.

<a id="when-to-use-svg-translation"></a>
### SVG 번역을 사용하는 경우

다음과 같은 경우 `translate-svg`을 사용합니다.

- SVG에 로케일별로 변경되어야 하는 가시적인 레이블, 제목 또는 설명이 포함된 경우.
- 웹 앱이 런타임에 로케일별 다이어그램 파일을 로드하는 경우(예: `dashboard.de.svg`).
- 문서 시스템 사이트(Docusaurus, Astro Starlight, VitePress)가 번역된 마크다운 옆에 번역된 SVG를 함께 배치하는 경우.

다음과 같은 경우 `translate-svg`을 **사용하지 마십시오**.

- 번역 가능한 텍스트가 없는 장식용 SVG(아이콘, 로고, 배경).
- 래스터 스크린샷(PNG, JPEG, WebP) — 이들은 [이미지 및 스크린샷](/guide/images-and-screenshots/)을 통해 처리됩니다.
- `<text>` 요소 대신 경로 데이터에 포함된 텍스트 — 추출기가 경로 윤곽선을 읽을 수 없습니다.

<a id="design-for-i18n-from-the-start"></a>
### 처음부터 i18n을 위한 설계

SVG는 레이블이 처음부터 실제 텍스트 요소일 때 가장 쉽게 번역할 수 있습니다.

- 사람이 읽을 수 있는 텍스트를 `<text>`, `<title>` 및 `<desc>`에 넣습니다.
- 디자인 도구에서 레이블을 경로로 변환하지 마십시오. 경로 데이터는 번역기에게 불투명합니다.
- **소스 SVG**를 `svg.outputDir`와 별도의 전용 디렉터리에 보관하십시오. 소스와 생성된 로케일 파일을 혼합하면 어떤 파일을 안전하게 편집하거나 재생성할 수 있는지 알 수 없습니다.

웹 앱의 경우 디자인에서 모두 소문자 레이블을 사용하는 경우 `forceLowercase: true`을 활성화하십시오. 파일 시스템 및 CDN 간의 대소문자 구분 불일치를 방지합니다.

<a id="output-layouts"></a>
### 출력 레이아웃

`translate-svg`은 두 가지 일반적인 출력 형태를 지원합니다. 앱 또는 문서 사이트가 런타임에 SVG 파일을 참조하는 방식에 따라 선택하십시오.

| 레이아웃 | `svg.style` | 가장 적합한 경우 | 하위 가이드 |
|--------|-------------|----------|-------------|
| **플랫 (웹 앱)** | `"flat"` | Next.js, Vite 및 로케일 코딩된 파일 이름으로 SVG를 포함하는 기타 앱 | [웹 앱 (플랫 SVG)](/guide/svg-translation/translated-svg-web-app) |
| **코로케이션 (문서 시스템)** | `"nested"` + `pathTemplate` | Docusaurus 및 번역된 자산이 번역된 페이지 옆에 있는 기타 문서 시스템 사이트 | [코로케이션 SVG](/guide/svg-translation/translated-svg-colocated) |

**플랫 레이아웃**은 `public/assets/diagram.de.svg`와 같은 파일을 `diagram.en-GB.svg` 옆에 작성합니다. 앱은 로케일 접미사를 사용하여 참조합니다.

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

**코로케이션 레이아웃**은 각 로케일의 SVG를 해당 로케일의 콘텐츠 트리(예: `i18n/de/.../assets/diagram.svg`)에 작성합니다. 소스 및 번역된 마크다운은 동일한 상대 경로(`../assets/diagram.svg`)를 사용합니다. `regexAdjustments` 규칙은 필요하지 않습니다.

SVG 레이아웃이 래스터 스크린샷 전략과 어떻게 조화를 이루는지에 대한 자세한 내용은 [이미지 및 스크린샷 결정 가이드](/guide/images-and-screenshots/#decision-guide)를 참조하십시오.

<a id="step-1-enable-and-configure"></a>
### 1단계: 활성화 및 구성

기능을 활성화하고 `translate-svg`이 소스 파일 및 출력 루트를 가리키도록 합니다.

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

주요 `svg` 필드:

- `sourcePath` — 하나 이상의 디렉터리 또는 전역 패턴(예: `"images/*.svg"`, `"**/icons/*.svg"`). 프로젝트 루트에서 재귀적으로 스캔됩니다.
- `outputDir` — 번역된 SVG 출력의 루트 디렉터리입니다.
- `style` — 사용자 지정 `pathTemplate`을 사용하지 않는 경우 `"flat"` 또는 `"nested"`입니다.
- `pathTemplate` — 자리 표시자 `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}` 등이 있는 선택적 사용자 지정 출력 경로(공동 배치된 문서 시스템 레이아웃에 필요).
- `forceLowercase` — 재조립 시 소문자로 번역된 텍스트입니다.

전체 필드 참조: [구성 — `svg`](/reference/configuration#svg).

<a id="step-2-translate"></a>
### 2단계: 번역

```bash
npx ai-i18n-tools translate-svg
```

단일 로케일 번역:

```bash
npx ai-i18n-tools translate-svg --locale de
```

파일을 작성하지 않고 미리 보기:

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync`는 `features.translateSVG`과 `svg`가 모두 설정된 경우 SVG 단계를 자동으로 실행합니다(`--no-svg`로 건너뛸 수 있음). 공유 플래그에는 `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency`, `--force` / `--force-update`이 포함됩니다.

<a id="troubleshooting"></a>
### 문제 해결

일반적인 SVG 문제(혼합 소스/출력 디렉터리, Docusaurus의 절대 정적 URL, 경로 레이아웃 오류)는 [SVG 문제 해결](/guide/svg-translation/troubleshooting)에 설명되어 있습니다. 래스터 자산 및 링크 다시 쓰기에 대해서는 [이미지 및 스크린샷 문제 해결](/guide/images-and-screenshots/troubleshooting)을 참조하십시오.
