<a id="cli--models--languages"></a>
# CLI — Modelle und Sprachen

<a id="check-models"></a>
### `check-models`

**Zusammenfassung:** `ai-i18n-tools check-models`

Validiert jede konfigurierte Modell-ID anhand der `GET /models`-Liste des aktiven Anbieters (Mitgliedschaft und `expiration_date`). Erfordert den API-Schlüssel dieses Anbieters (keiner für schlüssellose Anbieter wie Ollama). Beendet sich mit einem Fehlercode ungleich Null, wenn eine konfigurierte ID fehlt oder abgelaufen ist, und berücksichtigt das aufgelöste Anforderungs-Timeout (`requestTimeout` oder `requestTimeoutMs` beim Anbieter, andernfalls den Wert der obersten Ebene). Wenn der Anbieter Preise zurückgibt (z. B. OpenRouter), werden auch USD pro 1 Million Tokens für Prompt/Completion angezeigt. Wenn `providers.cheaperinference.zeroDataRetention` wahr ist, verwendet die Überprüfung `GET /v1/models?zdr=true` und schlägt eine ID fehl, die der Katalog weglässt.

**Siehe auch:** [KI-Modelle](/de/guide/ai-models#check-models), [LLM-Anbieter](/de/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Zusammenfassung:** `ai-i18n-tools list-models`

Listet jedes Modell auf, das der aktive Anbieter über seine `GET /models`-Liste bewirbt (sortiert nach ID; der aktive Anbieter folgt dem Konfigurationsschlüssel `provider`, Überschreibung mit `-P` / `--provider`). Erfordert den API-Schlüssel dieses Anbieters (keiner für schlüssellose Anbieter wie Ollama). Wenn der Anbieter Preise zurückgibt (z. B. OpenRouter), werden auch USD pro 1 Million Tokens für Prompt/Completion angezeigt und Einträge markiert, die `expiration_date` überschreiten. Wenn `providers.cheaperinference.zeroDataRetention` wahr ist, ist die Liste `GET /v1/models?zdr=true`.

**Schlüsseloptionen:** `-P` / `--provider`

**Siehe auch:** [KI-Modelle](/de/guide/ai-models#list-models), [LLM-Anbieter](/de/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**Synopsis:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

Stufen Sie die Chat-Modelle des aktiven Anbieters ein und geben Sie die besten (Standard 8) aus. Die Tabellenspalten sind der Reihe nach: Rang, Modell-ID, Index (der gewichtete Score mal 100, eine Dezimalstelle), gemessener Languagebench ChrF, gemessener Arena Score sowie Eingabe- und Ausgabepreis in USD pro 1 Mio. Tokens. Eine fehlende Messung ist `—`. Der Befehl benötigt den API-Schlüssel dieses Anbieters (keinen für Anbieter ohne API-Schlüssel wie Ollama). Der aktive Anbieter folgt der Konfiguration `provider`; überschreiben Sie diese mit `-P` / `--provider`.

Kandidaten stammen aus der `GET /models`-Liste des Anbieters. Wenn `providers.cheaperinference.zeroDataRetention` wahr ist, ist diese Anforderung `GET /v1/models?zdr=true`. Abgelaufene Zeilen und Nicht-Chat-Zeilen (Embeddings, Sprache, Bild, Video, Moderation, Reranker) werden weggelassen. Wenn diese Kataloganforderung fehlschlägt, beendet sich der Befehl mit dem Exit-Code 1.

`--quality` ist der Standardwert. Er gewichtet ChrF und Arena Score höher als den Preis. `--price` gewichtet den Preis höher als diese Scores und behält dennoch eine Qualitätsuntergrenze bei, sodass ein ungemessenes günstiges Modell nicht in der Liste nach oben springt. Die Angabe beider Flags ist ein Fehler. Wenn keines angegeben wird, gilt die Qualität. Optionale `modelSuggestion`-Gewichtungen in der Konfiguration ersetzen jedes Profil. Siehe [Konfiguration](/de/reference/configuration#modelsuggestion-optional). Dieselben Gewichtungen werden vom [Dashboard-Tab „Modelle“](/de/guide/translation-dashboard/models) verwendet.

ChrF ist der Mittelwert der languagebench-Zeilen `translation_from` und `translation_to`, deren Metrik `chrf` ist, begrenzt auf `sourceLocale` und `targetLocales` dieses Projekts. Gebietsschemata werden auf einen languagebench-Sprachcode abgebildet (das primäre Subtag, mit einigen Aliasen wie `pt-BR` zu `pt` und `zh-Hant` zu `zh` und `yue`). Ein leeres Set verwendet `en`. Arena ist der gesamte Arena Score der LMArena, nicht Elo. Der Ranking-Preis ist `(3 × input + output) / 4` USD pro 1 Mio. Token. Die Preisquelle ist eine Katalograte ungleich Null, dann die Eingabe- und Ausgaberaten von models.dev, dann der einzelne Kostenwert von languagebench. Ein Katalogpreis von `0` bedeutet „kein Preis“, nicht „kostenlos“. Ein unbekannter Preis ist neutral im Qualitätsprofil und am schlechtesten im Preisprofil. Ein fehlender ChrF sortiert unterhalb der Qualitätsuntergrenze. Die `0.35` und `0.45` Platzhalter, die für einen fehlenden ChrF oder Arena verwendet werden, beeinflussen nur den Index; die Tabelle gibt stattdessen `—` aus.

Zeilen, die die Untergrenze überschreiten, stehen an erster Stelle, dann ein höherer Index, dann ein günstigerer Mischpreis. `--top` (Standard `8`, eine Ganzzahl von mindestens 1) begrenzt die Tabelle, das Fragment `--json` und `--apply` zusammen, nach den unten stehenden Filtern.

`--list` gibt dieselben Spalten für die konfigurierten `translationModels` des aktiven Providers in dieser Reihenfolge aus und ignoriert `--top`. Die Rangspalte ist weiterhin der Platz jedes Modells im Gesamtranking. Eine konfigurierte ID, die im Katalog fehlt, abgelaufen ist oder kein Chat-Modell ist, wird weiterhin mit `—` für Messwerte aufgelistet. `--list` kann nicht mit `--apply` kombiniert werden.

`--max-output-price` behält Modelle bei, deren Ausgabepreis pro 1 Mio. Token kleiner oder gleich diesem USD-Betrag ist. Ein Modell ohne Ausgabepreis wird ausgeschlossen. `--min-delta` geht dann die verbleibenden Zeilen durch und behält ein Modell nur bei, wenn sein Index mindestens um diesen Wert unter dem vorherigen beibehaltenen Modell liegt. Das erste verbleibende Modell wird immer beibehalten. Ein Delta von `0` verwirft keine Zeilen. Zeilen ohne Index werden ausgeschlossen, wenn das Delta größer als `0` ist. Die Rangnummern bleiben die aus der vollständigen Liste. Mit `--list` folgt der Durchlauf der `translationModels`-Reihenfolge. Beide Filter gelten auch für `--json` und `--apply`. Der [Tab „Modelle“](/de/guide/translation-dashboard/models) verfügt über dieselben zwei Steuerelemente.

`--json` schreibt dieses Objekt in stdout (fügen Sie es in den Provider-Block ein) und sendet die Tabelle sowie die Attributions-Fußzeile an stderr:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` kopiert die aktuelle Konfiguration in eine gleichgeordnete `ai-i18n-tools.config.{timestamp}.backup.json` (oder `{name}.{timestamp}.backup.json`, wenn `-c` eine andere Datei benennt) und ersetzt dann `providers.<active>.translationModels` durch diese IDs. Eine Namenskollision fügt `-2`, `-3` und so weiter vor `.backup.json` hinzu. Wenn das Kopieren fehlschlägt, bleibt die Konfigurationsdatei unverändert. `uiModels` und `localeModels` bleiben unverändert. Scores werden nicht in die Konfigurationsdatei geschrieben. Die Schaltfläche **Konfiguration aktualisieren** des Dashboards schreibt dasselbe Backup.

Benchmark-Daten werden unter `<cacheDir>/benchmark-scores.json` (üblicherweise `.translation-cache/benchmark-scores.json`) für 7 Tage zwischengespeichert. Die Rohdatensätze werden zur Laufzeit heruntergeladen und sind nicht im Paket enthalten. `--refresh` lädt languagebench, Arena und models.dev erneut herunter. Eine Quelle, die während `--refresh` fehlschlägt, wird nicht aus dem vorherigen Cache aufgefüllt. Ohne `--refresh` verwendet ein fehlgeschlagener Download den zwischengespeicherten Ausschnitt. Wenn entweder languagebench oder Arena fehlschlägt, führt der Befehl die Rangfolge mit der anderen Quelle durch und gibt an, welche Quelle fehlgeschlagen ist. Wenn beide fehlschlagen, wird der Prozess mit Exit-Code 1 beendet. Ein Fehler bei models.dev belässt die Katalogpreise unverändert. Das Dashboard verfügt über keine Aktualisierungssteuerung; führen Sie `--refresh` über die CLI aus und laden Sie anschließend den Tab „Models“ neu.

Die Fußzeile nennt languagebench (CC BY-SA 4.0), den LMArena Arena Score (CC BY 4.0) und models.dev (MIT).

**Wichtige Optionen:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**Siehe auch:** [KI-Modelle](/de/guide/ai-models), [Registerkarte „Modelle“](/de/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**Zusammenfassung:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Benchmarkt jedes konfigurierte Modell, indem es eine Probe in Isolation übersetzt (Single-Modell-Client, keine Fallback-Kette). Gibt eine Tabelle mit Modell-ID, Eingabe-/Ausgabetoken, Wanduhr-Übersetzungszeit und USD-Kosten aus (`—` für Provider, die keine Kosten melden), sowie eine Zeile mit den Gesamtwerten und pro-Modell-Fehlern.

Modelle standardmäßig auf die Vereinigung der `translationModels`-, `uiModels`- und `localeModels`-IDs des aktiven Providers (Überschreiben mit `--model`); die Probe standardmäßig auf einen eingebauten englischen Markdown-Block (Überschreiben mit `--text` / `--file`); Quelle/Ziel standardmäßig auf die Konfiguration `sourceLocale` und die erste `docs[]`-Ziel-Lokale, Fallback auf die oberste Ebene `targetLocales` (Überschreiben mit `--source` / `--target`). Führt Modelle parallel aus, begrenzt durch die Konfiguration `concurrency` (Standard 4); jedes Modell wird dennoch individuell zeitlich bemessen. Erfordert den API-Schlüssel des aktiven Providers.

**Schlüsseloptionen:** `--model`, `--text`, `--file`, `--source`, `--target`

**Siehe auch:** [KI-Modelle](/de/guide/ai-models#bench-models)

---

<a id="list-languages"></a>
### `list-languages`

**Zusammenfassung:** `ai-i18n-tools list-languages [search]`

Listet den mitgelieferten UI-Sprachenkatalog (`data/ui-languages-complete.json`) als lesbare Tabelle (Code, Textrichtung, englischer Name, natürlicher Name) auf. Benötigt keine Konfiguration oder API-Schlüssel. Optional kann ein `search`-Term übergeben werden, um nur Einträge zu behalten, deren Code, natürlicher Name, englischer Name oder Richtung ihn enthalten (groß-/kleinschreibungsunabhängig), z. B. `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
