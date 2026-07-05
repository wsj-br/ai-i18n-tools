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

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer **Quell-**`.md` / `.mdx` aus (gleiches `docs[]` / `contentPaths` wie `translate-docs`). Es fügt `<a id="slug"></a>` vor jede ATX-Überschrift ein oder aktualisiert einen vorhandenen Anker, wenn der Überschriftentext nicht mehr mit dem aktuellen Slug übereinstimmt.
2. Verweisen Sie Ankerlinks auf diese IDs – z. B. `[setup](guide.md#first-run)`, wobei `#first-run` mit der Ankerzeile über der Zielüberschrift übereinstimmt, nicht mit einem Slug, der allein aus dem englischen Titel abgeleitet ist.
3. Führen Sie `translate-docs` (oder `sync --force-update`) erneut aus, sodass jede Lokalisierungskopie die aktualisierten Ankerzeilen enthält.

Verwenden Sie zuerst `--dry-run` auf `write-heading-ids`, um Änderungen in der Vorschau anzuzeigen. Siehe [Ankerlinks](/guide/documents/anchor-links) für das vollständige Muster.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Bild- oder Asset-Links 404 in übersetzten Dokumenten

Ein Markdown-Link oder `![alt](url)` funktioniert auf Englisch, gibt aber in übersetzten Kopien einen 404-Fehler zurück – oft, weil die URL immer noch auf den Ordner der Quellsprache oder einen nur englischen statischen Pfad verweist.

**Behebung**

1. Bestätigen Sie, dass Ihr Asset-Layout mit Ihrem `docsOutput.style` übereinstimmt (flach vs. Dokumentensystem). Siehe [Link-Umschreibung](/guide/documents/link-rewriting) und [Bilder & Screenshots](/guide/images-and-screenshots/).
2. Fügen Sie `docsOutput.postProcessing.regexAdjustments` hinzu oder passen Sie es an, um Gebietsschema-Segmente auszutauschen oder absolute `/img/…`-Pfade zu überbrücken. Bei einem flachen Layout denken Sie daran, dass der flache Link-Rewriter **vor** `regexAdjustments` ausgeführt wird – passen Sie Muster an die bereits präfixierte URL an.
3. Stellen Sie sicher, dass sprachspezifische Asset-Dateien unter den Pfaden existieren, auf die das umgeschriebene Markdown verweist (`translate-docs` schreibt URLs um, kopiert aber keine Rasterdateien).
