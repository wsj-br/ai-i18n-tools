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

**`package.json` scripts (sifarish ki jaati hai)** — jab npm ya pnpm koi script chalata hai, to yah `PATH` se pahle `node_modules/.bin` jod deta hai, isliye `pnpm run i18n:sync` jaise commands `npx` ya `pnpm exec` prefix ke bina `ai-i18n-tools` ko invoke karte hain:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**Interactive shell** — apne project root se, local install ke baad:

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**Bare** `ai-i18n-tools` **terminal mein** — interactive shell mein command ka naam seedhe type karne ke liye, local bin directory ko `PATH` se pahle jod dein:

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

[**direnv**](https://direnv.net/) ke saath, project root mein ek `.envrc` mein `PATH_add node_modules/.bin` jodein taaki project mein `cd` ke baad bare command uplabdh ho. `PATH` ko adjust kiye bina, `npx ai-i18n-tools …` ya `pnpm exec ai-i18n-tools …` ka upyog karte rahein.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` ya `pnpm dlx ai-i18n-tools <cmd>` (us invocation ke liye package download karta hai; `package.json` mein koi entry nahi).

Linux, macOS, aur WSL par, registry installs CLI script par executable bit ko swatah set karte hain. Windows par, package managers `.cmd` aur `.ps1` shims generate karte hain jo Node ko spasht roop se invoke karte hain.

Apna provider API key set karein (OpenRouter dikhaya gaya hai; uss env var ka upyog karein jo aapke active provider se mel khata hai — [preset table](/guide/providers-and-models#built-in-providers) dekhein):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ya project root mein ek `.env` file banayein:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Tool UI bhasha

CLI apni madad text, log summaries, aur Translation Dashboard ko aapke dwara anuvad kiye gaye locales se svatantra roop se sthanikrit karta hai. By default yeh aapke OS locale ka palan karta hai. Ise config mein `-L pt-BR`, `export AI_I18N_LANG=es`, ya `"uiLanguage"` se override karein. [Tool UI bhasha](/reference/environment-variables#tool-ui-language) dekhein.
