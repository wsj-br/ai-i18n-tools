<a id="add-i18n-to-a-python-app"></a>
# Añadir i18n a una aplicación Python

Esta guía toma una aplicación de Python que tiene un solo idioma y le añade localizaciones con ai-i18n-tools. Las cadenas de texto visibles para el usuario sin envolver se envuelven manualmente o con las indicaciones bajo [Envolver cadenas de texto](#wrap-strings). `migrate-python-i18n` solo repara llamadas inseguras que ya están envueltas. Cualquier cosa que aún requiera revisión se lista en un informe.

¿Ya utiliza catálogos de GNU gettext, Django o Flask? Mantenga esas llamadas. Elija la plantilla de inicialización correspondiente a continuación y deje que `extract` rellene los espacios vacíos del catálogo a partir de los archivos `.po` existentes.

Los pasos:

1. [Instalar](#install-and-choose-a-provider) la CLI y configurar la clave de API.
2. [Elegir una plantilla](#initialise-the-project) y ejecutar `init`.
3. [Envolver cadenas de texto](#wrap-strings) en `t()` o `_()`.
4. [Migrar sitios de llamada](#step-3-check-wrapped-calls) que ya están envueltos de forma insegura.
5. [Elegir modelos y traducir](#choose-models-and-translate).
6. [Cambiar la configuración regional en tiempo de ejecución](#step-4-add-a-language-switch).
7. [Mantenerlo traducido](#keep-it-translated).

¿No estás seguro de que este sea tu caso? Consulta [¿No es tu caso?](#not-your-case) al final.

<a id="install-and-choose-a-provider"></a>
## Instalar

Usa el paquete npm cuando la máquina ya tiene Node.js `>=22.16.0` ([Instalación](/es/guide/installation)). Para un proyecto de Python, instala el ejecutable independiente (sin Node.js).

Linux y macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

El instalador comprueba `SHA256SUMS.txt`, instala el comando como `ai-i18n-tools` y lo añade a `PATH`. Los binarios no están notariados ni firmados con Authenticode. Pasos manuales y nombres de activos: [Ejecutables independientes](/es/guide/installation#standalone-executables).

Establezca la clave de API para el proveedor que pasa a `init`. Por ejemplo, Inferencias más baratas:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama no necesita clave. Otros ajustes preestablecidos: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers).

<a id="initialise-the-project"></a>
## Elija una plantilla

| Aplicación actual | Comando | Lo que obtienes |
| --- | --- | --- |
| Cadenas de texto codificadas, o nuevas llamadas a `t()` / `_()` | `ai-i18n-tools init -t ui-python -P cheaperinference` | JSON plano indexado por la cadena de texto del idioma de origen, y `i18n.py` |
| GNU gettext, y también quiere JSON plano | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON más `.po` / `.mo`, y `i18n.py` |
| Catálogos de Flask o Jinja bajo `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Catálogos de Gettext y `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (sin `i18n.py`) |

Edita `sourceLocale` y `targetLocales`. `sourceLocale` es el idioma de las cadenas de texto en el código fuente. Cualquier idioma BCP-47 es válido; los ejemplos suelen usar `en`. Integración del framework: [Integraciones de Python](/es/guide/integrations/python). Formas de llamada y diseño del catálogo: [Aplicaciones de Python](/es/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## Ajuste las cadenas

Busque primero la entrada del catálogo y, a continuación, interpole. Importe `t` y `_` desde el `i18n.py` generado (Django mantiene `gettext` y `ngettext`).

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Estos se evalúan antes de cualquier búsqueda en el catálogo. El extractor los marca como inseguros y `migrate-python-i18n` los reescribe:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Usa esto para Streamlit, FastAPI, Flask con JSON plano, Tkinter, Qt y un shell de PyWebView. Cópialo en un agente de codificación. Un proyecto de Django o de gettext existente debería usar la [siguiente indicación](#agent-prompt-django-gettext) en su lugar.

<details class="agent-prompt">
<summary>Indicación del agente: i18n.py helper</summary>

````markdown
# Wrap user-facing Python strings with i18n.py

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `_()` (and the
other names in `ui.uiExtractor.funcNames`). The literal is the source-language
sentence and the catalog key. After this edit the app must behave the same when
the active locale is the source locale. Do not translate any string.

Call shapes: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit Python (and Jinja
templates) under those roots. Skip class names, URLs and routes, import paths,
ids, enum and error codes, object keys used as identifiers, log field names,
regexes, comments, and text that is already wrapped. Do not edit the generated
`i18n.py`.

## Call shape

Import `t` and `_` from the generated `i18n.py`. Placeholders are `{name}` or
`{price:,.2f}`, passed as keyword arguments. `_("…") % x` and `_("…").format(…)`
are safe because the lookup happens first.

Never `_(f"…")`, `_("…" % x)`, or `_("…".format(…))`. If one slips in,
`migrate-python-i18n` can rewrite it later.

Before:

```python
st.write(f"Hello, {name}!")
```

After:

```python
st.write(t("Hello, {name}!", name=name))
```

Framework notes:

- Streamlit widgets keep a fixed `key=`.
- Tkinter text is rebuilt after `set_locale`.
- Qt uses `self.tr("…")` (already in the default function list).
- Jinja uses `{% trans %}` / `{% blocktrans %}` rather than an f-string inside
  the template.
- FastAPI and Flask middleware pair `set_locale` with `reset_locale` in
  `finally`.

## Order

1. `ai-i18n-tools init -t ui-python` (or `ui-python-gettext` / `ui-python-flask`
   if you also want `.po` files) so `i18n.py` exists.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Then `ai-i18n-tools migrate-python-i18n` (dry
   run) and read the report.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys.
- Do not create a second helper besides `i18n.py`.
- Do not hand-edit `strings.json`, flat locale JSON, `.po` / `.mo`, or
  `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog.
- The project's tests pass.
- The source locale still shows the original sentences. One target locale shows
  translations after `translate-ui`.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case left for a human (the same word with different meanings,
concatenated sentences, or plurals).
````

</details>

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

Usa esto cuando la aplicación ya llama a Django o GNU gettext, o cuando quieras mantenerte en los catálogos de `.po`. No añadas `i18n.py`.

Las plantillas de inicialización reconocen estos nombres de llamada exactamente: `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` y `self.tr`. Las variantes lazy y noop no están en esa lista. Añade los nombres que el proyecto realmente llama —típicamente `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy` y `gettext_noop`— a `ui.uiExtractor.funcNames`, o `extract` los omitirá. `ngettext_lazy` se lee como singular más plural, y `pgettext_lazy` como contexto más mensaje, solo después de que el nombre esté listado. `{% trans %}` y `{% blocktrans %}` en las plantillas se recopilan por separado.

<details class="agent-prompt">
<summary>Indicación del agente: Django y gettext nativo</summary>

````markdown
# Wrap user-facing strings with Django / gettext

## Context

ai-i18n-tools extracts string literals passed to gettext calls whose names are
listed in `ui.uiExtractor.funcNames`, plus `{% trans %}` and `{% blocktrans %}`
in templates. The literal is the source-language message. Existing `.po` files
stay; `extract` fills empty catalog slots from them when
`ui.gettext.ingestExistingPo` is on (the default). Do not translate any string.
Do not create `i18n.py`.

## Scope

Edit Python modules, Django templates, and forms under `ui.sourceRoots`. Skip
URLs, import paths, ids, field names used as identifiers, `verbose_name` keys
that are already lazy-wrapped, comments, and migrations that must not change. Do
not wrap strings inside `help_text` that are already `gettext_lazy` calls.

## Call shape

Init with `ui-python-django` (Django `locale/` and the `django` domain) or
`ui-python-gettext` (existing GNU catalogs). Use `gettext`, `ngettext`,
`pgettext`, and `{% blocktrans %}` / `{% trans %}`. Placeholders are `%(name)s`.

Module-level model, form, and settings strings use the lazy form. Add every lazy
or noop name you call to `ui.uiExtractor.funcNames` (for example `gettext_lazy`,
`ngettext_lazy`, `pgettext_lazy`, and `gettext_noop`). The default list does not
include them.

Before:

```python
verbose_name = "Display name"
```

After:

```python
from django.utils.translation import gettext_lazy as _

verbose_name = _("Display name")
```

Template:

```django
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

The extractor stores that message with a `%(name)s` placeholder. Do not switch
Django templates to `{name}` or to i18next `{{name}}` inside a Python `t()`
call.

## Order

1. Pick `ui-python-django` or `ui-python-gettext`. Confirm `funcNames` includes
   every gettext function the code calls.
2. Wrap call sites. Keep existing `.po` files.
3. Run `ai-i18n-tools extract`.

## Do not

- Do not translate, rename, or reword msgid text.
- Do not add `i18n.py` or a flat-JSON `t()` helper next to Django's gettext.
- Do not hand-edit generated `.po`, `.mo`, `strings.json`, or
  `ui-languages.json`.
- Do not change model field names, migrations, or test selectors.

## Verify

- `ai-i18n-tools extract` lists the new messages and does not drop existing
  msgid entries that `ingestExistingPo` already filled.
- Django checks and the project's tests pass.
- The source locale still shows the original copy.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
function names you added to `funcNames`, and any ambiguous case left for a
human.
````

</details>

<a id="review-the-result"></a>
## Migrar sitios de llamada

`migrate-python-i18n` es una ejecución de prueba hasta que pase `--write`. Siempre escribe `migrate-python-i18n-report.md`. Los archivos `i18n.py` generados se omiten. Los campos de depuración como `{value=}` y las especificaciones de formato anidadas se notifican y se dejan en su lugar.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Lea el informe antes de `--write` cuando la ejecución de prueba enumere sitios que requieren revisión manual. El parámetro opcional `--report <path>` cambia la ruta del informe. El parámetro opcional `--ui-block` limita el análisis a un bloque de interfaz de usuario.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` reemplaza solo a `translationModels`. La misma clasificación se encuentra en la pestaña [Models](/es/guide/translation-dashboard/models). A continuación, extraiga y traduzca:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` escribe `strings.json` y `ui-languages.json`. `translate-ui` rellena los archivos JSON planos y, cuando `ui.gettext` está configurado, los catálogos `.po` / `.mo`. No edite manualmente esos catálogos generados.

<a id="check-one-language"></a>
## Cambiar la configuración regional en tiempo de ejecución

`set_locale` devuelve un token `ContextVar`. Restablézcalo cuando finalice la solicitud o la devolución de llamada.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

El middleware de FastAPI y Flask debe restablecerse en `finally` (Flask: `teardown_request`) para que las solicitudes concurrentes no filtren una configuración regional. Los proyectos de Django mantienen la activación de la configuración regional de Django y no utilizan `i18n.py`. Notas por framework: [Configuración regional en cada framework](/es/guide/ui-strings/python#locale).

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Volver a ejecutar `ai-i18n-tools sync` (o `extract` y luego `translate-ui`) después de cambiar el texto de origen. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Ejecútalo en CI para que las traducciones no se desvíen. `ai-i18n-tools dashboard` abre el [Panel de control de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

Para traducir `README.md` en la misma ejecución, genera la estructura con `--with-readme` (o añade el bloque a una configuración existente). Consulta [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## ¿No es su caso?

| Tienes | Consulta |
| --- | --- |
| Una aplicación JS/TS | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) |
| Un sitio web o sitio de documentación | [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website) |
| Un archivo README de repositorio u otros archivos Markdown | [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme) |
| JSON de configuración regional anidado | [JSON](/es/guide/json) |

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Ejemplos

| Ejemplo | Qué muestra |
| --- | --- |
| [python-streamlit](/es/examples#python-streamlit) | Panel, `t()` / `_()`, JSON plano |
| [python-fastapi](/es/examples#python-fastapi) | Configuración regional con ámbito de solicitud, JSON plano |
| [python-flask](/es/examples#python-flask) | Flask + Jinja, JSON plano |
| [python-gettext](/es/examples#python-gettext) | CLI de gettext existente; `translate-ui` actualiza `.po` y `.mo` |

Copie uno con `npx degit`, o descargue `ai-i18n-tools-python-examples.zip` desde la versión de GitHub. Comandos: [Ejemplos](/es/examples#python-examples).
