<a id="troubleshooting"></a>
# Fehlerbehebung

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## Ankerlinks in übersetzten Dokumenten funktionieren nicht

Ein Link wie `[label](other.md#section-id)` öffnet möglicherweise die korrekte übersetzte Datei, scrollt aber nicht zum gewünschten Überschriftselement – oder springt zum falschen Abschnitt. Das `#…`-Fragment entspricht keinem Überschrifts-`id` mehr in diesem Gebietsschema.

Häufige Ursachen:

- Quellüberschriften hatten nie explizite Anker-IDs; die Seite leitet Slugs aus dem sichtbaren Überschriftstext ab, der sich nach der Übersetzung ändert.
- Sie haben eine Überschrift in der Quelle umbenannt, aber die vorhergehende `<a id="…"></a>`-Zeile fehlt oder enthält noch die alte ID.
- Ankerlinks verwenden ein `#…`-Fragment, das aus englischen Wörtern erraten wurde, anstatt der ID, die `write-heading-ids` generieren würde.

**Behebung**

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer **Quell-** `.md` / `.mdx` aus (gleiche `docs[]` / `contentPaths` wie `translate-docs`). Standardmäßig fügt es `<a id="slug"></a>` vor jeder ATX-Überschrift ein oder aktualisiert einen vorhandenen Anker, wenn der Überschriftentext nicht mehr mit dem aktuellen Slug übereinstimmt. Für Docusaurus MDX-Kommentar-IDs verwenden Sie `--slug-style mdx-comment`.
2. Verweisen Sie Ankerlinks auf diese IDs – z. B. `[setup](guide.md#first-run)`, wobei `#first-run` mit der Ankerzeile über der Zielüberschrift übereinstimmt, nicht mit einem Slug, der allein aus dem englischen Titel abgeleitet wurde.
3. Führen Sie `translate-docs` (oder `sync --force-update`) erneut aus, damit jede Lokalisierungskopie die aktualisierten Ankerzeilen enthält.

Verwenden Sie zuerst `--dry-run` auf `write-heading-ids`, um Änderungen in der Vorschau anzuzeigen. Siehe [Ankerlinks](/de/guide/documents/anchor-links) für das vollständige Muster.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Bild- oder Asset-Links 404 in übersetzten Dokumenten

Ein Markdown-Link oder `![alt](url)` funktioniert auf Englisch, gibt aber in übersetzten Kopien einen 404-Fehler zurück – oft, weil die URL immer noch auf den Ordner der Quellsprache oder einen nur englischen statischen Pfad verweist.

**Behebung**

1. Bestätigen Sie, dass Ihr Asset-Layout mit Ihrem `docsOutput.style` übereinstimmt (flach vs. Dokumentensystem). Siehe [Link-Umschreibung](/de/guide/documents/link-rewriting) und [Bilder & Screenshots](/de/guide/images-and-screenshots/).
2. Fügen Sie `docsOutput.postProcessing.regexAdjustments` hinzu oder passen Sie es an, um Gebietsschema-Segmente auszutauschen oder absolute `/img/…`-Pfade zu überbrücken. Bei einem flachen Layout denken Sie daran, dass der flache Link-Rewriter **vor** `regexAdjustments` ausgeführt wird – passen Sie Muster an die bereits präfixierte URL an.
3. Stellen Sie sicher, dass sprachspezifische Asset-Dateien unter den Pfaden existieren, auf die das umgeschriebene Markdown verweist (`translate-docs` schreibt URLs um, kopiert aber keine Rasterdateien).

<a id="hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters"></a>
## Hindi, Arabisch, CJK oder Kyrillisch wird romanisiert (lateinische Buchstaben)

Einige Modelle übersetzen die Bedeutung, schreiben das Ergebnis aber in lateinischen/römischen Buchstaben (z. B. Hindi als `Namaste` anstelle von `नमस्ते`). Ein bloßes `hi` bedeutet Devanagari; verwenden Sie `hi-Latn` nur, wenn Sie romanisiertes Hindi wünschen.

**Behebung**

1. Vergewissern Sie sich, dass der Gebietsschema-Code dem gewünschten Skript entspricht (`hi` vs. `hi-Latn`, `zh-Hans` vs. `zh-Hant`, `sr` vs. `sr-Latn`).
2. Führen Sie die Übersetzung erneut aus, damit Cache-Zeilen mit falschem Skript abgelehnt werden: `translate-ui --force` für UI-Strings oder `translate-docs --check-cache` / `sync --check-cache` (die Dateiebene wird nur für Gebietsschemata mit einem erwarteten Skript umgangen; ein gültiger Segment-Cache wird weiterhin verwendet). `--force-update` verarbeitet jedes Gebietsschema neu.
3. Wenn ein Modell die Skriptprüfung immer wieder nicht besteht, fügen Sie einen `localeModels`-Eintrag für dieses Gebietsschema hinzu, damit zuerst ein stärkeres Modell versucht wird – siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain).
