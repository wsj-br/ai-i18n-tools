<a id="installation"></a>
# Installation

Das veröffentlichte Paket ist **ausschließlich ESM**. Verwenden Sie `import`/`import()` in Node.js oder Ihrem Bundler; verwenden Sie nicht `require('ai-i18n-tools')`. Das Paket deklariert `engines.node` `>=22.16.0`; ältere Node.js-Versionen werden nicht unterstützt. Die npm-Tarball-Datei enthält nur englische Dateien unter `docs/`; sprachspezifische Kopien unter `translated-docs/` befinden sich im [GitHub-Repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools enthält einen eigenen Zeichenketten-Extraktor. Wenn Sie zuvor `i18next-scanner`, `babel-plugin-i18next-extract` oder Ähnliches verwendet haben, können Sie diese Dev-Abhängigkeiten nach der Migration entfernen.

<a id="using-the-cli"></a>
### Verwendung der CLI

Installieren Sie `ai-i18n-tools` als Abhängigkeit oder devDependency in Ihrem Projekt (siehe [Installation](#installation) oben). Das Paket deklariert einen `bin`-Eintrag, den Ihr Paketmanager mit `node_modules/.bin/ai-i18n-tools` verknüpft. Dieser Shim (`bin/ai-i18n-tools.mjs` innerhalb des installierten Pakets) lädt die kompilierte CLI.

**`package.json`-Skripte (empfohlen)** – Wenn npm oder pnpm ein Skript ausführt, wird `node_modules/.bin` an `PATH` angehängt, sodass Befehle wie `pnpm run i18n:sync` `ai-i18n-tools` ohne `npx`- oder `pnpm exec`-Präfix aufrufen:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**Interaktive Shell** – von Ihrem Projektstammverzeichnis aus, nach einer lokalen Installation:

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**Bloßes** `ai-i18n-tools` **im Terminal** – um den Befehlsnamen direkt in einer interaktiven Shell einzugeben, stellen Sie das lokale Bin-Verzeichnis vor `PATH`:

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

Fügen Sie mit [**direnv**](https://direnv.net/) `PATH_add node_modules/.bin` zu einer `.envrc` im Projektstammverzeichnis hinzu, damit der bloße Befehl nach dem `cd` in das Projekt verfügbar ist. Ohne Anpassung von `PATH` verwenden Sie weiterhin `npx ai-i18n-tools …` oder `pnpm exec ai-i18n-tools …`.

**Null-Installations-Einzelbefehl** — `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>` (lädt das Paket für diesen Aufruf herunter; kein Eintrag in `package.json`).

Unter Linux, macOS und WSL setzen Registry-Installationen automatisch das Ausführbar-Bit für das CLI-Skript. Unter Windows erzeugen Paketmanager `.cmd`- und `.ps1`-Shims, die Node explizit aufrufen.

Legen Sie Ihren Provider-API-Schlüssel fest (OpenRouter wird angezeigt; verwenden Sie die Umgebungsvariable, die Ihrem aktiven Provider entspricht – siehe die [Voreinstellungstabelle](/guide/providers-and-models#built-in-providers)):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Oder erstellen Sie eine `.env`-Datei im Projektstammverzeichnis:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Tool-UI-Sprache

Die CLI lokalisiert ihre eigene Hilfetexte, Protokollzusammenfassungen und das Übersetzungs-Dashboard unabhängig von den von Ihnen übersetzten Gebietsschemas. Standardmäßig folgt sie dem Gebietsschema Ihres Betriebssystems. Überschreiben Sie dies mit `-L pt-BR`, `export AI_I18N_LANG=es` oder `"uiLanguage"` in der Konfiguration. Siehe [Tool-UI-Sprache](/reference/environment-variables#tool-ui-language).
