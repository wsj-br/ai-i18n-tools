<a id="migrating-from-intlayer"></a>
# Migration von Intlayer

Wechseln Sie von [Intlayer](https://intlayer.org/)? Dieser Befehl überführt Ihre vorhandenen Übersetzungswörterbücher und die grundlegende Übersetzungsverwendung in Ihrer App in ai-i18n-tools. Er führt automatisch sichere Aktualisierungen durch und erstellt anschließend einen übersichtlichen Bericht für alles, was noch Ihre Aufmerksamkeit erfordert. Dies ermöglicht Ihnen einen schrittweisen Umstieg, ohne dass Sie vorab alle Unterschiede kennen müssen.

Verwenden Sie bereits i18next-JSON-Übersetzungsdateien? Dann benötigen Sie diesen Migrationsbefehl nicht; verwenden Sie stattdessen die [JSON-Pipeline](/de/guide/json#i18next-namespace-files).

<a id="what-migrate-intlayer-does"></a>
## Was `migrate-intlayer` macht

1. Parst `*.content.ts` Standard-Exports (`key` + `content` + `t({ locale: '…' })` Blätter).
2. Befüllt `ui.stringsJson` und Locale-Dateien unter `ui.flatOutputDir` mit dem Text der Quellsprache und allen bereits im Wörterbuch vorhandenen Übersetzungen. Importierte Zeilen haben kein `models`-Feld (sie wurden bei diesem Durchlauf nicht maschinell übersetzt).
3. Schreibt **sichere** Aufrufstellen um:
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. Lässt alles andere (dynamische Schlüssel, JSX-Spreads, verkettete `.replace().replace()`, Destructuring) unverändert. Der Bericht listet jede dieser Stellen mit dem genauen Ausdruck, einer konkreten `t()`- oder JSX-Ersetzung und der hinzuzufügenden `import { t } from '…';`-Zeile auf.
5. Standardmäßig ein Dry-Run. Übergeben Sie `--write`, um die Katalog-Initialisierung und sichere Umschreibungen anzuwenden. Der Bericht wird immer geschrieben. Er listet auch Wörterbuchdateien und die verbleibende Verwendung von `useIntlayer` / `IntlayerProvider` auf, die nach den manuellen Umschreibungen gelöscht werden müssen, Katalogschlüssel, die noch `extract` und dann `translate-ui` benötigen, sowie ein Runtime-Bootstrap zum Einfügen in das i18n-Modul der App.

<a id="migrate-your-project"></a>
## Projekt migrieren

1. Installieren Sie `ai-i18n-tools` (siehe [Installation](/de/guide/installation)). Falls Ihr Projekt noch keine `ai-i18n-tools.config.json` besitzt, erstellen Sie eine:

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

Passen Sie `sourceLocale` und `targetLocales` an die Locales an, die bereits in Ihren Intlayer-Wörterbüchern vorhanden sind, und legen Sie `ui.sourceRoots`, `ui.stringsJson` und `ui.flatOutputDir` so fest, dass sie auf die Quell- und gewünschten Katalogpfade Ihrer App verweisen — dieselben Schlüssel, die `translate-ui` verwendet, siehe [UI-Strings — Schritt 1: Initialisieren](/de/guide/ui-strings/#step-1-initialise).
2. Zunächst ein Probelauf: `ai-i18n-tools migrate-intlayer` (ohne `--write`). Lesen Sie `migrate-intlayer-report.md`, um zu sehen, was gefunden wird und welche Aufrufstellen vor etwaigen Dateiänderungen einer manuellen Überprüfung bedürfen.
3. Führen Sie `ai-i18n-tools migrate-intlayer --write` aus, um `ui.stringsJson` / `ui.flatOutputDir` zu befüllen und die unbedenklichen Aufrufstellen umzuschreiben.
4. Übergeben Sie den neu generierten Bericht `migrate-intlayer-report.md` an einen KI-Coding-Agenten (empfohlen) oder arbeiten Sie ihn selbst ab, indem Sie diesen Schritten folgen:

- Der Bericht endet mit einem **Schritt-für-Schritt-TODO**: Schließen Sie die Bearbeitung jeder manuell zu prüfenden Aufrufstelle mit dem dort gezeigten konkreten `t('…')`/JSX ab, fügen Sie die `import { t } from '…';`-Zeile hinzu und löschen Sie dann die übrig gebliebenen `*.content.ts`-Dateien sowie die im Bericht aufgelistete Verwendung von `useIntlayer` / `IntlayerProvider`.
   - Überschreiben Sie das i18n-Modul Ihrer App mit dem Runtime-Bootstrap aus dem Bericht. Rufen Sie in der Locale-Steuerung `loadLocale(next)` und dann `i18n.changeLanguage(next)` auf — `loadLocale` registriert nur das Flat-Bundle und wechselt nicht die aktive Sprache.
   - Führen Sie `ai-i18n-tools extract` und dann `ai-i18n-tools translate-ui` (oder `sync`) für alle Quellstrings aus, die im Bericht als neu markiert sind. `extract` schreibt auch `ui-languages.json`, was vom Bootstrap importiert wird; führen Sie es also vor dem Starten der App aus, selbst wenn kein neuer String hinzugefügt wurde. Bearbeiten Sie `strings.json`, die flachen Locale-Dateien oder `ui-languages.json` nicht manuell — diese Befehle verwalten sie.
   - Sobald die Cleanup-Liste des Berichts abgearbeitet ist und die App auf ai-i18n-tools läuft, entfernen Sie die `intlayer`- / `react-intlayer`-Abhängigkeiten und die Wörterbuchdateien.

<a id="run-the-example"></a>
## Beispiel ausführen

Die obigen Schritte gelten für jedes Intlayer-Projekt. Das Beispiel [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) führt sie an einer kleinen Vite + React-App mit einfachen (automatisch umschreibbaren) und komplexen (manuell zu überprüfenden) Fällen durch, sodass Sie den Bericht und den Runtime-Bootstrap sehen können, bevor Sie es mit Ihrem eigenen Code versuchen. `intlayer-pristine/` wird niemals geändert; `src/` ist die Arbeitskopie.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

Übergeben Sie `migrate-intlayer-report.md` an einen KI-Coding-Agenten (oder bearbeiten Sie die markierten Dateien selbst). Der Bericht enthält das Runtime-Modul zum Einfügen in `src/i18n.ts`. Rufen Sie in der Locale-Steuerung `loadLocale(next)` und dann `i18n.changeLanguage(next)` auf. `loadLocale` registriert nur das Flat-Bundle.

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` führt zuerst `extract` aus, wodurch `ui-languages.json` erstellt wird. Der Bootstrap importiert diese Datei, starten Sie die App daher erst nach der Extraktion. Bearbeiten Sie `strings.json`, die flachen Locale-Dateien oder `ui-languages.json` nicht manuell.

`pnpm reset` kopiert `intlayer-pristine/` zurück über `src/` und löscht generierte Kataloge, damit Sie von vorne beginnen können.

Vollständige Anleitung: [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md).

<a id="command"></a>
## Befehl

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

Erfordert `ui.stringsJson` und `ui.flatOutputDir` in der Konfiguration (wie `translate-ui`). Ruft kein LLM auf.

| Option | Bedeutung |
| --- | --- |
| `[paths...]` | Zu scannende Dateien/Verzeichnisse/Globs (Standard: `ui.sourceRoots`) |
| `--write` | Katalog füllen und sichere Aufrufstellen umschreiben (Standard: Trockenlauf) |
| `--report <path>` | Berichtspfad (Standard: `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | Wörterbuch-Dateinamen-Glob (Standard: `**/*.content.ts`) |
| `--t-import <specifier>` | Import-Spezifizierer für generiertes `t()` (Standard: relatives `./i18n`, falls `src/i18n.ts` existiert, ansonsten `i18next`) |

Nach `--write` schließen Sie die manuelle Überprüfung der im Bericht aufgeführten Sites ab, löschen Sie die ungenutzten `*.content.ts`-Dateien und den im Bericht aufgelisteten `IntlayerProvider`-Wrapper, fügen Sie den Runtime-Bootstrap ein und rufen Sie `i18n.changeLanguage` aus der Locale-Steuerung auf. Führen Sie `extract` und anschließend `translate-ui` (oder `sync`) für die Quellstrings aus, die im Bericht als neu markiert sind. `extract` erstellt zudem `ui-languages.json`, die vom Bootstrap importiert wird. Bearbeiten Sie `strings.json`, die flachen Locale-Dateien oder `ui-languages.json` nicht manuell.

**Siehe auch:** [CLI – UI-Zeichenfolgen](/de/reference/cli-commands/ui-strings#migrate-intlayer), [i18next verdrahten](/de/guide/ui-strings/i18next-runtime)
