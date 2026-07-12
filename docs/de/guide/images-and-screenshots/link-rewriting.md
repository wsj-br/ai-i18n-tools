<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# Der Flat-Link-Rewriter und der zweistufige Workflow

Lesen Sie diese Seite für Screenshot-URL-Layouts und den zweistufigen Asset-Fluss. Für seitenübergreifende Markdown-Links und `replace`-Platzhalter siehe [Dokumente – Link-Umschreibung](/de/guide/documents/link-rewriting).

Für `docsOutput.style = "flat"` (und sofern nicht `rewriteRelativeLinks: false` oder ein benutzerdefinierter `pathTemplate` festgelegt ist) wird ein integrierter Rewriter vor `postProcessing` ausgeführt. Er verarbeitet Cross-Doc-Links (fügt Gebietsschema-Suffixe hinzu) und stellt Nicht-Markdown-Asset-URLs ein Tiefenpräfix voran. Gebietsschema-spezifische Asset-Pfade (Screenshots, `/img/…`-Brücken) werden dann von `docsOutput.postProcessing.regexAdjustments` umgeschrieben.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Zweistufiger Ablauf bei `docsOutput.style = "flat"`

1. **Quell-URL** – Bildpfad in übersetztem Markdown (nach Segment-Wiederzusammenfügung)
2. **Flat Link Rewriter** – stellt einen Tiefenpräfix voran (`../`, `../../docs/`, …)
3. **`regexAdjustments`** – tauscht das Gebietsschema-Ordnersegment aus (`en-GB` → `${translatedLocale}`)
4. **Ausgabe-URL** – endgültiger Pfad, der in die übersetzte Datei geschrieben wird

Beispiel mit `outputDir: "translated-docs/"` und Quelldatei `README.md` im Stammverzeichnis des Repos:

1. Flat-Link-Rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (ein `../` für `translated-docs/`)
2. `regexAdjustments`-Regel `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Für jeden Nicht-`flat`-Stil (einschließlich `"nested"`, `"doc-system"` und Voreinstellungen wie `"docusaurus"`, `"astro-starlight"` und `"vitepress"`) wird der Flat Link Rewriter nicht ausgeführt. `regexAdjustments` sieht die ursprüngliche URL aus dem übersetzten Markdown (typischerweise ein absoluter Pfad wie `/img/screenshots/en-GB/foo.png`).

**Astro Starlight MDX:** Starlight-Inhalte sind oft `.mdx`. Für diese Dateien führt `translate-docs` nur `postProcessing.regexAdjustments` aus – kein Flat-, VitePress-, Nextra- oder Fumadocs-Link-Rewriter. Screenshot-Pfade pro Gebietsschema verwenden weiterhin dieselbe `screenshots/[^/]+/` → `screenshots/${translatedLocale}/`-Regel; siehe [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/).

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress-Link-Normalisierer (`style: "vitepress"`)

Wenn `docsOutput.rewriteVitepressLinks` auf `true` gesetzt ist (Standard, wenn `style` auf `"vitepress"` gesetzt ist), wird ein separater Normalisierer nach der Segmentwiederherstellung ausgeführt (anstelle des Flat Rewriters). Er zielt auf VitePress / Doc-System-Sites ab, bei denen Englisch im Inhaltsstamm und Lokalisierungen in gleichrangigen Ordnern (`docs/de/guide/…`) liegen.

1. **Quell-href** – Link in übersetztem Markdown (nach Segment-Wiederzusammenfügung)
2. **VitePress Link Normalizer** – schreibt Dokumentpfade in Site-Routen um (`/guide/…`)
3. **`regexAdjustments`** – optionaler Gebietsschema-Ordner-Tausch für Screenshots (`screenshots/en-GB/` → `screenshots/de/`, …)
4. **Ausgabe-href** – endgültige URL, die in die übersetzte Datei geschrieben wird

Typische Rewrites:

| Quellmuster | Normalisiertes Ziel |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (aus einer lokalen Datei) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | unverändert (verwenden Sie vollständige URLs für Repo-Pfade) |

Für Projekte, die `README.md` → `docs/index.md` synchronisieren, verwenden Sie vollständige GitHub-URLs in `README.md` für `LICENSE`, `examples/` und andere Dateien außerhalb des VitePress-Baums. Siehe [VitePress-Integration – README als Dokumentations-Homepage](/de/guide/integrations/vitepress#readme-as-homepage).

Der Flat Rewriter und der VitePress Normalizer schließen sich pro `docs[]`-Block gegenseitig aus – nur einer läuft vor `regexAdjustments`. Siehe [VitePress-Integration – Link-Konventionen](/de/guide/integrations/vitepress#link-conventions).

Screenshot-Ordner pro Gebietsschema verwenden bei Bedarf weiterhin dieselbe `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` `regexAdjustments`-Regel; siehe [Ordner pro Gebietsschema](/de/guide/images-and-screenshots/per-locale-folder).

<a id="nextra-link-normalizer-style-nextra"></a>
### Nextra-Link-Normalisierer (`style: "nextra"`)

Wenn `docsOutput.rewriteNextraLinks` `true` ist (Standard, wenn `style` `"nextra"` ist), läuft ein separater Normalizer nach der Segmentwiederherstellung. Er schreibt `content/en/…` und relative `.mdx`-Pfade in gebietsschema-neutrale Routen um (`/guide/…`). Siehe [Nextra-Integration – Link-Konventionen](/de/guide/integrations/nextra#link-conventions).

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Fumadocs-Link-Normalisierer (`style: "fumadocs"`)

Wenn `docsOutput.rewriteFumadocsLinks` `true` ist (Standard, wenn `style` `"fumadocs"` ist), läuft ein separater Normalizer nach der Segmentwiederherstellung. Er schreibt `content/docs/…` und relative `.mdx`-Pfade in gebietsschema-neutrale Routen um (`/docs/…`). Siehe [Fumadocs-Integration – Link-Konventionen](/de/guide/integrations/fumadocs#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Tiefenpräfix pro Datei mit `flatPreserveRelativeDir`

Der Tiefenpräfix wird pro Ausgabedatei berechnet – nicht global für den gesamten Stapel. Für jede Quelldatei ermittelt der Rewriter den relativen Pfad vom Verzeichnis der Ausgabedatei zurück zum Verzeichnis der Quelldatei und verwendet diesen als Präfix.

Das bedeutet, dass mit `flatPreserveRelativeDir: true` Quelldateien in Unterverzeichnissen automatisch das richtige Präfix erhalten. Zum Beispiel wird `docs/guide/quick-start.md` in `translated-docs/docs/guide/quick-start.<locale>.md` ausgegeben. Das Präfix pro Datei ist `../../docs/`, sodass ein Asset `translation-dashboard.png` (ein Geschwister des Quellbaums) zu `../../docs/translation-dashboard.png` wird – was von `translated-docs/docs/guide/` zurück zu `docs/translation-dashboard.png` korrekt aufgelöst wird.

Für Assets mit relativem Pfad neben Quelldateien ist keine `regexAdjustments`-Korrektur erforderlich.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` und `linkRewriteDocsRoot`

| Option                                   | Wirkung                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Aktiviert oder deaktiviert den flachen Link-Umschreiber explizit (überschreibt den Standardwert bei `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Stammverzeichnis, relativ zu dem `depthPrefix` berechnet wird (Standard: `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Beeinflusst die Struktur des Ausgabepfads, die der Umschreiber bei der Berechnung der Zielwege für bekannte übersetzte Dateien verwendet       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

Konfigurieren Sie geordnete `{ "description"?, "search", "replace" }`-Regeln unter `docs[].docsOutput.postProcessing`, um Bild-, Screenshot- und andere Asset-URLs umzuschreiben, die von integrierten Rewritern nicht verarbeitet werden – typischerweise das Austauschen eines Gebietsschema-Ordnersegments (`screenshots/en-GB/` → `screenshots/de/`) oder das Überbrücken absoluter statischer Pfade (`/img/…` → `../assets/…`).

Regeln werden auf den übersetzten Markdown-**Body** angewendet, nachdem die Segmentwiederherstellung und die integrierte Link-Umschreibung (flat oder VitePress) erfolgt sind und bevor `addFrontmatter` ausgeführt wird. Beim Flat-Layout schreiben Sie `search`-Muster gegen URLs **nachdem** das Tiefenpräfix angewendet wurde – passen Sie das Gebietsschema-Segment innerhalb des Pfads an, nicht das führende `../`.

**Screenshot-Ordner pro Gebietsschema (Flat-Layout):**

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

Verwenden Sie `[^/]+` anstelle der Festcodierung Ihres Quellgebietsschemas (`en-GB`), damit die Regel eine `sourceLocale`-Änderung übersteht. Der häufigste Platzhalter ist `${translatedLocale}`; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}` und Pfadvariablen sind ebenfalls verfügbar – siehe [Dokumente – Link-Umschreibung](/de/guide/documents/link-rewriting#replace-placeholders).

Layout-spezifische Beispiele (flat, Doc-System, Docusaurus, Starlight): [Pro-Gebietsschema-Ordner](/de/guide/images-and-screenshots/per-locale-folder). Allgemeine seitenübergreifende Linkregeln: [Dokumente – Link-Umschreibung](/de/guide/documents/link-rewriting). Feldreferenz: [Konfiguration – `docs`](/de/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

Siehe [Häufige Fehler und Fehlerbehebung](/de/guide/images-and-screenshots/troubleshooting) für festcodierte Gebietsschema-Regexes, fehlende Screenshot-Verzeichnisse und Docusaurus `/img/`-Bridging.
