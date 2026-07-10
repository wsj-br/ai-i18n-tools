<a id="what-is-ai-i18n-tools"></a>
# Was ist ai-i18n-tools?

ai-i18n-tools ist ein Befehlszeilentool und Toolkit, das Ihnen hilft, Ihre App und Dokumentation mit Ihrem bevorzugten LLM-Anbieter zu übersetzen. Sie steuern alles über eine einzige Konfigurationsdatei und wählen aus, welche Übersetzungsfunktionen aktiviert werden sollen. Verwenden Sie den Befehl „sync“, um die benötigten Modi in einem Durchgang auszuführen.

<a id="translation-modes"></a>
## Übersetzungsmodi

- **UI-Strings** – Extrahieren Sie `t("…")`-Aufrufe (und ähnliche Marker) aus JS/TS-Quellen und schreiben Sie flache, pro-Locale-JSON-Dateien für i18next oder statische Nachschlagevorgänge. Befehle: `extract`, `translate-ui`. Anleitung: [UI-Strings](/de/guide/ui-strings/).
- **Dokumente** – Übersetzen Sie Markdown-, MDX- und `.astro`-Seiten, die in `docs[].contentPaths` aufgeführt sind. Funktioniert mit VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro und anderen statischen Dokumentationsseiten. Befehl: `translate-docs`. Anleitung: [Dokumente](/de/guide/documents/).
- **JSON** – Übersetzen Sie verschachtelte JSON-Locale-Bundles (Themenbezeichnungen, i18n-Überschreibungen, App-Texte, die nicht im Quellcode enthalten sind), die in der obersten Ebene `json[]` definiert sind. Befehl: `translate-json`. Anleitung: [JSON](/de/guide/json).
- **SVG** – Übersetzen Sie sichtbaren Text in SVG-Illustrationen (`<text>`, `<title>`, `<desc>`) und schreiben Sie eine Ausgabedatei pro Locale. Getrennt von der Dokumentenübersetzung – `translate-docs` ändert keine SVG-Assets. Befehl: `translate-svg`. Anleitung: [SVG-Übersetzung](/de/guide/svg-translation/).

Alle vier Modi verwenden den aktiven [LLM-Anbieter](/de/guide/providers-and-models), teilen sich dieselbe Konfigurationsdatei und verwenden einen SQLite-Cache wieder, sodass bei erneuten Ausführungen nur neuer oder geänderter Text an das Modell gesendet wird.

<a id="which-should-i-use"></a>
## Welchen soll ich verwenden?

| Ihr Inhalt | Modus | Befehl |
| --- | --- | --- |
| Quellcode verwendet `t()` oder HTML `data-i18n`-Marker | UI-Strings | `extract` / `translate-ui` |
| Lokalisierte Seiten oder Dokumentationsseiten | Dokumente | `translate-docs` |
| Eigenständige verschachtelte JSON-Gebietsschemadateien | JSON | `translate-json` |
| Diagramme oder Illustrationen mit Beschriftungen in SVG | SVG | `translate-svg` |

Viele Projekte kombinieren Modi – zum Beispiel UI-Strings plus Dokumente für eine VitePress-Site oder Dokumente plus SVG für illustrierte Anleitungen. Siehe [Schnellstart](/de/guide/quick-start) für Gerüstvorlagen und [Konfiguration](/de/reference/configuration) für das vollständige Konfigurationsschema.

<a id="examples"></a>
## Beispiele

Das Repository enthält ausführbare Beispielprojekte unter `examples/` – jedes mit eigener Konfiguration, festgeschriebenen Gebietsschema-Ausgaben und README. Sie können übersetzte Dateien ohne API-Schlüssel erkunden; für die erneute Ausführung der Übersetzung ist ein Anbieterschlüssel erforderlich (siehe [Anbieter und Modelle](/de/guide/providers-and-models)).

| Beispiel | Was es zeigt |
| --- | --- |
| [console-app](/de/examples#console-app) | Kleinste End-to-End-App: `t()` UI-Strings plus README-Übersetzung |
| [nextjs-app](/de/examples#nextjs-app) | Next.js UI, Pluralformen, SVG, verschachtelte Docusaurus-Dokumente, flache README, Dashboard |
| [docusaurus-docs](/de/examples#docusaurus-docs) | Eigenständige Docusaurus-Dokumentationsseite |
| [astro-website](/de/examples#astro-website) | Astro-Marketingseite: vollständige HTML-Übersetzung plus `t()`-Strings |
| [astro-docs](/de/examples#astro-docs) | Astro Starlight-Dokumentationsseite |
| [vitepress-docs](/de/examples#vitepress-docs) | VitePress-Dokumente plus Themenkatalog |
| [nextra-docs](/de/examples#nextra-docs) | Nextra-Dokumente plus `_meta.ts`-Seitenleistenbeschriftungen und Themenwörterbuch |
| [fumadocs-docs](/de/examples#fumadocs-docs) | Fumadocs-Dokumente plus `meta.json`-Seitenleistenbeschriftungen und UI-Katalog |
| [multi-provider](/de/examples#multi-provider) | LLM-Anbieter für dasselbe Dokument vergleichen |
| [test-markdown](/de/examples#test-markdown) | Markdown-Pipeline-Stresstests (CJK, Devanagari, Grenzfälle) |

Siehe [Beispiele](/de/examples) für `npx degit`-Kopierbefehle und eine Auswahlhilfe.

<a id="next-steps"></a>
## Nächste Schritte

1. [Installation](/de/guide/installation) – Installieren Sie das Paket und legen Sie Ihren API-Schlüssel für den Anbieter fest.
2. [Schnellstart](/de/guide/quick-start) – Erstellen Sie eine Konfiguration und führen Sie Ihre erste Übersetzung aus.
3. [Anbieter und Modelle](/de/guide/providers-and-models) – Wählen Sie einen Anbieter, eine Modell-Fallback-Kette und eine `-P`-Überschreibung.
