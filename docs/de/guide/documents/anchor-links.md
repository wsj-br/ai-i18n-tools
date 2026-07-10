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

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer Quelle `.md` / `.mdx` vor `translate-docs` aus (gleicher `docs[]` / `contentPaths` wie üblich). Es fügt explizite HTML-Anker in die Zeile vor jeder Überschrift ein, sodass `id`-Werte von jeder übersetzten Kopie gemeinsam genutzt werden. Führen Sie es erneut aus, nachdem Sie Überschriften umbenannt haben, damit veraltete Anker-IDs aktualisiert werden und dem aktuellen Titel entsprechen.
2. Verweisen Sie Ihre Markdown-**Ankerlinks** auf diese stabilen IDs, z. B. `[label](other.md#section-id)`, wobei `section-id` mit dem Anker übereinstimmt, den das Tool geschrieben hat — nicht nur eine Vermutung aus englischen Wörtern.

<a id="example"></a>
## Beispiel

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
