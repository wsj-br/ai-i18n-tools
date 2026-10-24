<a id="examples"></a>
# Beispiele

Ausführbare Projekte unter [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) auf GitHub – jedes mit eigener Konfiguration, festgeschriebenen Gebietsschema-Ausgaben und README. Sie können übersetzte Dateien ohne API-Schlüssel erkunden; für eine erneute Übersetzung ist ein Anbieterschlüssel erforderlich ([Anbieter und Modelle](/de/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Eigenständig ausführen (`npx degit`)

Kopieren Sie ein einzelnes Beispiel, ohne das vollständige Repository zu klonen.

<a id="node-examples"></a>
### Node.js-Beispiele

Jedes Node.js-Beispiel deklariert einen veröffentlichten Caret-Bereich von `ai-i18n-tools`, der der aktuellen Paketversion entspricht, und installiert die CLI über npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Python-Beispiele

`python-streamlit`, `python-flask`, `python-fastapi` und `python-gettext` haben kein `package.json`. Die `degit`-Befehle in der Tabelle unten sind gültig. Sie können auch `ai-i18n-tools-python-examples.zip` von den [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases) herunterladen. Diese Zip-Datei enthält dieselben vier Verzeichnisse. Sie ist nicht Teil des npm-Pakets und nicht in der eigenständigen ausführbaren Datei enthalten.

`python-streamlit`, `python-flask` und `python-fastapi` verwenden ein virtualenv und `pip install -r requirements.txt`. `python-gettext` verwendet nur die Standardbibliothek. Übersetzen Sie mit der [eigenständigen ausführbaren Datei](/de/guide/installation#standalone-executables).

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Aktivieren Sie unter Windows `.venv\Scripts\activate`.

Wenn Sie stattdessen das **gesamte** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)-Repository geklont haben, führen Sie `pnpm install` und `pnpm run build` im Repository-Stammverzeichnis aus, dann `cd examples/<name>`. Workspace (Node.js)-Beispiele verwenden die lokale CLI über ihre `pnpm run i18n:*`-Skripte oder direkt `ai-i18n-tools …` nach der [PATH-Einrichtung](/de/guide/installation#using-the-cli). Python-Beispiele in diesem Checkout übersetzen mit `node ../../bin/ai-i18n-tools.mjs` nach dem Build. Siehe [Installation — Geklontes Monorepo](/de/guide/installation#cloned-monorepo).

<a id="list-of-examples"></a>
## Liste der Beispiele

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

| Beispiel | Am besten geeignet für | Kopieren mit degit | Ausführen |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | Kleinste funktionierende App mit `t()` UI-Strings + README-Übersetzung | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + Pluralformen + Dashboard; verschachtelte Docusaurus-Dokumente + flache README + SVG-Assets | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (App `:3030`; `cd docs-site && pnpm start` für Dokumente `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Nur Docusaurus-Dokumentationsseite (`docusaurus`-Preset) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; Build + Serve, Lokalisierungsmenü funktioniert) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro Landingpage: Vollbild-HTML + `t()` Hybrid | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight Dokumentationsseite | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress Docs-Site + Theme JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / Wörterbuch `.ts` Shell (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI-Katalog (`pt`, `zh`, Dot-Parser) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | Reines HTML + `data-i18n*`-Marker; statisches lokales JSON (UI im Dashboard-Stil) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | Plain HTML als Dokumente: eine Seite pro Locale, lokalisierte Bilder, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | LLM-Anbieter auswählen oder benchmarken (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Regressionstest Markdown / CJK-Übersetzung (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, Reset + KI-Agent-Bericht) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Streamlit-Dashboard, `t()` / `_()`, JSON mit englischen Schlüsseln | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, JSON mit englischen Schlüsseln | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, ContextVar-Locale, `t()` / `_()`, JSON mit englischen Schlüsseln | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | Bestehende GNU gettext CLI; `extract` / `translate-ui` aktualisiert `.po` und `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

Jeder **Beispiel**-Name verlinkt zu seinem GitHub-README mit vollständiger Einrichtung, Befehlen und Projektlayout – oder durchsuchen Sie den [Beispielindex im Repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).

Node.js-Beispiele installieren die CLI nach `pnpm install` über npm. Die vier Python-Beispiele verwenden `venv` und `pip` (`python-gettext` verwendet nur die Standardbibliothek) sowie die [eigenständige ausführbare Datei](/de/guide/installation#standalone-executables) für die Übersetzung.

<br/>

::: tip Haftungsausschluss
Produktnamen und Icons sind Eigentum ihrer jeweiligen Inhaber und dienen ausschließlich zu Identifikationszwecken. Diese Software steht in keiner Verbindung zu diesen Marken und wird auch nicht von ihnen unterstützt.
:::
