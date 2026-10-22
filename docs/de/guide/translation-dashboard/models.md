<a id="models"></a>
# Modelle

Der Tab **Modelle** ordnet die Chat-Modelle des aktiven Anbieters, sodass Sie `translationModels` auswählen können, ohne IDs manuell kopieren zu müssen. Er verwendet dieselbe Rangfolge wie [`suggest-models`](/de/reference/cli-commands/models#suggest-models).

Wählen Sie **Qualität** oder **Preis**. Qualität bevorzugt den Languagebench ChrF und den Arena Score. Preis bevorzugt einen niedrigeren USD-Tarif unter Beibehaltung eines Qualitäts-Mindeststandards. Wenn die Konfiguration mehr als einen Anbieter enthält, erscheint ein **Anbieter**-Menü; der Standardwert ist der Anbieter, mit dem das Dashboard gestartet wurde (`provider` oder `-P` / `--provider` beim `dashboard`-Befehl). Das Ändern des Anbieters oder der Priorität lädt die Tabelle neu. Optionale Gewichtungen finden Sie in [`modelSuggestion`](/de/reference/configuration#modelsuggestion).

Die Tabellenspalten sind Rang, Modell-ID, Index (der gewichtete Score multipliziert mit 100), gemessener ChrF, gemessener Arena Score sowie Eingabe-/Ausgabepreis in USD pro 1 Mio. Token. Ein fehlender Messwert wird durch einen Geviertstrich dargestellt. Die Rangnummer entspricht der Position des Modells im vollständigen Ranking vor Anwendung der unten stehenden Filter.

**Max. Ausgabepreis** behält Modelle bei, deren Ausgabepreis pro 1 Mio. Token höchstens diesen USD-Betrag beträgt. Ein Modell ohne Ausgabepreis wird ausgeschlossen. **Min. Index-Delta** behält ein Modell nur bei, wenn sein Index mindestens um diesen Wert unter dem des zuvor beibehaltenen Modells liegt. Das erste verbleibende Modell wird immer beibehalten. Lassen Sie ein Feld leer, um den jeweiligen Filter zu überspringen. Das Ändern eines der Werte lädt die Tabelle neu.

Wählen Sie die gewünschten Modelle aus. **Top verwenden** (Standard 5) wählt die ersten N Zeilen der gefilterten Liste aus und setzt deren Reihenfolge zurück. Verschieben Sie eine ausgewählte ID nach oben oder unten, um die Fallback-Reihenfolge festzulegen. **Konfiguration aktualisieren** schreibt diese Reihenfolge in `providers.<selected>.translationModels` und lässt `uiModels` sowie `localeModels` unverändert. **JSON kopieren** legt dasselbe `{ "translationModels": [...] }`-Fragment in die Zwischenablage.

Beim ersten Laden werden languagebench, Arena und models.dev bei leerem Cache heruntergeladen, was einige Zeit in Anspruch nehmen kann. Spätere Ladevorgänge verwenden den 7-Tage-Cache unter `<cacheDir>/benchmark-scores.json`. Der Tab verfügt über keine Schaltfläche zum Aktualisieren. Aktualisieren Sie den Cache über die CLI mit `ai-i18n-tools suggest-models --refresh` und laden Sie anschließend den Tab neu. Derselbe Befehl kann die Liste ausgeben oder anwenden.

Die Fußzeile nennt languagebench (CC BY-SA 4.0), den LMArena Arena Score (CC BY 4.0) und models.dev (MIT).
