<a id="examples"></a>
# Beispiele

Ausführbare Projekte unter [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) auf GitHub – jedes mit eigener Konfiguration, festgeschriebenen Gebietsschema-Ausgaben und README. Sie können übersetzte Dateien ohne API-Schlüssel erkunden; für eine erneute Übersetzung ist ein Anbieterschlüssel erforderlich ([Anbieter und Modelle](/de/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Eigenständig ausführen (`npx degit`)

Kopieren Sie ein Beispiel, ohne das gesamte Repository zu klonen. Jedes deklariert `"ai-i18n-tools": "^1.7.2"` und installiert die CLI von npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Wenn Sie stattdessen das **gesamte** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)-Repository geklont haben, führen Sie `pnpm install` und `pnpm run build` im Repository-Stammverzeichnis aus, dann `cd examples/<name>`. Workspace-Beispiele verwenden die lokale CLI über ihre `pnpm run i18n:*`-Skripte oder direkt `ai-i18n-tools …` nach dem [PATH-Setup](/de/guide/installation#using-the-cli). Siehe [Installation – Geklontes Monorepo](/de/guide/installation#cloned-monorepo).

<a id="list-of-examples"></a>
## Liste der Beispiele

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

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
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | LLM-Anbieter auswählen oder benchmarken (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Regressionstest Markdown / CJK-Übersetzung (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Jeder **Beispiel**-Name verlinkt zu seinem GitHub-README mit vollständiger Einrichtung, Befehlen und Projektlayout – oder durchsuchen Sie den [Beispielindex im Repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).
