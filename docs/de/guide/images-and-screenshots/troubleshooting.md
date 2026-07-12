<a id="common-mistakes-and-troubleshooting"></a>
# Häufige Fehler und Fehlerbehebung

**Kein Gebietsschema-Verzeichnis in Screenshot-Pfaden**
`images/screenshots/screenshot.png` – kann Gebietsschema-Varianten nicht unterscheiden und nicht umgeschrieben werden. Restrukturieren Sie zu `images/screenshots/<locale>/screenshot.png`, bevor Sie das Umschreiben von [Ordnern pro Gebietsschema](/de/guide/images-and-screenshots/per-locale-folder) verwenden.

**Im Regex hartkodiertes Quell-Gebietsschema**
`"search": "screenshots/en-GB/"` — bricht stillschweigend, wenn sich `sourceLocale` ändert. Verwenden Sie stattdessen `"search": "screenshots/[^/]+/"`.

**SVG-Quellen und -Ausgaben im selben Verzeichnis**
Wenn sich `svg.sourcePath` und `svg.outputDir` überlappen, liegen generierte Dateien zusammen mit manuell bearbeiteten Quellen. Halten Sie sie in separaten Verzeichnissen.

**Absolute Docusaurus-Static-URLs für lokalisierte SVGs**
`/img/diagram.svg` (aus `static/img/`) erfordert eine `regexAdjustments`-Regel, um in der übersetzten Ausgabe nach `../assets/` umgeschrieben zu werden. Legen Sie die SVG-Quellen in `static/assets/` ab und verwenden Sie von Anfang an relative `../assets/diagram.svg`, um dies vollständig zu vermeiden.

**Fehlender `docs/assets`-Symlink in Docusaurus**
Ohne den Symlink können Quelldokumente in `docs/user-guide/` nicht per relativem Pfad auf PNGs oder SVGs in `static/assets/` verweisen. Richten Sie den Symlink bei der Projekterstellung ein: `ln -s ../static/assets documentation/docs/assets`.

**Das Skript `take-screenshots` erfasst nur das Quellgebietsschema**
Das Ordnerlayout pro Gebietsschema erfordert PNG-Dateien für jedes Gebietsschema. Wenn das Skript nur `en-GB` erfasst, haben übersetzte Dokumente umgeschriebene Pfade, die auf fehlende Dateien verweisen.

**Umschreiben `regexAdjustments` innerhalb von umgrenzten Konfigurationsbeispielen**
`postProcessing` wird auf den gesamten übersetzten Markdown-Text angewendet, einschließlich umgrenzter Codeblöcke. Wenn eine Dokumentationsseite ein Konfigurations-Snippet einbettet, das einen übereinstimmenden Pfad enthält (z. B. `screenshots/en-GB/`), wird dieses Snippet auch in der übersetzten Ausgabe umgeschrieben. Bevorzugen Sie die generische Form `screenshots/[^/]+/` in wiederverwendbaren Beispielen oder akzeptieren Sie, dass übersetzte Dokumente lokalspezifische Pfade in Abbildungen anzeigen.
