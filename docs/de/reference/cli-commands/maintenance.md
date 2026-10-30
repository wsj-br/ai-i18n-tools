<a id="cli--cache-maintenance"></a>
# CLI — Cache-Wartung

<a id="cleanup"></a>
### `cleanup`

**Zusammenfassung:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Leert die gesamte `markdown_source_issues`-Tabelle und führt dann `sync --force-update` aus (Extraktion, UI, SVG, Dokumente und `translate-json`, wenn aktiviert), sodass Markdown-Probleme für die aktuell konfigurierten Dokumente neu befüllt werden. Anschließend:

- entfernt veraltete Segmentzeilen (null `last_hit_at` / leerer Dateipfad);
- löscht `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf der Festplatte fehlt;
- entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen;
- bereinigt verwaiste `translation_failures`-Zeilen;
- löscht Cache-Zeilen für Lokalisierungen, die nicht in der Konfiguration enthalten sind (`sourceLocale`, Stamm-`targetLocales` und alle pro Block `docs[]` / `json[]` `targetLocales`).

Nur Cache für ausgemusterte Lokalisierungen – generierte Dokumente, flache UI-Dateien und `strings.json`-Einträge bleiben unberührt (verwenden Sie [`purge-locale`](#purge-locale), um diese zu entfernen). Protokolliert die Bereinigungszählungen nach der Synchronisierung (veraltete Segmente, verwaiste `file_tracking`, verwaiste Übersetzungen, verwaiste Fehler, nicht konfigurierte Lokalisierungen) zuzüglich der anfänglichen Löschzählungen für Markdown-Probleme.

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

Löscht alle zwischengespeicherten Zeilen für die angegebene(n) Lokalisierung(en) aus `translations`, `file_tracking` und `translation_failures`, sowie die generierten Artefakte für diese Lokalisierung: übersetzte Dokumente (`.md` / `.mdx` / `.astro`-Ausgaben, die aus `docs[]` aufgelöst wurden, einschließlich verwaister Ausgaben, deren Quelle entfernt wurde – gefunden durch Durchsuchen des Ausgabebaums jedes Blocks, außer wenn ein benutzerdefiniertes `pathTemplate` konfiguriert ist), die pro Lokalisierung flache UI-Datei (`<flatOutputDir>/<locale>.json`) und die Einträge der Lokalisierung in `strings.json`.

Lokalisierungen werden über wiederholbare `-l` / `--locale` übergeben (auf BCP-47 normalisiert). Gibt Zählungen pro Lokalisierung aus (Cache-Zeilen, Dokumente, `strings.json`-Einträge, flache Datei); warnt (führt nicht zu einem Fehler) für Lokalisierungen, bei denen nichts zu bereinigen ist. Fordert zur Bestätigung auf, es sei denn `-y` / `--yes` / `-f` / `--force`. `--dry-run`: Meldet Zählungen und die Dateien, die entfernt würden, löscht aber nichts. `--keep-files`: Bereinigt nur den SQLite-Cache und lässt generierte Dateien und `strings.json` unberührt. Es wird kein SQLite-Backup erstellt, es sei denn, `--backup <path>` wird übergeben, wodurch ein Backup in diesen Pfad geschrieben wird, bevor die Löschung erfolgt.

**Schlüsseloptionen:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
