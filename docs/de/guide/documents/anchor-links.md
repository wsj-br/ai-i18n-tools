<a id="anchor-links"></a>
# Anker-Links

Wenn `docsOutput.style = "flat"`, schreibt die Ausgabe **relative Pfade** zwischen Seiten für jede Sprache um (`guide.md` → `guide.de.md`). **Ankerlinks** — die übliche Markdown-Inlineform mit einem `#` nach dem Pfad — springen zu einem Abschnitt in der Zieldatei:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Hier ist das Link-Ziel `setup.md` und `#first-run` der Anker: Es sollte zum richtigen Überschriftenelement innerhalb dieser Datei scrollen.

<a id="why-anchor-links-need-attention"></a>
## Warum Anker-Links besondere Aufmerksamkeit erfordern

- `rewriteRelativeLinks` legt den **Dateinamen** für jede Sprache fest (`setup.md` → `setup.de.md`).
- Viele Renderer leiten den `#`-Slug aus dem **sichtbaren Überschriftentext** ab. Nach der Übersetzung unterscheiden sich die Überschriften je nach Sprache, sodass sich ein automatisch generierter Slug ändern kann, während der umgeschriebene Link möglicherweise immer noch `#first-run` enthält – oder Ihr englischer `#…`-Anker passt nicht mehr zum Slug, den der Renderer aus der übersetzten Überschrift erstellt.
- Ergebnis: Leser landen auf der richtigen **Datei**, aber an der **falschen Stelle**, oder der Browser findet keine passende Überschrift.

<a id="what-to-do"></a>
## Was zu tun ist

<a id="docusaurus-sites-preferred"></a>
### Docusaurus-Sites (bevorzugt)

In der [Docusaurus](/de/guide/integrations/docusaurus)-Dokumentation (`docsOutput.style = "docusaurus"`) sollten Sie die nativen Überschriften-IDs von Docusaurus anstelle von HTML-Ankern aus `ai-i18n-tools write-heading-ids` bevorzugen:

1. Fügen Sie eine explizite ID in der Überschriftenzeile mit dem klassischen Docusaurus-Suffix `{#…}` (CommonMark) oder dem MDX-Kommentar `{/* #… */}` (bevorzugt für `.mdx`) hinzu, z. B. `## TLS configuration {#tls-configuration}` oder `## TLS configuration {/* #tls-configuration */}`. Während der `translate-docs` wird nur der sichtbare Überschriftentext übersetzt – das ID-Suffix bleibt in jedem Gebietsschema erhalten.
2. Führen Sie `docusaurus write-heading-ids` aus dem Stammverzeichnis Ihres Docusaurus-Projekts aus (oft `pnpm run write-heading-ids`, wenn es in `package.json` eingebunden ist), um IDs zu Überschriften hinzuzufügen oder zu aktualisieren, die keine haben – verwenden Sie `--syntax mdx-comment` für die Form `{/* #… */}`. Alternativ können Sie `ai-i18n-tools write-heading-ids --slug-style mdx-comment` auf demselben `docs[]` / `contentPaths` ausführen. Führen Sie dies nach dem Umbenennen von Überschriften erneut aus, damit veraltete IDs mit den aktuellen Titeln übereinstimmen.

Verweisen Sie Ihre Markdown-**Ankerlinks** auf diese stabilen IDs, z. B. `[label](other.md#tls-configuration)`, wobei das Fragment mit der ID `{#…}` oder `{/* #… */}` übereinstimmt – nicht mit einem Slug, der nur aus englischen Wörtern erraten wurde. Siehe [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) für festgeschriebene Dokumente, die dieses Muster verwenden.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### Andere Layouts (Flat, Starlight, VitePress usw.)

Wenn Sie nicht Docusaurus verwenden oder HTML-Anker anstelle von `{#…}` / `{/* #… */}`-Suffixen benötigen:

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer Quelle `.md` / `.mdx` vor `translate-docs` aus (gleicher `docs[]` / `contentPaths` wie üblich). Es fügt explizite HTML-Anker in die Zeile vor jeder Überschrift ein, sodass `id`-Werte von jeder übersetzten Kopie gemeinsam genutzt werden. Führen Sie es erneut aus, nachdem Sie Überschriften umbenannt haben, damit veraltete Anker-IDs aktualisiert werden und dem aktuellen Titel entsprechen.
2. Verweisen Sie Ihre Markdown-**Ankerlinks** auf diese stabilen IDs, z. B. `[label](other.md#section-id)`, wobei `section-id` mit dem Anker übereinstimmt, den das Tool geschrieben hat — nicht nur eine Vermutung aus englischen Wörtern.

<a id="example"></a>
## Beispiel

<a id="example-docusaurus"></a>
### Docusaurus `{#…}` / `{/* #… */}` Suffix

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (englische Quelle, klassisch):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

Oder die von MDX bevorzugte Kommentarform:

```markdown
## TLS configuration {/* #tls-configuration */}

Your CA and cert steps…
```

Nach `translate-docs` bleibt das Linkfragment in jedem Gebietsschema `#tls-configuration`; nur der Überschriftentext und die Linkbeschriftung ändern sich:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML-Anker (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` nach `write-heading-ids` (vereinfacht):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

Nach `translate-docs` bleiben Dateipfade und `#…`-Anker in jeder Sprachdatei synchron, zum Beispiel:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

Der `#tls-configuration`-Anker ist in allen Sprachversionen identisch, da die `id` in der Quelle festgelegt ist; nur der Überschrifts**text** und die Link**bezeichnung** werden übersetzt.

Wenn Links nach der Übersetzung immer noch fehlschlagen, siehe [Fehlerbehebung](/de/guide/documents/troubleshooting).
