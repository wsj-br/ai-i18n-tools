<a id="what-is-ai-i18n-tools"></a>
# Was ist ai-i18n-tools?

Das Paket `ai-i18n-tools` bietet drei Übersetzungsflächen:

- **UI-Strings**: Extrahieren Sie `t("…")`-Aufrufe aus beliebigen JS/TS-Quellen, übersetzen Sie diese über den aktiven [LLM-Anbieter](/guide/providers-and-models) und schreiben Sie flache JSON-Dateien pro Gebietsschema, die für i18next bereit sind.
- **Dokumente**: Übersetzen Sie **Markdown-, MDX- und `.astro`-Seiten**, die in `docs[].contentPaths` über `translate-docs` aufgeführt sind, mit intelligentem Caching. Optionales **Docusaurus-Katalog-JSON** (`docs[].docusaurusCatalogDir`, von `docusaurus write-translations`) wird im selben Befehl übersetzt, wenn `features.translateDocs` aktiviert ist – Website-Chrome (Navigationsleiste, Fußzeile, Theme-Strings), nicht Prosa in `docs/`. **VitePress**-Seiteninhalte verwenden dieselbe `docs[]`-Pipeline; Navigations-/Seitenleisten-/Fußzeilenbeschriftungen verwenden JSON (`json[]` / `translate-json`) – siehe [VitePress-Integration](/guide/vitepress-integration).
- **JSON**: Übersetzen Sie beliebige verschachtelte JSON-Bundles (z. B. `src/i18n/en/translation.json`) über die obersten Ebenen `json[]`, `features.translateJson` und `translate-json` – für Websites, die UI-Texte in JSON-Dateien pro Gebietsschema anstelle von `t()` im Quellcode speichern.
- **Tool-UI (integriert)** – CLI-Hilfe, Protokolle und das Übersetzungs-Dashboard werden in mehreren Sprachen ausgeliefert; dies ist getrennt von der Übersetzung der UI-Strings oder Dokumente **Ihrer** App.

**SVG**-Assets verwenden `features.translateSVG`, den Top-Level-Block `svg` und `translate-svg` (siehe [CLI-Referenz](/reference/cli-commands)).

**Welches soll ich verwenden?**

- Benutzerorientierte Strings im Quellcode über `t()` → UI-Strings (`extract` / `translate-ui`).
- Lokalisierte Seiten, Docusaurus-Shell-JSON oder VitePress-Markdown → Dokumente (`translate-docs`).
- VitePress-Theme-JSON oder andere eigenständige verschachtelte Gebietsschema-Dateien → JSON (`translate-json`).

Alle drei verwenden den aktiven LLM-Anbieter (siehe [Anbieter und Modelle](/guide/providers-and-models)) und teilen sich eine einzige Konfigurationsdatei.

<a id="next-steps"></a>
## Nächste Schritte

1. [Installation](/guide/installation) – Installieren Sie das Paket und legen Sie Ihren API-Schlüssel für den Anbieter fest.
2. [Schnellstart](/guide/quick-start) – Erstellen Sie eine Konfiguration und führen Sie Ihre erste Übersetzung aus.
3. [Anbieter und Modelle](/guide/providers-and-models) – Wählen Sie einen Anbieter, eine Modell-Fallback-Kette und eine `-P`-Überschreibung.
