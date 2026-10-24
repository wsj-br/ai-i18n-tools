<a id="examples"></a>
# 예시

GitHub의 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/)에 있는 실행 가능한 프로젝트 — 각각 고유한 구성, 커밋된 로케일 출력 및 README를 포함합니다. API 키 없이 번역된 파일을 탐색할 수 있습니다. 번역을 다시 실행하려면 공급자 키가 필요합니다([공급자 및 모델](/ko/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## 독립 실행 (`npx degit`)

전체 저장소를 복제하지 않고 예제 하나만 복사합니다.

<a id="node-examples"></a>
### Node.js 예제

각 Node.js 예제는 현재 패키지 버전과 일치하는 `ai-i18n-tools`의 게시된 캐럿 범위를 선언하고 npm에서 CLI를 설치합니다:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Python 예제

`python-streamlit`, `python-flask`, `python-fastapi` 및 `python-gettext`에는 `package.json`가 없습니다. 아래 표의 `degit` 명령은 유효합니다. [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases)에서 `ai-i18n-tools-python-examples.zip`을 다운로드할 수도 있습니다. 해당 zip 파일은 동일한 4개의 디렉터리로 구성됩니다. 이는 npm 패키지의 일부가 아니며 독립 실행형 실행 파일 내부에도 포함되어 있지 않습니다.

`python-streamlit`, `python-flask` 및 `python-fastapi`는 virtualenv와 `pip install -r requirements.txt`을 사용합니다. `python-gettext`는 표준 라이브러리만 사용합니다. [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables)을 사용하여 번역하십시오.

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windows에서는 `.venv\Scripts\activate`을 활성화하십시오.

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 저장소 **전체**를 복제한 경우, 저장소 루트에서 `pnpm install` 및 `pnpm run build`을 실행한 다음 `cd examples/<name>`를 실행하십시오. 작업 영역(Node.js) 예제는 `pnpm run i18n:*` 스크립트를 통해 로컬 CLI를 사용하거나 [PATH 설정](/ko/guide/installation#using-the-cli) 후 일반 `ai-i18n-tools …`를 사용합니다. 해당 체크아웃의 Python 예제는 빌드 후 `node ../../bin/ai-i18n-tools.mjs`를 사용하여 번역합니다. [설치 — 복제된 모노레포](/ko/guide/installation#cloned-monorepo)를 참조하십시오.

<a id="list-of-examples"></a>
## 예시 목록

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

| 예시 | 가장 적합한 용도 | degit으로 복사 | 실행 |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | `t()` UI 문자열 + README 번역이 포함된 가장 작은 작동 앱 | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + 복수형 + 대시보드; 중첩 Docusaurus 문서 + 평면 README + SVG 에셋 | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (앱 `:3030`; 문서용 `cd docs-site && pnpm start` `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Docusaurus 문서 사이트 전용 (`docusaurus` 프리셋) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; 빌드 + 서브, 로케일 메뉴 작동) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro 랜딩 페이지: 전체 페이지 HTML + `t()` 하이브리드 | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight 문서 사이트 | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress 문서 사이트 + 테마 JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / 사전 `.ts` 셸 (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI 카탈로그 (`pt`, `zh`, 점 파서) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | 순수 HTML + `data-i18n*` 마커; 정적 로케일 JSON (대시보드 스타일 UI) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | 일반 HTML 문서: 로케일당 단일 페이지, 지역화된 이미지, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | LLM 공급자 선택 또는 벤치마크 (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | 마크다운 / CJK 번역 회귀 테스트 (데바나가리, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, 재설정 + AI 에이전트 보고서) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Streamlit 대시보드, `t()` / `_()`, 영어 키 JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, 영어 키 JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, ContextVar 로케일, `t()` / `_()`, 영어 키 JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | 기존 GNU gettext CLI; `extract` / `translate-ui` 새로 고침 `.po` 및 `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

각 **예시** 이름은 전체 설정, 명령 및 프로젝트 레이아웃이 포함된 GitHub README로 연결되거나 [저장소의 예시 색인](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md)을 탐색할 수 있습니다.

Node.js 예제는 `pnpm install` 후 npm에서 CLI를 설치합니다. 4개의 Python 예제는 `venv` 및 `pip`(`python-gettext`은 표준 라이브러리만 사용)와 번역을 위한 [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables)을 사용합니다.

<br/>

::: tip 면책 조항
제품명 및 아이콘은 각 소유자에게 귀속되며 식별 목적으로만 사용됩니다. 이 소프트웨어는 해당 브랜드와 제휴 관계가 없으며, 해당 브랜드의 공식적인 보증을 받지 않습니다.
:::
