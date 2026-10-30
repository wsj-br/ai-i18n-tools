<a id="add-i18n-to-a-django--python-gettext-app"></a>
# Añadir i18n a una aplicación Django / Python con gettext

Esta página es para una aplicación Python que traduce con GNU gettext, o una que lo hará: Django, Flask con catálogos estilo Flask-Babel, o cualquier aplicación que llame a `gettext()`. Mantienes las llamadas a gettext. ai-i18n-tools las lee, traduce los mensajes y escribe los archivos `.po` y `.mo` compilados que tu aplicación ya carga. No se necesita ningún módulo auxiliar.

La forma más rápida es darle a un agente de codificación la instrucción de esta página. Configura la configuración, envuelve tus cadenas, comprueba el resultado y puede añadir un selector de idioma. Tú instalas la CLI, eliges el proveedor e inicializas el proyecto tú mismo, porque eso requiere tu clave API y tus elecciones. También ejecutas la traducción tú mismo, porque gasta dinero de tu cuenta y reescribe tus archivos `.po` y `.mo`.

¿Estás creando una aplicación Streamlit, FastAPI, Flask, de escritorio o un script que no tiene gettext hoy? Usa [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) en su lugar. Añade un pequeño auxiliar `i18n.py` y escribe catálogos JSON. ¿No estás seguro de cuál se aplica? Consulta [¿No es tu caso?](#not-your-case) al final.

El flujo:

1. [Instala la CLI y elige un proveedor](#install-and-choose-a-provider).
2. [Inicializa el proyecto](#initialise-the-project) con `init`.
3. [Ejecuta la instrucción del agente](#run-the-agent-prompt).
4. [Revisa el resultado](#review-the-result).
5. [Elige modelos y traduce](#translate), luego verifica un idioma.
6. [Manténlo traducido](#keep-it-translated).

¿Prefieres hacer los cambios tú mismo o quieres saber qué hace la instrucción? [Hazlo manualmente](#do-it-by-hand) recorre los mismos pasos uno por uno.

<a id="install-and-choose-a-provider"></a>
## Instalar y elegir un proveedor

Tú haces esta parte, no el agente. El instalador cambia tu máquina, y la clave API es un secreto que pertenece a tu shell, no a una instrucción.

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

Comprueba la instalación:

```bash
ai-i18n-tools --version
```

Luego elige un proveedor y establece su clave API en el shell que ejecutará la traducción. Por ejemplo, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama no necesita clave. Otros preajustes: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers). Anota el nombre del proveedor, porque lo pasarás a `init` en el siguiente paso. El agente nunca necesita la clave: solo ejecuta comandos que no hacen llamadas a modelos. Usarás la clave más tarde, cuando [traduzcas](#translate).

<a id="initialise-the-project"></a>
## Inicializar el proyecto

Ejecutas esto una vez, antes de la instrucción. Escribe la configuración y usa el proveedor que elegiste anteriormente. Elige la plantilla que coincida con tu aplicación:

| Tu aplicación | Plantilla | Catálogos que escribe |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` y `.mo` |
| Flask con catálogos estilo Flask-Babel | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` y `.mo` |
| Cualquier otra aplicación Python que ya use GNU gettext | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` y `.mo` |

Ejecuta init con el nombre de la plantilla y el proveedor que elegiste:

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

Ejecuta `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución descartará las ediciones que hayas realizado. Si la configuración ya existe y está personalizada, omite `init` y edita la configuración.

`ui-python-gettext` y `ui-python-flask` también escriben un asistente `i18n.py` cuando ese archivo falta. Una aplicación gettext no lo necesita, así que bórralo (la instrucción lo hace por ti). `ui-python-gettext` también escribe archivos JSON junto a los catálogos gettext. Para escribir solo catálogos gettext, establece `"flatOutput": false` en el bloque `ui` (la instrucción también lo hace). `ui-python-django` no escribe ni el asistente ni JSON, porque Django mantiene su propio sistema de traducción.

Luego edita `sourceLocale` y `targetLocales` en `ai-i18n-tools.config.json`. `sourceLocale` es el idioma de las cadenas en tu código. Cualquier idioma BCP-47 es válido; los ejemplos a menudo usan `en`. Escribe los códigos de destino como `pt-BR`. La carpeta del catálogo es `pt_BR`, el formato que gettext y Django esperan (`localeFormat` es `posix`).

<a id="run-the-agent-prompt"></a>
## Ejecutar la instrucción del agente

Abre el proyecto en tu agente de codificación (Cursor, Claude Code, Copilot o similar), inicia un nuevo chat y pega la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si quieres omitir algo, por ejemplo, no cambiar de idioma, indícalo en el mismo mensaje.

El agente primero verifica que la CLI y la configuración existan, y se detiene con instrucciones si falta alguna. Luego trabaja en cuatro partes:

- La Parte 1 hace que la configuración coincida con tus catálogos existentes y elimina el `i18n.py` que escriben algunas plantillas.
- La Parte 2 envuelve las cadenas orientadas al usuario con las llamadas gettext que ya usas y las etiquetas de plantilla.
- La Parte 3 ejecuta `extract` y encuentra llamadas que formatean antes de la búsqueda.
- La Parte 4 añade el cambio de idioma.

No instala ni inicializa nada, no lee tu clave API ni traduce. No ejecuta `makemessages` ni `compilemessages`, y deja tus archivos `.po` y `.mo` intactos. La traducción es el paso posterior a la revisión, y tú la ejecutas.

<details class="agent-prompt">
<summary>Instrucción del agente: añadir idiomas a una aplicación Django o gettext</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- La diferencia (diff). Solo las llamadas envueltas, las etiquetas de plantilla, la configuración y el cambio de idioma deberían haber cambiado. Tus archivos `.po` y `.mo` deberían permanecer intactos hasta que traduzcas.
- `ai-i18n-tools.config.json`: `gettext.outputDir` y `domain` apuntan a los catálogos que carga tu aplicación, y `sourceRoots` cubre el código de la aplicación.
- `ai-i18n-tools extract` lista los nuevos mensajes y mantiene las traducciones ya existentes en tus archivos `.po`.
- La ejecución de prueba (dry run) de `migrate-python-i18n` no lista nada que quede por corregir.
- Las comprobaciones de Django y tus pruebas pasan, y la aplicación se ve igual en el idioma de origen.
- Las cadenas omitidas y los casos ambiguos en el informe: plurales dejados como una sola cadena, una palabra con dos significados y oraciones construidas a partir de piezas traducidas. Decide estos a mano.

Confirma este estado. `translate-ui` reescribe tus archivos `.po`, por lo que querrás una diferencia (diff) limpia para revisar.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave API, gasta dinero de tu cuenta y reescribe tus archivos `.po`, así que confirma primero.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` solo reemplaza `translationModels`. La misma clasificación está en la pestaña [Modelos](/es/guide/translation-dashboard/models). Luego traduce:

```bash
ai-i18n-tools translate-ui
```

`translate-ui` escribe la plantilla `.pot`, un `.po` por cada configuración regional de destino, y el `.mo` compilado. Deja esos archivos sin editar a partir de ahora, porque la próxima ejecución los regenerará. Revisa la primera diferencia (diff) antes de confirmarla.

Reinicia el servidor si no detecta los nuevos archivos `.mo`.

<a id="check-one-language"></a>
### Comprobar un idioma

Cambia a un idioma de destino y mira una página con algunas cadenas envueltas. Los textos que aún muestran el idioma de origen no fueron envueltos, o el `.mo` no se recargó. Los textos que muestran `%(name)s` en la salida perdieron su diccionario. Comprueba los marcadores de posición en el archivo `.po`.

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Volver a ejecutar `ai-i18n-tools sync` (o `extract` y luego `translate-ui`) después de cambiar el texto de origen. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Ejecútalo en CI para que las traducciones no se desvíen. `ai-i18n-tools dashboard` abre el [Panel de control de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

`purge-locale` elimina la `.po` y la `.mo` de una localización. Confirma los archivos `.po`. Confirma también los archivos `.mo` a menos que tu compilación los compile.

Para traducir `README.md` en la misma ejecución, genera la estructura con `--with-readme` (o añade el bloque a una configuración existente). Consulta [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Hazlo manualmente

Sigue estos pasos si prefieres hacer los cambios tú mismo, o si quieres saber qué hace la instrucción. Cada paso coincide con una parte de la instrucción. Aun así, [instala la CLI](#install-and-choose-a-provider), [inicializa el proyecto](#initialise-the-project) y [traduce](#translate) al final.

1. [Apunta la configuración a tus catálogos](#point-the-config).
2. [Encapsula las cadenas](#wrap-strings) con las llamadas a gettext que ya utilizas.
3. [Extrae y verifica las llamadas](#extract-and-check).
4. [Cambia el idioma en tiempo de ejecución](#switch-language).

<a id="step-1-point-the-config-at-your-catalogs"></a>
## Paso 1: Apunta la configuración a tus catálogos

La plantilla escribe valores predeterminados razonables. Este es el de Django:

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

Verifica cuatro cosas en tu proyecto:

- `gettext.outputDir` y `potPath` es donde ya residen tus catálogos. Django: la carpeta en `LOCALE_PATHS`, o la carpeta `locale/` dentro de una aplicación. Flask-Babel: `translations/`.
- `gettext.domain` es el nombre de archivo que carga tu aplicación. Django usa `django`. Flask-Babel usa `messages`. Para gettext simple, es el dominio en tu llamada a `gettext.translation(...)`.
- `sourceRoots` enumera las carpetas que `extract` escanea. Restríngelo de `"."` a tu código de aplicación, para que las pruebas y los scripts queden fuera del catálogo.
- `stringsJson` es la caché de extracción, un archivo propiedad de esta herramienta. Mantenlo junto a los catálogos. No es un archivo de tiempo de ejecución. Tu aplicación nunca lo lee.

Cuando cada aplicación de Django mantiene su propia carpeta `locale/`, usa un bloque `ui` por cada árbol de catálogo. `ui` acepta una lista, y `--ui-block` ejecuta un bloque. Las rutas deben ser únicas entre bloques. Consulta [Configuración](/es/reference/configuration).

`ingestExistingPo` está activado por defecto. Durante `extract`, las traducciones que ya están en tus archivos `.po` rellenan los espacios vacíos. Una traducción que ya está establecida no se reemplaza. Confirma tus catálogos antes del primer `translate-ui`, porque reescribe los archivos `.po` y compila los archivos `.mo`. Revisa esa diferencia.

`compileMo` escribe el `.mo` por ti, por lo que no necesitas `compilemessages` en este flujo de trabajo. Elige una herramienta para escribir los catálogos: ejecutar `makemessages` después de `translate-ui` reescribe los mismos archivos `.po`.

<a id="step-2-wrap-strings"></a>
## Paso 2: Encapsula las cadenas

`extract` registra una cadena solo cuando es un literal pasado a uno de los nombres de función en `ui.uiExtractor.funcNames`, o una etiqueta de plantilla. Mantén las llamadas que tienes. Añade lo que falta.

Código Python:

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

Los marcadores de posición usan `%(name)s`. Pasa los valores después de la búsqueda con `%`, nunca antes. Los modelos, formularios y configuraciones se ejecutan cuando se importa el módulo, por lo que usan la forma diferida. No apliques `%` a una cadena diferida en el momento de la importación. Usa `format_lazy` en su lugar.

Plantillas (Django `{% load i18n %}`, o Jinja en Flask):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}` y `{% blocktrans %}` se recopilan por sí solos. Una variable de plantilla como <code v-pre>{{ name }}</code> se almacena como `%(name)s`. Mantenlo en esa forma.

Los nombres que `extract` no conoce se omiten. La lista predeterminada es `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` y `self.tr`. Si el código llama a `gettext_lazy("…")` directamente, `ngettext_lazy`, `pgettext_lazy`, `npgettext` o `gettext_noop`, añade esos nombres a `ui.uiExtractor.funcNames`. Cuando importas la función diferida como `_`, como en `gettext_lazy as _`, el nombre `_` ya está cubierto.

Encapsula el texto que ve una persona: etiquetas, encabezados, mensajes, texto de formularios y modelos, correos electrónicos. Deja los identificadores, URL, nombres de campo, claves de configuración, mensajes de registro y migraciones tal como están. No reformules el texto original. Una traducción faltante devuelve la frase original, por lo que la aplicación se ve igual en el idioma original.

Estas llamadas evalúan el formato antes de la búsqueda, por lo que la cadena nunca coincide con una entrada de catálogo:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## Paso 3: Extraer y verificar las llamadas

Ejecute `extract` una vez que las llamadas estén envueltas. Escribe la caché de extracción y rellena los espacios vacíos de sus archivos `.po` existentes. No llama a un modelo.

```bash
ai-i18n-tools extract
```

Luego, busque las llamadas que formatean antes de la búsqueda. `migrate-python-i18n` las encuentra. Ejecútelo sin `--write`:

```bash
ai-i18n-tools migrate-python-i18n
```

Escribe `migrate-python-i18n-report.md`. Léalo y corrija cada llamada listada manualmente con `%(name)s` y un diccionario. Elimine el informe o ignórelo con git.

No pase `--write` en esta página. Esa opción reescribe una f-string o una llamada `.format()` en `t("…", name=name)`, una llamada que existe solo en la función auxiliar `i18n.py`. Una aplicación gettext no tiene `t`. Un informe sin líneas significa que las llamadas envueltas son seguras. No significa que cada frase haya sido envuelta, así que lea el diff de `strings.json` y busque el texto que esperaba ver.

<a id="step-4-switch-language-at-runtime"></a>
## Paso 4: Cambiar el idioma en tiempo de ejecución

Su framework elige el idioma. ai-i18n-tools no añade un menú ni una función auxiliar.

<a id="django"></a>
### Django

En `settings.py`:

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware` va después del middleware de sesión y antes de `CommonMiddleware`. `LANGUAGE_CODE` es el idioma de origen. `LANGUAGES` lista los idiomas que un visitante puede elegir. `LOCALE_PATHS` apunta a la carpeta donde escribe `gettext.outputDir`, a menos que cada aplicación mantenga su propia carpeta `locale/`.

Añada la vista de cambio de idioma de Django a `urls.py`:

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

Luego, añada un formulario a una plantilla:

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

La vista guarda la elección en una cookie. Para poner el idioma en la URL en su lugar, use `i18n_patterns`. Ambas son características estándar de Django. Consulte la documentación de Django sobre internacionalización.

<a id="plain-gettext-and-flask-babel"></a>
### Gettext simple y Flask-Babel

Cargue el catálogo para el idioma que desee y llámelo. El ejemplo de [python-gettext](/es/examples#python-gettext) hace esto en una herramienta de línea de comandos:

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

Convierta `pt-BR` a `pt_BR`, el nombre de la carpeta que escribió `translate-ui`. Mantenga `fallback=True` para que un catálogo faltante muestre el texto de origen. En una aplicación web, construya el objeto de traducciones por solicitud y no instale uno globalmente con `gettext.install`, o las solicitudes concurrentes compartirán un idioma. En Flask-Babel, devuelva el código de su función selectora de configuración regional y mantenga `translations/` como su directorio de traducción.

Este es el último paso manual. Continúe en [Elegir modelos y traducir](#translate).

<a id="not-your-case"></a>
## ¿No es su caso?

| Usted tiene | Lea |
| --- | --- |
| Una aplicación Streamlit, FastAPI, Flask, de escritorio o de script sin gettext | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Una aplicación JS/TS | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) |
| Un sitio web o sitio de documentación | [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website) |
| Un archivo README de repositorio u otros archivos Markdown | [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Ejemplos

| Ejemplo | Lo que muestra |
| --- | --- |
| [python-gettext](/es/examples#python-gettext) | Una herramienta de línea de comandos gettext existente; `translate-ui` actualiza `.po` y `.mo` |

No hay un directorio de ejemplo de Django. El ejemplo `python-gettext` muestra la misma estructura de configuración con el dominio `messages`. Cópielo con `npx degit`, o descargue `ai-i18n-tools-python-examples.zip` de la versión de GitHub. Comandos: [Ejemplos](/es/examples#python-examples).
