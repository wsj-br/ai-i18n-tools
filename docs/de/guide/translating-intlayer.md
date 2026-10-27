<a id="translating-intlayer"></a>
# Intlayer an Ort und Stelle übersetzen

[Intlayer](https://intlayer.org/) ist eine gute Lösung für Anwendungen, die Übersetzungen in typisierten Content-Wörterbüchern speichern oder ein Übersetzungsmanagement-System und menschliche Übersetzung verwenden. `translate-intlayer` richtet sich an dieses Publikum. Es füllt die fehlenden und veralteten Locale-Blätter in Ihren `*.content.ts`-Wörterbüchern direkt auf. Die Wörterbücher bleiben die maßgebliche Quelle, Intlayer bleibt zur Laufzeit aktiv, und ai-i18n-tools fungiert als Übersetzungs-Engine (Anbieterauswahl, Glossar, Übersetzungskontext und Modell-Fallback).

<a id="which-one"></a>
## Intlayer beibehalten oder zu Source-String-Aufrufen wechseln?

| Ihr Publikum | Befehl | Anleitung |
| --- | --- | --- |
| Typisierte Content-Wörterbücher, ein Übersetzungsmanagement-System oder menschliche Übersetzung. Intlayer bleibt zur Laufzeit aktiv. | `translate-intlayer` | diese Seite |
| Source-String-Aufrufe, `t('…')`, wobei der Quellsprachentext zusammen mit dem Code, der ihn verwendet, gespeichert wird. Die Quellsprache kann jede beliebige Sprache sein. | `migrate-intlayer` | [Migration von Intlayer zu Source-String-Aufrufen](/de/guide/migrating-from-intlayer) |

`translate-intlayer` ist eine fortlaufende Aufgabe, die Sie immer dann erneut ausführen, wenn Sie Quell-Strings hinzufügen oder bestehende bearbeiten. `migrate-intlayer` ist ein einmaliger Umstieg für das andere Publikum. Jeder umgeschriebene Aufruf führt den Quellsprachen-String zusammen mit dem Code, der ihn verwendet, was die Wartung vereinfacht und die Komplexität dieses Codes reduziert. Diese Sprache ist `sourceLocale` und kann jede beliebige Sprache sein.

<a id="what-translate-intlayer-does"></a>
## Was `translate-intlayer` leistet

1. Analysiert `*.content.ts` Standard-Exporte und sammelt jedes `t({ locale: '…' })`-Blatt. Locale-Werte können einfache Strings oder Intlayer `insert('…')` Einfüge-Knoten sein.
2. Initialisiert den `ui.stringsJson` des UI-Blocks mit dem Quelltext und führt dann dieselbe Engine wie [`translate-ui`](/de/reference/cli-commands/ui-strings#translate-ui) für die fehlenden und veralteten Locales aus.
3. Schreibt die neuen pro-Locale-Strings zurück in jedes `t({ … })`-Objekt. Bearbeitungen sind punktuell: Nur die fehlenden oder veralteten Locale-Zeilen ändern sich, sodass Ihre Formatierung, Schlüsselreihenfolge und Kommentare erhalten bleiben. Bestehende Übersetzungen bleiben unverändert. Wenn ein Blatt `insert('…')` verwendet, werden neue Locale-Werte ebenfalls in `insert(…)` eingeschlossen, damit das Blatt zur Laufzeit aufrufbar bleibt.
4. Platzhalter werden beibehalten. Die Intlayer-Einfügesyntax <code v-pre>{{token}}</code> wird unverändert durchgereicht. Platzhalter mit einfacher Klammer `{token}` werden ebenfalls unterstützt: Sie werden zu <code v-pre>{{token}}</code> für die Übersetzung und kehren beim Schreiben zu `{token}` zurück.
5. Trockenlauf mit `--dry-run`: Es meldet die Anzahl der fehlenden/veralteten Einträge, ohne ein LLM aufzurufen oder etwas zu schreiben.

<a id="missing-vs-stale"></a>
## Fehlend vs. veraltet

Ein Blatt + Locale wird übersetzt, wenn entweder:

- Die Locale im Blatt fehlt (fehlend), oder
- Der Quell-Locale-Text sich seit dem letzten Lauf für diese Locale geändert hat (veraltet). Die Quellsprache ist `sourceLocale` und kann jede beliebige Sprache sein.

Veralterung wird pro Blatt in `cacheDir` verfolgt, sodass das Bearbeiten eines englischen Strings nur dieses Blatt beim nächsten Lauf neu übersetzt; alles andere bleibt im Cache. Eine Übersetzung, die bereits beim allerersten Lauf veraltet war, wird als aktuell akzeptiert – nur spätere Bearbeitungen markieren sie als veraltet.

<a id="translate-your-project"></a>
## Ihr Projekt übersetzen

1. Installieren Sie `ai-i18n-tools` (siehe [Installation](/de/guide/installation)). Falls Ihr Projekt noch keine `ai-i18n-tools.config.json` besitzt, erstellen Sie eine:

   ```bash
   ai-i18n-tools init -P gemini
   ```

Setzen Sie `sourceLocale` und `targetLocales` auf die Locales, die Ihre Wörterbücher verwenden, und verweisen Sie `ui.sourceRoots`, `ui.stringsJson` und `ui.flatOutputDir` auf Ihre Quelle und einen Katalogpfad – die gleichen Schlüssel, die `translate-ui` verwendet, siehe [UI-Strings — Schritt 1: Initialisieren](/de/guide/ui-strings/#step-1-initialise). Der Katalog kann in einem temporären Verzeichnis (z. B. `.i18n/`) liegen; er wird als Übersetzungs-Cache verwendet und Sie bearbeiten ihn niemals manuell.
2. Führen Sie zuerst einen Trockenlauf durch, um zu sehen, was gefüllt würde:

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. Wenden Sie es an (benötigt einen Anbieter-API-Schlüssel):

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. Führen Sie es erneut aus, wann immer Sie einen neuen String hinzufügen oder einen englischen bearbeiten. Nur die neuen oder geänderten Blätter werden übersetzt. Begrenzen Sie einen Lauf bei Bedarf mit `-l de,fr` oder `--ui-block`.

<a id="run-the-example"></a>
## Beispiel ausführen

Das Beispiel [intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) ist eine kleine Vite + React-App, deren Wörterbücher mit Englisch und brasilianischem Portugiesisch ausgeliefert werden; Spanisch und vereinfachtes Chinesisch fehlen absichtlich. `pristine/` ist eine schreibgeschützte Referenz; `src/` ist die Arbeitskopie. `pnpm reset` versetzt `src/` in diesen Ausgangszustand zurück (und löscht den Katalog und den Cache), damit Sie die Übung wiederholen können.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev` startet die App auf [http://localhost:3093](http://localhost:3093). Wechseln Sie das Gebietsschema vor der Übersetzung zu `es` oder `zh-Hans`, und die Zeichenketten fallen auf Englisch zurück; nach `pnpm translate` erscheinen die ausgefüllten Übersetzungen. Bearbeiten Sie eine englische Zeichenkette und führen Sie `pnpm translate` erneut aus, um nur diese Blattaktualisierung zu sehen.

Ausführliche Anleitung: [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md).

<a id="command"></a>
## Befehl

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

Erfordert `features.translateUIStrings` und die `ui.stringsJson` des UI-Blocks (identisch mit `translate-ui`). `--dry-run` ruft kein LLM auf.

| Option | Bedeutung |
| --- | --- |
| `[paths...]` | Zu scannende Dateien/Verzeichnisse/Globs (Standard: `ui.sourceRoots`) |
| `-l`, `--locale <codes>` | Kommagetrennte Ziel-Gebietsschemas zum Ausfüllen (Standard: die `targetLocales` des Blocks) |
| `--ui-block <selector>` | UI-Block: nullbasierter Index, Beschreibung oder `stringsJson`-Pfad (Standard: Block 0) |
| `--dry-run` | Nur fehlende/veraltete Zählungen melden; kein LLM-Aufruf, keine Schreibvorgänge |
| `-j`, `--concurrency <n>` | Maximale parallele Ziel-Gebietsschemas (Standard: Konfiguration `concurrency` oder 4) |

**Siehe auch:** [CLI – UI-Zeichenketten](/de/reference/cli-commands/ui-strings#translate-intlayer), [Migration von Intlayer zu Quellzeichenketten-Aufrufen](/de/guide/migrating-from-intlayer)
