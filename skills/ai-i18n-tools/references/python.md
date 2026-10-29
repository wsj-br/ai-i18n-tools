# Python consumer reference

## Choose the runtime before changing code

- No gettext today: use `ui-python`, generated `i18n.py`, and flat JSON catalogs.
  Fits scripts, Streamlit, FastAPI, Flask, and desktop apps; Python 3.10+.
- Existing gettext, Django, or Flask-Babel: keep its imports, runtime, and catalogs.
  Do not replace them with `t()` or introduce a second translation helper.
- Templates: `ui-python-gettext`, `ui-python-django`, `ui-python-flask` respectively.
  Django uses `locale/<lang>/LC_MESSAGES/django`; Flask uses
  `translations/<lang>/LC_MESSAGES/messages`; plain gettext defaults to `locales/`.
- The gettext and Flask templates also scaffold a missing `i18n.py`; it is not
  needed for native gettext. Remove only an unused, newly generated helper.
  For gettext-only output, set `ui.flatOutput` to `false`.

## Initialise once; maintain with sync

Check `ai-i18n-tools --version` and inspect the existing config first.
For a new helper-based project, initialise with the user's chosen provider:

```bash
ai-i18n-tools init -t ui-python -P <provider>
```

Never rerun `init` over customised configuration: it rewrites the config.
Set `sourceLocale` to the source text's language and `targetLocales` to BCP-47
codes, such as `pt-BR`. Keep the generated helper's source locale aligned.
Configure provider credentials outside prompts; never read or print secrets.
After reviewing source and configuration changes, the normal workflow is:

```bash
ai-i18n-tools sync
```

`sync` extracts and translates enabled pipelines. Honor the requested translation
scope and project policy; an authorized sync needs no additional approval.
Do not add separate extraction/translation steps. Preserve existing `.po` files: their translations can seed the catalog.
Restart the app after sync; the helper caches even missing locale files.

## Place helper, catalogs, and package data together

- Scripts can keep `i18n.py` and `locales/` at the project root. For an installed
  package, move both into that package, for example `src/mypkg/`.
- The helper resolves catalogs relative to its own file, not the working directory.
  Move the pair together rather than patching paths inside generated code.
- Point `ui.sourceRoots` at application code, not the whole repository. Update
  `ui.stringsJson`, `ui.flatOutputDir`, and `languagesManifestPath` if present.
- Use package imports such as `from mypkg.i18n import t`. Include `locales/*.json`
  in wheel/package data and container copies; verify the installed artifact.
- For native gettext, match `ui.gettext.outputDir`, `potPath`, and `domain` to the
  existing loader. Use `localeFormat: "posix"` for folders such as `pt_BR`.
  Enable `compileMo` and ship `.mo` files where the framework expects them.

## Literal keys, interpolation, and context

Lookup must happen before formatting. For the generated helper:

```python
from mypkg.i18n import _, ngettext, pgettext, t

caption = t("Welcome, {name}!", name=user_name)
total = t("Total: {price:,.2f}", price=price)
legacy = _("Welcome, %s!") % user_name
label = pgettext("menu", "Open")
files = ngettext("One file", "{count} files", count, count=count)
```

Use named values, including `{rate:.2%}` or `{item!r}`; pass `rate=row.rate`
instead of dotted placeholder fields. Literal `%` beside printf letters can
trigger printf formatting. Never use `_(f"…")`, `_("…" % value)`, or
`_("…".format(value))`. Dynamic keys such as `t(variable)` are not extracted.
Translate complete sentences; keep identifiers, stored values, and widget keys stable.

Flat JSON uses exact source text, not the MD5-8 ids in `strings.json` (tooling
cache). Context keys are `context + U+0004 + source`; gettext uses `msgctxt`.
Leave plural suffix keys to the generated helper; do not invent hash lookups.
Missing translations fall back to source text. Do not hand-edit generated catalogs.

Native gettext keeps its own formatting: `_("Hello, %(name)s!") % {"name": name}`.
Use Django lazy translations for import-time labels and `format_lazy` when needed;
keep Django/Jinja translation tags and their gettext placeholders. Register extra
call names in `ui.uiExtractor.funcNames`. `migrate-python-i18n` is diagnostic without
`--write`; never apply its helper-specific rewrites blindly to native gettext.

## Isolate each request or run

Resolve a supported locale from explicit choice, saved preference, environment,
then source locale. Match against configured locales/`get_ui_languages()`;
`set_locale` is not a language negotiator. Set it before the first translated title.
Keep the token returned by `set_locale(code)` and call `reset_locale(token)` in
`finally`, in the same execution context. New threads need their own locale setup.
Avoid module-level `t()` calls that freeze text; redraw desktop widgets or rerun
Streamlit after changes. Use Django locale middleware or Flask-Babel's selector
for native frameworks. Plain gettext web apps use per-request translation objects,
not process-global `gettext.install()`.

## Upgrade safely and verify

Upgrade the CLI separately. To refresh `i18n.py`, scaffold in a disposable directory
with the same template and locale/path settings, compare the helper, then replace
only the intended generated file. Never rerun `init` in the existing project just
to update the helper. Preserve configuration, application code, and custom helpers.
Verify source-language output, interpolation, context/plurals, packaged catalogs,
and concurrent requests using different locales; confirm target text after sync.

Further guides: [Python setup](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python),
[native gettext/Django](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-django-gettext),
[call shapes](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python), and
[framework wiring](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/python).
