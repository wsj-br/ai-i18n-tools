<a id="anchor-links"></a>
# Anchor links

When `docsOutput.style = "flat"`, output rewrites **relative paths** between pages for each locale (`guide.md` → `guide.de.md`). **Anchor links** — the usual markdown inline form with a `#` after the path — jump to a section inside the target file:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Here the link target is `setup.md`, and `#first-run` is the anchor: it should scroll to the right heading inside that file.

<a id="why-anchor-links-need-attention"></a>
## Why anchor links need attention

- `rewriteRelativeLinks` fixes the **filename** for each locale (`setup.md` → `setup.de.md`).
- Many renderers derive the `#` slug from the **visible heading text**. After translation, headings differ per locale, so an auto-generated slug can change while the rewritten link might still say `#first-run` — or your English `#…` anchor no longer matches the slug the renderer builds from the translated heading.
- Result: readers land on the right **file** but the **wrong line**, or the browser finds no matching heading.

<a id="what-to-do"></a>
## What to do

<a id="docusaurus-sites-preferred"></a>
### Docusaurus sites (preferred)

On [Docusaurus](/guide/integrations/docusaurus) documentation (`docsOutput.style = "docusaurus"`), prefer Docusaurus's native heading IDs instead of `ai-i18n-tools write-heading-ids`:

1. Add an explicit id on the heading line with Docusaurus's `{#…}` suffix, e.g. `## TLS configuration {#tls-configuration}`. During `translate-docs`, only the visible heading text is translated — the `{#tls-configuration}` suffix is preserved in every locale.
2. Run `docusaurus write-heading-ids` from your Docusaurus project root (often `pnpm run write-heading-ids` when wired in `package.json`) to add or refresh `{#…}` suffixes on headings that lack them. Re-run after renaming headings so stale ids match the current titles.

Point your markdown **anchor links** at those stable ids, e.g. `[label](other.md#tls-configuration)`, where the fragment matches the `{#…}` suffix — not a slug guessed from English words alone. See [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) for committed docs that use this pattern.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### Other layouts (flat, Starlight, VitePress, etc.)

When you are not on Docusaurus, or you need HTML anchors instead of `{#…}` suffixes:

1. Run `ai-i18n-tools write-heading-ids` on your source `.md` / `.mdx` before `translate-docs` (same `docs[]` / `contentPaths` as usual). It inserts explicit HTML anchors on the line before each heading so `id` values are shared by every translated copy. Re-run it after renaming headings so stale anchor ids are refreshed to match the current title.
2. Point your markdown **anchor links** at those stable ids, e.g. `[label](other.md#section-id)`, where `section-id` matches the anchor the tool wrote — not a guess from English words alone.

<a id="example"></a>
## Example

<a id="example-docusaurus"></a>
### Docusaurus `{#…}` suffix

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (English source):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

After `translate-docs`, the link fragment stays `#tls-configuration` in every locale; only the heading text and link label change:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML anchors (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` after `write-heading-ids` (simplified):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

After `translate-docs`, file paths and `#…` anchors stay aligned in every locale file, for example:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

The `#tls-configuration` anchor is the same in all locales because the `id` is fixed in the source; only the heading **text** and the link **label** are translated.

If links still fail after translation, see [Troubleshooting](/guide/documents/troubleshooting).
