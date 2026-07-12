<a id="installation"></a>
# Installation

Prakaashit package **ESM-only** hai. Node.js ya apne bundler mein `import`/`import()` ka upyog karein; `require('ai-i18n-tools')` ka upyog na karein. Package `engines.node` `>=22.16.0` ghoshit karta hai; purane Node.js sanskaran asamarthit hain. npm tarball mein `docs/` ke tahat keval Angrezi files shaamil hain; `translated-docs/` ke tahat sthaaneeya-vishisht pratilipiyaan [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) mein hain.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools mein apna string extractor shaamil hai. Yadi aapne pehle `i18next-scanner`, `babel-plugin-i18next-extract`, ya iske samaan ka upyog kiya hai, to aap migration ke baad un dev dependencies ko hata sakte hain.

<a id="using-the-cli"></a>
### CLI ka upyog karna

Apne project mein `ai-i18n-tools` ko ek dependency ya devDependency ke roop mein install karein (upar [Installation](#installation) dekhein). Package ek `bin` entry declare karta hai jise aapka package manager `node_modules/.bin/ai-i18n-tools` se link karta hai. Vah shim (installed package ke andar `bin/ai-i18n-tools.mjs`) compiled CLI ko load karta hai.

Ek interactive shell mein nange `ai-i18n-tools` command ko type karne ke liye, neeche diye gaye vikalpon mein se kisi ek ko configure karein. Setup ke bina, shell binary ko dhoondh nahi payega, bhale hi local install ke baad bhi.

**direnv** — project root mein ek `.envrc` mein jodein (bash/zsh; [direnv.net](https://direnv.net/) dekhein):

```bash
PATH_add node_modules/.bin
```

`direnv allow` ke baad, nanga command tab uplabdh hota hai jab bhi aap project mein `cd` karte hain.

**Manual PATH** — ek interactive shell mein project root se:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Global install** — CLI ko ek baar install karein aur ise kisi bhi directory se invoke karein:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Ek global install globally pinned version ka upyog karta hai. Per-project version pinning ke liye, direnv ya manual PATH ko prefer karein taaki `node_modules/.bin` project ki dependency ko resolve kare.

**`package.json` scripts** — jab npm ya pnpm ek script chalata hai, to yah `node_modules/.bin` ko `PATH` mein prepends karta hai, isliye nanga command naam scripts ke andar shell PATH badlav ke bina kaam karta hai:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

Phir udahaaran ke liye `pnpm run i18n:sync` chalaayein.

**Vikalp** — agar aap `PATH` ko adjust karna pasand nahi karte hain: `npx ai-i18n-tools …` (npm) ya `pnpm exec ai-i18n-tools …` (pnpm). Bina kisi `package.json` entry ke zero-install one-off ke liye: `npx ai-i18n-tools <cmd>` ya `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Cloned ai-i18n-tools monorepo

Jab aap [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) ke poore clone se package develop kar rahe hon ya workspace **examples** chala rahe hon:

- **Workspace ke udaaharan** (`examples/console-app`, `examples/nextjs-app`, aur [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) mein soochi-baddh anya package) — repository root par `pnpm install` chalaayein, phir `cd examples/<name>`. Udaaharan ke `pnpm run i18n:*` scripts ka upyog karein, ya PATH ko configure karein ([CLI ka upyog karna](#using-the-cli) dekhein) aur keval `ai-i18n-tools …` chalaayein. Workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) aapke local checkout se `ai-i18n-tools` link karta hai.
- **Repository root** — pnpm root package ke apne `bin` ko `node_modules/.bin` mein link nahin karta hai. Iske bajaay `node bin/ai-i18n-tools.mjs …` ya root `pnpm i18n:*` scripts ka upyog karein (ya ek shell alias / `pnpm add -g .` — [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) dekhein).
- **Standalone fixtures** (`multi-provider`, `test-markdown`) — fixture folder se, `node ../../bin/ai-i18n-tools.mjs …` ka upyog karein.

CLI source badalne ke baad repository root par `pnpm run build` chalaen. Build steps aur optional global-install workarounds ke liye [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) dekhen.

Linux, macOS, aur WSL par, registry installs CLI script par executable bit ko swatah set karte hain. Windows par, package managers `.cmd` aur `.ps1` shims generate karte hain jo Node ko spasht roop se invoke karte hain.

Anuvaad commands (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) ke liye `ai-i18n-tools.config.json` mein **provider configuration** aur active provider ke liye **ek API key** ki aavashyakta hoti hai. Ek default provider block (chhodne par `openrouter`) ko scaffold karne ke liye `ai-i18n-tools init [-P <provider>]` chalaayein; presets ya models badalne ke liye `provider` / `providers` ko edit karein — [LLM providers aur models](/hi-Latn/guide/providers-and-models) dekhein. Ollama ekmatra built-in preset hai jise kisi API key ki aavashyakta nahin hoti hai.

API key set karein jo aapke active provider se mel khaati ho ([preset table](/hi-Latn/guide/providers-and-models#built-in-providers) dekhein):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Ya project root mein ek `.env` file banayein:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Tool UI bhasha

CLI apne help text, log summaries, aur Translation Dashboard ko aapke dwara translate kiye gaye locales se svatantra roop se localize karta hai. Default roop se yah aapke OS locale ka palan karta hai. Ise config mein `-L pt-BR`, `export AI_I18N_LANG=es`, ya `"uiLanguage"` ke saath override karein. [Tool UI bhasha](/hi-Latn/guide/tool-ui-language) dekhein.
