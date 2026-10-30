<a id="models"></a>
# Modelle

Die Registerkarte **Modelle** stuft die Chat-Modelle des aktiven Anbieters ein, sodass Sie `translationModels` auswählen können, ohne IDs manuell kopieren zu müssen. Sie verwendet dasselbe Ranking wie [`suggest-models`](/de/reference/cli-commands/models#suggest-models). Eine exemplarische Vorgehensweise, die auch erklärt, warum die Liste mehr als ein Modell enthält, finden Sie unter [KI-Modelle](/de/guide/ai-models).

Wählen Sie **Qualität** oder **Preis**. Qualität bevorzugt languagebench ChrF und Arena Score. Preis bevorzugt einen niedrigeren USD-Kurs und hält dennoch eine Qualitätsuntergrenze aufrecht. Wenn die Konfiguration mehr als einen Anbieter hat, erscheint ein **Anbieter**-Menü; die Standardeinstellung ist der Anbieter, mit dem das Dashboard gestartet wurde (`provider`, oder `-P` / `--provider` beim `dashboard`-Befehl). Das Ändern des Anbieters oder der Priorität lädt die Tabelle neu. Optionale Gewichtungen finden Sie unter [`modelSuggestion`](/de/reference/configuration#modelsuggestion-optional).

Die Tabellenspalten sind Steuerelemente zum Neuanordnen, ein Kontrollkästchen, Rang, Modell-ID, Index (der gewichtete Score mal 100), gemessener ChrF, gemessener Arena Score und Eingabe-/Ausgabepreis in USD pro 1 Mio. Tokens. Eine fehlende Messung wird durch einen Gedankenstrich dargestellt. Die Rangnummer ist die Position des Modells in der vollständigen Rangliste, vor den unten stehenden Filtern. Ziehen Sie den Ziehpunkt einer Zeile oder verwenden Sie deren Auf- und Ab-Schaltflächen, um ihre Position in dieser Tabelle zu ändern. **Aktualisieren** lädt die Rangfolge erneut.

Die Steuerelemente sind in drei Karten angeordnet. **Ranking** enthält das Prioritätsmenü (und das Anbietermenü, wenn die Konfiguration mehr als einen Anbieter hat). **Filter** enthält **Max. Ausgabepreis**, **Min. Index-Delta** und **Aktualisieren**. **Aktionen** enthält **JSON kopieren** und **Konfiguration aktualisieren**. Drücken Sie die Eingabetaste in einem Zahlenfeld, um die Tabelle zu aktualisieren. Das Ändern eines Menüs bewirkt dasselbe.

**Maximaler Ausgabepreis** behält Modelle, deren Ausgabepreis pro 1 Mio. Tokens höchstens so viele USD beträgt. Ein Modell ohne Ausgabepreis wird ausgeschlossen. **Minimaler Index-Delta** behält ein Modell nur dann, wenn sein Index mindestens so viele Punkte unter dem zuvor behaltenen Modell liegt. Das erste verbleibende Modell wird immer behalten. Lassen Sie eines der Felder leer, um diesen Filter zu überspringen.

Markieren Sie die gewünschten Modelle. Die Statuszeile zeigt an, wie viele ausgewählt sind, zum Beispiel `8 models selected.`. Die schmale Zahl in der Spaltenüberschrift des Kontrollkästchens (Standard 8) gibt an, wie viele führende Zeilen dieses Kontrollkästchen auswählt. Durch Aktivieren werden diese Zeilen ausgewählt. Durch Deaktivieren werden alle Kontrollkästchen deaktiviert. Die von oben nach unten markierten Zeilen bilden die Fallback-Reihenfolge. **Konfiguration aktualisieren** fordert eine Bestätigung an, kopiert die aktuelle Konfiguration in `ai-i18n-tools.config.{timestamp}.backup.json` daneben und schreibt dann diese Reihenfolge in `providers.<selected>.translationModels`. `uiModels` und `localeModels` bleiben unverändert. **JSON kopieren** legt dasselbe `{ "translationModels": [...] }`-Fragment in die Zwischenablage. `suggest-models --apply` schreibt die gleiche Art von Sicherung.

Beim ersten Laden werden languagebench, Arena und models.dev bei leerem Cache heruntergeladen, was einige Zeit in Anspruch nehmen kann. Spätere Ladevorgänge verwenden den 7-Tage-Cache unter `<cacheDir>/benchmark-scores.json`. Der Tab verfügt über keine Schaltfläche zum Aktualisieren. Aktualisieren Sie den Cache über die CLI mit `ai-i18n-tools suggest-models --refresh` und laden Sie anschließend den Tab neu. Derselbe Befehl kann die Liste ausgeben oder anwenden.

::: info Externe Benchmark-Quellen
  Die Scores werden aus externen Datenquellen berechnet:
  - [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) lizenziert unter CC-BY-SA-4.0,
  - [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) lizenziert unter CC-BY-4.0, und
  - [models.dev](https://models.dev/) Preise lizenziert unter MIT.
:::
