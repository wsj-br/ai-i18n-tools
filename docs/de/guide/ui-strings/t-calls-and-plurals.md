<a id="t-calls--plurals"></a>
# t()-Aufrufe & Plurale

<a id="using-t-in-source-code"></a>
## Verwendung von `t()` im Quellcode

Rufen Sie `t()` mit einem **literalen String** auf, damit das Extraktionsskript es finden kann:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Das gleiche Muster funktioniert auch außerhalb von React (Node.js, Serverkomponenten, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regeln:**

- Nur diese Formen werden extrahiert: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- Der Schlüssel muss ein **literaler String** sein – keine Variablen oder Ausdrücke als Schlüssel.
- Verwenden Sie keine Template-Literale für den Schlüssel: <code>{'t(`Hello ${name}`)'}</code> ist nicht extrahierbar.

<a id="interpolation"></a>
## Interpolation

Verwenden Sie die native Interpolation des zweiten Arguments von i18next für <code v-pre>{{var}}</code>-Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Der extract-Befehl analysiert das **zweite Argument**, wenn es ein einfaches Objektliteral ist, und liest tooling-spezifische Flags wie `plurals: true` und `zeroDigit` (siehe **Kardinal-Plurale** unten). Für gewöhnliche Zeichenketten wird nur der Literal-Schlüssel zum Hashen verwendet; Interpolations-Optionen werden zur Laufzeit weiterhin an i18next übergeben.

Wenn Ihr Projekt ein benutzerdefiniertes Interpolationsdienstprogramm verwendet (z. B. Aufruf von `t('key')` und anschließendes Weiterleiten des Ergebnisses durch eine Vorlagenfunktion wie <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), macht `setupKeyAsDefaultT` (über `wrapI18nWithKeyTrim`) dies unnötig – es wendet die <code v-pre>{{var}}</code>-Interpolation an, selbst wenn das Quellgebiet den Rohschlüssel zurückgibt. Migrieren Sie Aufrufstellen zu <code v-pre>t('Hello {{name}}', { name })</code> und entfernen Sie das benutzerdefinierte Dienstprogramm.

<a id="cardinal-plurals-plurals-true"></a>
## Kardinalplurale (`plurals: true`)

**Sie schreiben Pluralformen nicht von Hand.** Schreiben Sie im Quellcode die Nachricht einmal und übergeben Sie zwei Dinge im zweiten Argument:

1. **`plurals: true`** – teilt extract und `translate-ui` mit, dass dieser Aufruf eine kardinale Pluralgruppe ist.
2. **`count`** – die Zahl, die i18next zur Laufzeit verwendet, um die richtige Form auszuwählen.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Das ist alles, was Sie an der Aufrufstelle benötigen. Sie definieren **nicht** `_zero`, `_one`, `_other` oder andere Suffixschlüssel selbst.

Wenn Sie `translate-ui` ausführen, **ruft ai-i18n-tools ein LLM auf**, um jede erforderliche Kardinalkategorie für jedes Zielgebiet zu generieren (`zero`, `one`, `two`, `few`, `many`, `other` – welche auch immer `Intl.PluralRules` für diese Sprache benötigt). Das Modell erhält Ihr ursprüngliches Literal plus die Pluralvarianten der Ausgangssprache und gibt dann die übersetzten Formen zurück. Das Tooling schreibt diese in `strings.json` und gibt flaches i18next-JSON aus (`<groupId>_zero`, `<groupId>_one`, …), sodass die Pluralauflösung zur Laufzeit ohne zusätzliche Einrichtung auf Ihrer Seite funktioniert.

- `zeroDigit` (optional) – nur für Tooling; wird **nicht** von i18next gelesen. Wenn `true`, bevorzugt die LLM-Eingabeaufforderung ein wörtliches arabisches `0` im `_zero`-String für jedes Gebietsschema, in dem diese Form existiert; wenn `false` oder weggelassen, wird eine natürliche Nullformulierung verwendet. Entfernen Sie diese Schlüssel, bevor Sie `i18next.t` aufrufen (siehe `wrapT` unten).

**Validierung:** Wenn die Nachricht **zwei oder mehr** unterschiedliche <code v-pre>{{…}}</code> Platzhalter enthält, **muss einer von ihnen** <code v-pre>{{count}}</code> sein (die plurale Achse). Andernfalls schlägt `extract` **fehl** mit einer klaren Datei-/Zeilenmeldung.

**Zwei unabhängige Zahlen** (z. B. Abschnitte und Seiten) können nicht dieselbe Pluralnachricht teilen – verwenden Sie **zwei** `t()`-Aufrufe (jeweils mit `plurals: true` und eigenem `count`) und verketten Sie diese in der Benutzeroberfläche.

**Nicht in v1 enthalten:** Ordinale Plurale (`_ordinal_*`, `ordinal: true`), Intervall-Plurale, ausschließlich ICU-Pipelines.

<a id="how-plurals-are-stored-and-emitted"></a>
## Wie Plurale gespeichert und ausgegeben werden

**In** `strings.json` verwenden Pluralgruppen **eine Zeile pro Hash** mit `"plural": true`, dem ursprünglichen Literal in `source` und `translated[locale]` als Objekt, das Kardinalkategorien (`zero`, `one`, `two`, `few`, `many`, `other`) den entsprechenden Zeichenfolgen für das jeweilige Gebietsschema zuordnet.

**Flaches Gebietsschema-JSON:** Nicht-plurale Zeilen bleiben im Format **Quellensatz → Übersetzung**. Plurale Zeilen werden als `<groupId>_original` (entspricht `source`, zur Referenz) und `<groupId>_<form>` für jedes Suffix ausgegeben, sodass i18next Plurale nativ auflösen kann. `translate-ui` schreibt außerdem `{sourceLocale}.json`, das **nur** Plural-Flachschlüssel enthält (laden Sie dieses Bundle für die Ausgangssprache, damit suffixed Schlüssel aufgelöst werden; einfache Zeichenketten verwenden weiterhin den Schlüssel als Standard). Für jedes Zielsprachgebiet werden die ausgegebenen Suffixschlüssel entsprechend `Intl.PluralRules` für dieses Gebietsschema (`requiredCldrPluralForms`) angepasst: Wenn `strings.json` eine Kategorie weggelassen hat, weil sie nach der Verdichtung mit einer anderen übereinstimmte (z. B. Arabisch `many` identisch mit `other`), schreibt `translate-ui` dennoch jedes erforderliche Suffix in die flache Datei, indem es von einem fallback-fähigen Geschwistersatz kopiert, sodass zur Laufzeit kein Schlüssel beim Abruf fehlt.

Laufzeit (`ai-i18n-tools/runtime`): **Rufen Sie** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` auf – es führt `wrapI18nWithKeyTrim` aus, registriert das optionale `translate-ui` `{sourceLocale}.json`-Pluralbündel und `wrapT` dann mit `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` entfernt `plurals` / `zeroDigit`, schreibt den Schlüssel bei Bedarf in die Gruppen-ID um und leitet `count` weiter (optional: wenn es einen einzelnen Nicht-<code v-pre>{{count}}</code>-Platzhalter gibt, wird `count` von dieser numerischen Option kopiert). Siehe [Wire i18next](/de/guide/ui-strings/i18next-runtime) und [Runtime helpers](/de/guide/runtime-helpers).
