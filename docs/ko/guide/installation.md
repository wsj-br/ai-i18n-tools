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

**`package.json` 스크립트(권장)** — npm 또는 pnpm이 스크립트를 실행할 때 `PATH` 앞에 `node_modules/.bin`를 추가하므로, `pnpm run i18n:sync`와 같은 명령은 `npx` 또는 `pnpm exec` 접두사 없이 `ai-i18n-tools`를 호출합니다.

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**대화형 셸** — 로컬 설치 후 프로젝트 루트에서:

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**터미널에서** `ai-i18n-tools` **그대로** — 대화형 셸에서 명령 이름을 직접 입력하려면 로컬 bin 디렉터리를 `PATH` 앞에 추가합니다.

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/)를 사용하여 `PATH_add node_modules/.bin`를 프로젝트 루트의 `.envrc`에 추가하면 프로젝트로 `cd`한 후 기본 명령을 사용할 수 있습니다. `PATH`를 조정하지 않고 `npx ai-i18n-tools …` 또는 `pnpm exec ai-i18n-tools …`를 계속 사용합니다.

**설치 없이 일회성 실행** — `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>` 사용 (해당 실행 시에만 패키지를 다운로드; `package.json`에 항목 추가 없음).

Linux, macOS 및 WSL에서는 레지스트리 설치 시 CLI 스크립트의 실행 권한 비트가 자동으로 설정됩니다. Windows에서는 패키지 관리자가 Node.js를 명시적으로 호출하는 `.cmd` 및 `.ps1` 쉼(Shim)을 생성합니다.

공급자 API 키를 설정합니다(OpenRouter가 표시됨. 활성 공급자와 일치하는 환경 변수를 사용하세요. [사전 설정 테이블](/guide/providers-and-models#built-in-providers) 참조).

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

또는 프로젝트 루트에 `.env` 파일을 생성하세요:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 도구 UI 언어

CLI는 번역하는 로케일과 별개로 자체 도움말 텍스트, 로그 요약 및 번역 대시보드를 현지화합니다. 기본적으로 OS 로케일을 따릅니다. 구성에서 `-L pt-BR`, `export AI_I18N_LANG=es` 또는 `"uiLanguage"`로 재정의할 수 있습니다. [도구 UI 언어](/reference/environment-variables#tool-ui-language)를 참조하세요.
