<a id="svg-troubleshooting"></a>
# SVG-Fehlerbehebung

Siehe auch [Fehlerbehebung bei Bildern und Screenshots](/de/guide/images-and-screenshots/troubleshooting).

- **SVG-Quellen und -Ausgaben im selben Verzeichnis** – halten Sie `svg.sourcePath` und `svg.outputDir` getrennt.
- **Absolute Docusaurus-statische URLs für kollokierte SVGs** – verwenden Sie von Anfang an relative `../assets/`-Pfade.
- **Unerwartetes schließendes Tag `text` vs. `g` nach der Übersetzung** – Inkscape gibt oft leere, selbstschließende `<text … />` neben echten Labels aus. Ältere Extraktor-Regexes überspannten diese bis zum nächsten `</text>` und schrieben einen verirrten Schließer. Aktualisieren und führen Sie `translate-svg` (oder `sync`) erneut aus, um die lokale SVG neu zu generieren.
- **Romanisierte oder nur lateinische Beschriftungen in Hindi-, Arabisch-, CJK- oder Kyrillisch-SVGs** – es gilt dieselbe Schreibsystemrichtlinie wie für Dokumente; Cache-Zeilen mit falschem Skript werden beim nächsten `translate-svg` / `sync` abgelehnt. Führen Sie den Befehl mit globalem `--debug-failed` erneut aus, um ein `FAILED-TRANSLATION`-Protokoll unter `cacheDir` für **jedes** verworfene Modell (Eingabeaufforderung, Rohausgabe, Skriptfehler) zu schreiben, nicht nur, wenn jedes Modell fehlschlägt. Siehe [Hindi-, Arabisch-, CJK- oder Kyrillisch-Ausgabe ist romanisiert](/de/guide/documents/troubleshooting#wrong-script-or-romanized-output).
