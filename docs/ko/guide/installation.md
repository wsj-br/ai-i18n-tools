<a id="installation"></a>
# 설치

게시된 패키지는 **ESM 전용**입니다. Node.js 또는 번들러에서는 `import`/`import()`을 사용하고, `require('ai-i18n-tools')`는 사용하지 마십시오. 이 패키지는 `engines.node` `>=22.16.0`를 선언합니다. 이전 버전의 Node.js는 지원되지 않습니다. npm tarball에는 `docs/` 아래에 있는 영문 파일만 포함되어 있으며, `translated-docs/` 아래의 지역화된 사본은 [GitHub 저장소](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)에 있습니다.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools는 자체 문자열 추출기를 포함합니다. 기존에 `i18next-scanner`, `babel-plugin-i18next-extract` 또는 유사한 도구를 사용했다면, 마이그레이션 후 해당 개발 의존성을 제거할 수 있습니다.

<a id="using-the-cli"></a>
### CLI 사용하기

프로젝트에 `ai-i18n-tools`를 종속성 또는 개발 종속성으로 설치합니다(위 [설치](#installation) 참조). 이 패키지는 패키지 관리자가 `node_modules/.bin/ai-i18n-tools`에 연결하는 `bin` 항목을 선언합니다. 이 shim(설치된 패키지 내의 `bin/ai-i18n-tools.mjs`)은 컴파일된 CLI를 로드합니다.

인터랙티브 셸에서 bare `ai-i18n-tools` 명령을 입력하려면 아래 옵션 중 하나를 구성하세요. 설정하지 않으면 로컬 설치 후에도 셸에서 바이너리를 찾을 수 없습니다.

**direnv** — 프로젝트 루트의 `.envrc`에 추가합니다(bash/zsh; [direnv.net](https://direnv.net/) 참조).

```bash
PATH_add node_modules/.bin
```

`direnv allow` 후에는 프로젝트에 `cd`할 때마다 bare 명령을 사용할 수 있습니다.

**수동 PATH** — `node_modules/.bin`가 포함된 디렉터리인 **프로젝트 루트**에서 이 명령들을 실행하세요. 해당 `PATH` 항목을 그대로 두는 한 이후에 하위 디렉터리에서도 계속 작동합니다. 중첩된 폴더에서 export를 다시 실행하면 `$PWD`가 더 이상 프로젝트 루트를 가리키지 않아 실패합니다.

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**전역 설치** — CLI를 한 번 설치하고 모든 디렉터리에서 호출합니다.

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

pnpm을 사용할 때 전역 명령이 누락된 경우 머신당 한 번씩 `pnpm setup`을(를) 실행하고 새 셸을 여세요. pnpm은 자신의 전역 bin 디렉터리가 `PATH`에 있어야 하기 때문입니다. 전역 설치는 전역으로 고정된 버전을 사용합니다. 프로젝트별 버전 고정을 위해서는 direnv 또는 수동 PATH를 사용하여 `node_modules/.bin`가 프로젝트의 의존성을 가리키도록 하는 것을 권장합니다.

**`package.json` 스크립트** — npm 또는 pnpm이 스크립트를 실행할 때 `node_modules/.bin`을(를) `PATH` 앞에 추가하므로, 셸 PATH를 변경하지 않고도 스크립트 내에서 명령어 이름만으로 실행할 수 있습니다. translate 단계를 수동으로 연결하는 것보다 `sync`을(를) 사용하는 것을 권장합니다 — 수동으로 실행하면 순서와 기능 플래그를 잘못 지정하기 쉽습니다:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

그런 다음 예를 들어 `pnpm run i18n:sync`을(를) 실행합니다. 권장되는 전체 세트는 [권장 `package.json` 스크립트](/ko/guide/quick-start#recommended-packagejson-scripts)를 참조하세요.

**대안** — `PATH`을(를) 조정하지 않으려면 `npx ai-i18n-tools …`(npm) 또는 `pnpm exec ai-i18n-tools …`(pnpm)을(를) 사용하세요. `package.json` 항목이 없는 제로 설치 일회성 실행의 경우 `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>`을(를) 사용하세요.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### 복제된 ai-i18n-tools 모노레포

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)의 전체 복제본에서 패키지를 개발하거나 워크스페이스 **예제**를 실행할 때:

- **워크스페이스 예제** (`examples/console-app`, `examples/nextjs-app`, 및 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)에 나열된 다른 패키지) — 저장소 루트에서 `pnpm install`를 실행한 다음 `cd examples/<name>`를 실행합니다. 예제의 `pnpm run i18n:*` 스크립트를 사용하거나 PATH를 구성하고([CLI 사용](#using-the-cli) 참조) 단순히 `ai-i18n-tools …`를 실행합니다. 워크스페이스 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)는 `ai-i18n-tools`를 로컬 체크아웃에 연결합니다.
- **저장소 루트** — pnpm은 루트 패키지 자체의 `bin`를 `node_modules/.bin`에 연결하지 않습니다. 대신 `node bin/ai-i18n-tools.mjs …` 또는 루트 `pnpm i18n:*` 스크립트를 사용하세요 (또는 셸 별칭 / `pnpm add -g .` — [개발 가이드](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) 참조).
- **독립형 픽스처** (`multi-provider`, `test-markdown`) — 픽스처 폴더에서 `node ../../bin/ai-i18n-tools.mjs …`를 사용하세요.

CLI 소스를 변경한 후 저장소 루트에서 `pnpm run build`을(를) 실행하세요. 빌드 단계 및 선택적 전역 설치 해결 방법은 [개발 가이드](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)를 참조하세요.

Linux, macOS 및 WSL에서는 레지스트리 설치 시 CLI 스크립트의 실행 권한 비트가 자동으로 설정됩니다. Windows에서는 패키지 관리자가 Node.js를 명시적으로 호출하는 `.cmd` 및 `.ps1` 쉼(Shim)을 생성합니다.

번역 명령(`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`)은 `ai-i18n-tools.config.json`에 **제공자 구성**이 필요하며, 활성 제공자에 대해 **API 키**가 필요합니다. 기본 제공자 블록을 스캐폴드하려면 `ai-i18n-tools init [-P <provider>]`를 실행하세요 (생략 시 `openrouter`); 프리셋 또는 모델을 전환하려면 `provider` / `providers`를 편집하세요 — [LLM 제공자 및 모델](/ko/guide/providers-and-models)을 참조하세요. Ollama는 API 키가 필요 없는 유일한 기본 제공 프리셋입니다.

활성 제공자와 일치하는 API 키를 설정하세요 ([프리셋 테이블](/ko/guide/providers-and-models#built-in-providers) 참조):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

또는 프로젝트 루트에 `.env` 파일을 생성하세요:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 도구 UI 언어

CLI는 번역하는 로케일과 무관하게 자체 도움말 텍스트, 로그 요약 및 번역 대시보드를 현지화합니다. 기본적으로 OS 로케일을 따릅니다. config에서 `-L pt-BR`, `export AI_I18N_LANG=es` 또는 `"uiLanguage"`로 재정의할 수 있습니다. [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하세요.
