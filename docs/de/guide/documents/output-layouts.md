<a id="output-layouts"></a>
# Ausgabe-Layouts

`docsOutput.style` steuert, wohin übersetzte Markdown-Dateien geschrieben werden. Verwenden Sie exakt die unten angegebenen Zeichenketten in `docs[].docsOutput.style` (Aliase sind voreingestellte Layouts, keine separaten Engines).

`docsOutput.style = "nested"` (Standard, wenn weggelassen) — spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — sprachpräfixierte Dokumentationsstruktur für statische Dokumentationsseiten. Dateien unter `docsRoot` werden nach `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` geschrieben. Pfade außerhalb von `docsRoot` fallen auf das verschachtelte Layout zurück. Legen Sie `docs[].docsOutput.docsRoot` auf Ihren englischen Quellstamm fest (z. B. `"docs"` oder `"src/content/docs"`). Wenn `docsOutput.style = "doc-system"`, müssen Sie `localeSubpath` explizit festlegen (verwenden Sie einen Alias unten für Voreinstellungen).

**Aliase** (gleicher Layout-Engine, voreingestellter `localeSubpath`):

- `docsOutput.style = "docusaurus"` – `localeSubpath` ist standardmäßig `docusaurus-plugin-content-docs/current` (Docusaurus i18n-Plugin-Layout).
- `docsOutput.style = "astro-starlight"` – `localeSubpath` ist standardmäßig `""` (übersetzte Seiten direkt unter `{outputDir}/{locale}/`, passend zu [Starlight](https://starlight.astro.build/guides/i18n/), wenn Englisch im Inhalts-Root liegt und `outputDir` gleich `docsRoot` ist).
- `docsOutput.style = "vitepress"` – gleiches Layout wie `doc-system` mit leerem `localeSubpath`; BCP-47-Gebietsschema-Ordnernamen bleiben erhalten (`localePathLowercase` ist standardmäßig `false`). Siehe [VitePress-Integration](/guide/vitepress-integration).

Docusaurus-Voreinstellung (primäre Dokumentationsseiten):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight-Voreinstellung (gleiche Blockstruktur, unterschiedliche Pfade):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress-Voreinstellung (Englisch im Inhalts-Root, Gebietsschema-Ordner neben der Quelle):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Optionale JSON-Bezeichnungen — Docusaurus-Shell-Zeichenketten aus `docusaurusCatalogDir` (nicht MDX-Textkörper):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight liefert UI-Zeichenketten für viele Sprachen; optionale benutzerdefinierte UI-Überschreibungen verwenden `src/content/i18n/en.json` mit `jsonPathTemplate: "{outputDir}/{locale}.json"` in einem separaten `docs[]`-Block, wenn nötig.

VitePress-Navigations-/Seitenleisten-/Fußzeilen-Strings sind nicht in Markdown – erstellen Sie `docs/.vitepress/i18n/theme.en.json` und übersetzen Sie mit JSON (`json[]`, `features.translateJson`). Siehe [VitePress-Integration](/guide/vitepress-integration).

`docsOutput.style = "flat"` — platziert übersetzte Dateien neben der Quelle mit einem Sprachsuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben, wenn `docsOutput.style = "flat"` (es sei denn, `rewriteRelativeLinks: false` oder ein benutzerdefiniertes `pathTemplate` ist gesetzt).

```text
docs/guide.md → i18n/guide.de.md
```

Für seitenübergreifende Ankerlinks in einem flachen Layout siehe [Ankerlinks](/guide/documents/anchor-links).

Für Screenshots und Raster-Assets auf übersetzten Seiten siehe [Bilder & Screenshots](/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` Platzhalter

Überschreiben Sie, wohin übersetzte Dateien geschrieben werden, indem Sie `docs[].docsOutput.pathTemplate` (Markdown und MDX) oder `jsonPathTemplate` (JSON-Label-Dateien) festlegen. Beide akzeptieren dieselben Platzhalter. Aufgelöste Pfade müssen innerhalb des `outputDir` dieses Blocks bleiben (die CLI lehnt Pfade ab, die diesen verlassen).

Wenn Sie eine benutzerdefinierte `pathTemplate` verwenden, ist `rewriteRelativeLinks` standardmäßig auf `false` gesetzt, sofern Sie ihn nicht explizit festlegen – die Umwandlung relativer Links ist für `docsOutput.style = "flat"` ohne benutzerdefinierte Vorlage konzipiert.

Für integrierte Layouts (`nested`, `flat`, `doc-system` ohne benutzerdefinierte Vorlage) setzen Sie `docsOutput.localePathLowercase` auf `true`, um klein geschriebene Ordner- oder Dateinamenabschnitte zu erzeugen (z. B. `pt-br` statt `pt-BR`). Der `astro-starlight`-Alias setzt dies standardmäßig auf `true`. Benutzerdefinierte `pathTemplate` / `jsonPathTemplate`-Werte bleiben unverändert – verwenden Sie dort `{llocale}`, wenn Sie klein geschriebene Abschnitte benötigen, aber `{locale}` im BCP-47-Format beibehalten möchten.

| Platzhalter            | Rolle                                                                                                       | Beispiel                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Absoluter aufgelöster Pfad des `outputDir` dieses Dokumentationsblocks                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Ziel-Sprachcode (gleiche Form wie in Konfiguration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Dieselbe Sprache in Großbuchstaben | `DE`, `PT-BR` |
| `{llocale}`            | Gleicher kleingeschriebener Gebietsschemaname (entspricht Astro-Routenordnern wie `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Quelldateipfad relativ zur Projektwurzel, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Dateiname **ohne** Erweiterung | `guide` für `docs/guide.md` |
| `{basename}` | Dateiname **mit** Erweiterung | `guide.md` |
| `{extension}` | Erweiterung **einschließlich** des Punkts | `.md`, `.mdx` |
| `{docsRoot}`           | Absoluter aufgelöster Pfad von `docsOutput.docsRoot` (Standard `docs`, falls weggelassen)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` mit entferntem `docsRoot`-Präfix, wenn sich die Pfadzeichenfolgen entsprechen (POSIX); andernfalls unverändert | `docs/guide.md` (üblich); `guide.md` nur, wenn das Entfernen angewendet wird |

**Beispiel**

Konfigurationsausschnitt:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Für das Gebietsschema `de` und die Quelle `docs/guide.md`, mit Projektstammverzeichnis `/home/acme/repo` und `outputDir`, das auf `/home/acme/repo/i18n` aufgelöst wird, lautet der erweiterte Pfad:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Mit `docsOutput.style = "flat"` und ohne benutzerdefinierte `pathTemplate` ist ein übliches Muster, nur den Dateinamen über `{stem}` und `{extension}` beizubehalten, z. B. `{outputDir}/{stem}.{locale}{extension}`, was `…/guide.de.md` im aufgelösten `outputDir` ergibt.
