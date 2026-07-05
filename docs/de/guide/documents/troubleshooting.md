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
