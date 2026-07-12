<a id="shared-raster"></a>
# Geteiltes Raster

Verwenden Sie diese Option, wenn ein einzelnes Bild für alle Gebietsschemata freigegeben wird (keine Variante pro Gebietsschema).

- **`docsOutput.style = "flat"`** – der Flat-Link-Rewriter berechnet das Tiefenpräfix pro Ausgabedatei, sodass ein relatives Asset neben der Quelldatei (z. B. `docs/figure.png`, referenziert als `figure.png` von `docs/page.md`) in jeder übersetzten Ausgabe korrekt aufgelöst wird – es ist keine `postProcessing.regexAdjustments`-Regel erforderlich. Wenn sich Quelldateien in Unterverzeichnissen befinden, aktivieren Sie `flatPreserveRelativeDir: true`, damit die Ausgabepfade den Quellbaum beibehalten (siehe [Tiefenpräfix pro Datei](/de/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)).
- **`docsOutput.style = "vitepress"`** (und andere Dokumentationssystem-Voreinstellungen mit einem Link-Normalisierer) – absolute Pfade zum Stammverzeichnis der Site wie `/translation-dashboard.png` bleiben unverändert, wenn die URL in jedem Gebietsschema identisch ist – es ist keine `regexAdjustments`-Regel erforderlich.

**Flaches Beispiel:** Ein Projekt übersetzt `docs/guide/quick-start.md` nach `translated-docs/docs/guide/quick-start.<locale>.md`. Dies setzt `flatPreserveRelativeDir: true` voraus, sodass `docs/guide/quick-start.md` nach `translated-docs/docs/guide/quick-start.<locale>.md` (nicht `translated-docs/quick-start.<locale>.md`) ausgegeben wird. Ein gleichrangiges Bild `docs/translation-dashboard.png` wird von `quick-start.md` als `../translation-dashboard.png` referenziert. Der Rewriter berechnet das Präfix pro Datei vom Verzeichnis der Ausgabedatei zurück zum Quellverzeichnis (`../../docs/`), wodurch `../../docs/translation-dashboard.png` entsteht. Von `translated-docs/docs/guide/` aus wird dies korrekt zurück zu `docs/translation-dashboard.png` aufgelöst.

Eine `postProcessing`-Regel ist weiterhin erforderlich, wenn:
- Das Asset über eine absolute URL in **`docsOutput.style = "flat"`** referenziert wird (z. B. `/img/figure.png`) – der Flat-Rewriter verarbeitet nur relative Pfade
- Sie die Asset-URL aus anderen Gründen ändern möchten (z. B. Wechsel zu einem CDN)

<a id="implementation-example"></a>
### Implementierungsbeispiel

Die Dokumentation dieses Repositorys verwendet die absolute URL-Variante von freigegebenen Bildern: Der [Leitfaden zum Übersetzungs-Dashboard](/de/guide/translation-dashboard/) referenziert seinen Screenshot als `![Translation Dashboard](/translation-dashboard.png)` – einen absoluten, site-root-Pfad, der von [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) bereitgestellt wird. Da die URL für jedes Gebietsschema identisch ist, ist keine `postProcessing.regexAdjustments`-Regel erforderlich.
