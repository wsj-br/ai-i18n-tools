<a id="shared-raster"></a>
# Geteiltes Raster

Verwenden Sie dieses Muster, wenn ein einzelnes Bild in allen Sprachversionen gemeinsam genutzt wird (keine sprachspezifischen Varianten). Wenn `docsOutput.style = "flat"` verwendet wird, berechnet der flache Link-Rewriter das Tiefenpräfix pro Ausgabedatei, sodass ein Asset neben der Quelldatei (z. B. `docs/figure.png`, referenziert als `figure.png` aus `docs/page.md`) in jeder übersetzten Ausgabe korrekt aufgelöst wird – keine `postProcessing.regexAdjustments`-Regel ist erforderlich.

Beispiel: Ein Projekt übersetzt `docs/guide/quick-start.md` nach `translated-docs/docs/guide/quick-start.<locale>.md`. Ein Geschwisterbild `docs/translation-dashboard.png` wird von `quick-start.md` als `../translation-dashboard.png` referenziert. Der Rewriter berechnet das Präfix pro Datei vom Verzeichnis der Ausgabedatei zurück zum Quellverzeichnis (`../../docs/`), wodurch `../../docs/translation-dashboard.png` entsteht. Von `translated-docs/docs/guide/` aus wird dies korrekt auf `docs/translation-dashboard.png` zurückgeführt.

Eine `postProcessing`-Regel ist weiterhin erforderlich, wenn:
- Auf das Asset über eine absolute URL verwiesen wird (z. B. `/img/figure.png`) – der Umschreiber verarbeitet nur relative Pfade
- Sie die Asset-URL aus anderen Gründen ändern möchten (z. B. Umstellung auf ein CDN)

<a id="implementation-example"></a>
### Implementierungsbeispiel

Die Dokumentation dieses Repositorys verwendet die absolute URL-Variante von freigegebenen Bildern: Der [Leitfaden zum Übersetzungs-Dashboard](/guide/translation-dashboard/) referenziert seinen Screenshot als `![Translation Dashboard](/translation-dashboard.png)` – einen absoluten, site-root-Pfad, der von [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) bereitgestellt wird. Da die URL für jedes Gebietsschema identisch ist, ist keine `postProcessing.regexAdjustments`-Regel erforderlich; aktualisieren Sie die PNG-Datei mit [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh), wenn sich die Dashboard-Benutzeroberfläche ändert.
