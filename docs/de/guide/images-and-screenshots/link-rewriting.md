<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# Der Flat-Link-Rewriter und der zweistufige Workflow

Für `docsOutput.style = "flat"` (und sofern nicht `rewriteRelativeLinks: false` oder ein benutzerdefiniertes `pathTemplate` festgelegt ist) wird ein integrierter Umschreiber vor `postProcessing` ausgeführt. Dieser verarbeitet Querverweise zwischen Dokumenten (durch Hinzufügen von Gebietsschemakürzeln) und fügt einen Tiefenpräfix zu URLs von Nicht-Markdown-Ressourcen hinzu.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Zweistufiger Ablauf bei `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Beispiel mit `outputDir: "translated-docs/"` und Quelldatei `README.md` im Stammverzeichnis des Repos:

1. Flacher Link-Rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (ein `../` für `translated-docs/`)
2. `postProcessing`-Regex `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Bei `docsOutput.style = "doc-system"` (einschließlich `"docusaurus"`, `"astro-starlight"` und `"nested"`) wird der flache Link-Umschreiber nicht ausgeführt. `postProcessing` erhält die ursprüngliche URL aus dem übersetzten Markdown (typischerweise ein absoluter Pfad wie `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer"></a>
### VitePress-Link-Normalisierer (`style: "vitepress"`)

Wenn `docsOutput.rewriteVitepressLinks` auf `true` gesetzt ist (Standard, wenn `style` auf `"vitepress"` gesetzt ist), wird ein separater Normalisierer nach der Segmentwiederherstellung ausgeführt (anstelle des Flat Rewriters). Er zielt auf VitePress / Doc-System-Sites ab, bei denen Englisch im Inhaltsstamm und Lokalisierungen in gleichrangigen Ordnern (`docs/de/guide/…`) liegen.

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

Typische Rewrites:

| Quellmuster | Normalisiertes Ziel |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (aus einer lokalen Datei) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | unverändert (verwenden Sie vollständige URLs für Repo-Pfade) |

Für Projekte, die `README.md` → `docs/index.md` synchronisieren, verwenden Sie vollständige GitHub-URLs in `README.md` für `LICENSE`, `examples/` und andere Dateien außerhalb des VitePress-Baums. Siehe [VitePress-Integration – README als Dokumentations-Homepage](/guide/vitepress-integration#readme-as-homepage).

Der flache Rewriter und der VitePress-Normalisierer schließen sich pro `docs[]`-Block gegenseitig aus – nur einer wird vor `postProcessing` ausgeführt. Siehe [VitePress-Integration – Link-Konventionen](/guide/vitepress-integration#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Tiefenpräfix pro Datei mit `flatPreserveRelativeDir`

Der Tiefenpräfix wird pro Ausgabedatei berechnet – nicht global für den gesamten Stapel. Für jede Quelldatei ermittelt der Rewriter den relativen Pfad vom Verzeichnis der Ausgabedatei zurück zum Verzeichnis der Quelldatei und verwendet diesen als Präfix.

Das bedeutet, dass mit `flatPreserveRelativeDir: true` Quelldateien in Unterverzeichnissen automatisch das richtige Präfix erhalten. Zum Beispiel wird `docs/guide/quick-start.md` in `translated-docs/docs/guide/quick-start.<locale>.md` ausgegeben. Das Präfix pro Datei ist `../../docs/`, sodass ein Asset `translation-dashboard.png` (ein Geschwister des Quellbaums) zu `../../docs/translation-dashboard.png` wird – was von `translated-docs/docs/guide/` zurück zu `docs/translation-dashboard.png` korrekt aufgelöst wird.

Für relative Pfade zu Ressourcen neben Quelldateien ist keine `postProcessing`-Regex-Korrektur erforderlich.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` und `linkRewriteDocsRoot`

| Option                                   | Wirkung                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Aktiviert oder deaktiviert den flachen Link-Umschreiber explizit (überschreibt den Standardwert bei `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Stammverzeichnis, relativ zu dem `depthPrefix` berechnet wird (Standard: `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Beeinflusst die Struktur des Ausgabepfads, die der Umschreiber bei der Berechnung der Zielwege für bekannte übersetzte Dateien verwendet       |

---

<a id="common-mistakes-and-troubleshooting"></a>
