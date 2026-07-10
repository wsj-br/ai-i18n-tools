<a id="cli--cache--maintenance"></a>
# CLI – Cache & Wartung

<a id="cleanup"></a>
### `cleanup`

**Zusammenfassung:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Löscht die gesamte `markdown_source_issues`-Tabelle, führt dann `sync --force-update` (Extrahieren, Benutzeroberfläche, SVG, Dokumente und `translate-json` wenn aktiviert) aus, damit Markdown-Probleme für die derzeit konfigurierten Dokumente neu bevölkert werden; entfernt dann veraltete Segmentzeilen (null `last_hit_at` / leerer Dateipfad); entfernt `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf der Festplatte fehlt; entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen; beschneidet verwaiste `translation_failures`-Zeilen. Protokolliert vier Beschneidezahlen nach der Synchronisierung (veraltete Segmente, verwaiste `file_tracking`, verwaiste Übersetzungen, verwaiste Fehler) sowie die vorherige Markdown-Probleme-Löschzählung.

**Schlüsseloptionen:** `--dry-run`, `--backup`

`--backup <path>` schreibt eine SQLite-Sicherungskopie an diesen Pfad, bevor Änderungen vorgenommen werden (keine Sicherung, es sei denn, diese Option ist festgelegt).

---

<a id="clean-temp"></a>
### `clean-temp`

**Zusammenfassung:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

Keine Konfiguration. Durchläuft einen Verzeichnisbaum (Standard: aktuelles Verzeichnis) nach `*.log`, `*.tmp` und `cache.db.backup*.sqlite`, gibt `./…`-Pfade wie `find -print` aus. Mit Übereinstimmungen: fordert `Delete these files? (y/n)` auf, es sei denn, `-f` / `--force` (löschen ohne Aufforderung). Ohne Übereinstimmungen: beendet ohne Aufforderung. `--dry-run`: nur Auflisten, keine Aufforderung oder Löschung (überschreibt `--force`).

**Schlüsseloptionen:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**Zusammenfassung:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

Löscht alle zwischengespeicherten Zeilen für die angegebenen Sprachregionen aus `translations`, `file_tracking` und `translation_failures` und die generierten Artefakte für diese Sprachregion: übersetzte Dokumente (`.md` / `.mdx` / `.astro`-Ausgaben, die aus `docs[]` aufgelöst werden, einschließlich verwaister Ausgaben, deren Quelle entfernt wurde – gefunden durch das Durchlaufen jedes Blockausgabebaums, außer wenn eine benutzerdefinierte `pathTemplate` konfiguriert ist), die pro-Sprachregion-Flachdatei der Benutzeroberfläche (`<flatOutputDir>/<locale>.json`) und die Einträge der Sprachregion in `strings.json`.

Sprachregionen werden über wiederholbare `-l` / `--locale` (normalisiert auf BCP-47) übergeben. Gibt pro-Sprachregion-Zählungen (Zwischenspeicherzeilen, Dokumente, `strings.json`-Einträge, Flachdatei) aus; warnt (fehlt nicht) für Sprachregionen, für die nichts zu bereinigen ist. Fordert zur Bestätigung auf, es sei denn, `-y` / `--yes` / `-f` / `--force`. `--dry-run`: Zählungen und Dateien, die entfernt werden, melden, nichts löschen. `--keep-files`: nur den SQLite-Zwischenspeicher bereinigen, generierte Dateien und `strings.json` unberührt lassen. Es wird keine SQLite-Sicherungskopie erstellt, es sei denn, `--backup <path>` wird übergeben, die eine Sicherungskopie an diesem Pfad vor der Löschung schreibt.

**Schlüsseloptionen:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
