<a id="examples"></a>
# 예시

GitHub의 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/)에 있는 실행 가능한 프로젝트 — 각각 고유한 구성, 커밋된 로케일 출력 및 README를 포함합니다. API 키 없이 번역된 파일을 탐색할 수 있습니다. 번역을 다시 실행하려면 공급자 키가 필요합니다([공급자 및 모델](/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## 독립 실행 (`npx degit`)

전체 저장소를 복제하지 않고 예시 하나를 복사합니다. 각 예시는 `"ai-i18n-tools": "^1.7.2"`를 선언하고 npm에서 CLI를 설치합니다.

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

대신 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 저장소 **전체**를 복제한 경우, 저장소 루트에서 `pnpm install` 및 `pnpm run build`를 실행한 다음 `cd examples/<name>`를 실행합니다.

<a id="list-of-examples"></a>
## 예시 목록

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="fumadocs-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| 예시 | 가장 적합한 용도 | degit으로 복사 | 실행 |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | `t()` UI 문자열 + README 번역이 포함된 가장 작은 작동 앱 | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + 복수형 + 대시보드; Docusaurus 문서 + 플랫 README + SVG 자산 | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (앱 `:3030`; 문서용 `cd docs-site && pnpm start` `:3040`) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro 랜딩 페이지: 전체 페이지 HTML + `t()` 하이브리드 | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight 문서 사이트 | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress 문서 사이트 + 테마 JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / 사전 `.ts` 셸 (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI 카탈로그 (`pt`, `zh`, 점 파서) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | LLM 공급자 선택 또는 벤치마크 (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | 마크다운 / CJK 번역 회귀 테스트 (데바나가리, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

각 **예시** 이름은 전체 설정, 명령 및 프로젝트 레이아웃이 포함된 GitHub README로 연결되거나 [저장소의 예시 색인](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md)을 탐색할 수 있습니다.
