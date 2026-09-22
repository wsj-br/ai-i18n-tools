<a id="usage--costs"></a>
# Nutzung und Kosten

Der Tab **Nutzung und Kosten** fasst die abgerechneten Modell-API-Aufrufe dieses Projekts zusammen – einschließlich später verworfener Wiederholungsversuche – mit Tokenanzahlen und den Gesamtkosten in USD.

Dieselbe Aggregation ist in der Befehlszeile als `ai-i18n-tools usage` verfügbar.

Verwenden Sie es, um folgende Fragen zu beantworten: *Wie viele Aufrufe haben wir getätigt, welche Modelle und Operationen haben Tokens verbraucht und was hat es gekostet?*

<a id="what-is-recorded"></a>
## Was aufgezeichnet wird

Jede Detailzeile ist eine HTTP-Vervollständigung, die eine Nutzung zurückgegeben hat (auch wenn die Übersetzung später aufgrund von Parse-/Skript-/Qualitätsfehlern abgelehnt und das nächste Fallback-Modell versucht wurde). Transportfehler, die nie einen abgerechneten Body erzeugt haben, werden nicht protokolliert.

Nach Abschluss eines Befehls, der die API aufgerufen hat, werden Zeilen, die älter als **sieben volle UTC-Kalendertage** sind (ab 00:00 UTC heute minus 7 Tage), in Monatssummen (`api_totals`) überführt und aus dem Detailprotokoll entfernt. Die letzte Woche verbleibt als einzelne `api_calls`-Zeilen. Übersichtstabellen kombinieren beide Quellen für den ausgewählten Zeitraum.

<a id="cost-reporting"></a>
## Kostenberichterstattung

Jeder Aufruf, jede Übersichts- und jede Tabellenkarte zeigt **einen** USD-Kostenwert an:

1. Die `usage.cost` des Anbieters, wenn die Antwort diese enthielt (heute OpenRouter).
2. Andernfalls der Betrag aus `providers.<name>.modelPricing` oder der anbieterweiten `pricing`-Standardwert, angewendet auf die Eingabe- und Ausgabe-Tokens dieses Aufrufs.

Neue Aufrufe speichern diesen Betrag in der `api_calls`-Zeile. Ältere Zeilen, die ohne Kosten gespeichert wurden, werden auf die gleiche Weise bepreist, wenn der Bericht geöffnet wird, und dann zur gleichen Kostenfigur hinzugefügt – sie werden nicht als zweite Spalte angezeigt. Wenn keine der beiden Quellen zutrifft, ist die Zelle `—`, niemals `$0.00`. Eine spätere Änderung der konfigurierten Raten schreibt Zeilen, die bereits einen gespeicherten Kostenwert haben, nicht neu. Monatliche Rollups behalten weiterhin eine Zählung der Aufrufe, die einen Kostenwert gespeichert haben (`ncost_acc` / `ncost_dis`), damit `$0.00` nach der Komprimierung von „unbekannt“ unterscheidbar bleibt.

<a id="filters"></a>
## Filter

Filtern Sie nach Zeitfenster, Anbieter, Modell, Operation (`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`), Gebietsschema und Ergebnis (akzeptiert vs. verworfen).

Zeitfenster:

- Kurze Bereiche (`Last 30 minutes` bis `Last 30 days`) verwenden rollierende Dauern. **Nutzung im Zeitverlauf** zeigt eine Zeile pro UTC-Kalendertag, der noch Details in diesem Bereich enthält.
- `Last 2 months` / `Last 3 months` beginnen um 00:00 UTC am ersten Tag des aktuellen Kalendermonats minus 1 / 2 Monate. **Nutzung im Zeitverlauf** zeigt die beibehaltenen täglichen Zeilen plus eine Zeile pro Monat.
- `All time` enthält alle monatlichen Summen und die beibehaltenen täglichen Zeilen.

Um alte Nutzungsdaten zu löschen, wählen Sie unter **Einträge löschen, die älter sind als** (`> 1 month`, `> 2 months`, `> 3 months`, `> 6 months`, `> 1 year` oder `all data (clear)`) ein Zeitfenster aus und klicken Sie anschließend auf **Daten löschen**. Das Menü startet mit `-`, wodurch **Daten löschen** deaktiviert bleibt, bis ein Zeitfenster gewählt ist. Dieselben Zeitfenster sind als `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]` verfügbar. Kalender-Stichtage behalten den aktuellen Monat (`1mo`) oder den aktuellen Monat zuzüglich der vorangegangenen Monate bei.

<a id="command-line"></a>
## Befehlszeile

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
