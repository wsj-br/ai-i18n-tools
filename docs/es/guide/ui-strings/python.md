<a id="python"></a>
# Aplicaciones Python

`ai-i18n-tools` extrae cadenas de la interfaz de usuario de Python y de archivos `.ui` de Jinja, Django y Qt, y luego escribe JSON con claves en inglés, catálogos GNU gettext o ambos. El asistente de tiempo de ejecución es un `i18n.py` de la biblioteca estándar (Python 3.10 o posterior). Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid y FastAPI llaman a ese asistente. Django utiliza el gettext propio de Django.

Las copias ejecutables residen en `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` y `examples/python-gettext`. Son proyectos de Python. Los tres primeros utilizan un virtualenv y `pip install -r requirements.txt`. `python-gettext` utiliza únicamente la biblioteca estándar. No son paquetes npm. El archivo de lanzamiento `ai-i18n-tools-python-examples.zip` contiene los mismos cuatro directorios. El tarball de npm y el ejecutable independiente no los contienen.

<a id="init"></a>
## Scaffold

```bash
ai-i18n-tools init -t ui-python
ai-i18n-tools init -t ui-python-gettext
ai-i18n-tools init -t ui-python-flask
ai-i18n-tools init -t ui-python-django
```

`ui-python` escribe JSON plano y `i18n.py`. `ui-python-gettext` escribe JSON y `.po` / `.mo`. `ui-python-flask` escribe catálogos gettext en `translations/` y `i18n.py`. `ui-python-django` escribe `locale/<lang>/LC_MESSAGES/django.po` y no escribe `i18n.py`.

Las raíces de escaneo omiten `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache` y `.eggs`.

<a id="calls"></a>
## Llamadas que traducen

Busque primero la entrada del catálogo y, a continuación, interpole.

Portátil:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

En Python 3.14, el asistente también acepta una cadena de plantilla:

```python
translate(t"Hello, {name}!")
```

`translate` es un alias de `t`. Los argumentos de palabra clave anulan los valores tomados de la cadena de plantilla.

Gettext nativo, sigue siendo seguro porque la plantilla es el argumento:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

Estos se evalúan antes de cualquier búsqueda en el catálogo, por lo que el extractor los marca como inseguros y `migrate-python-i18n` los reescribe:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` es una ejecución de prueba hasta que se pasa `--write`. Escribe `migrate-python-i18n-report.md`. Los campos de depuración como `{value=}` y las especificaciones de formato anidadas se notifican y se dejan en su lugar.

`{% trans %}` y `{% blocktrans %}` se convierten en marcadores de posición `%(name)s` de gettext. Jinja elimina y colapsa los espacios en blanco. Django mantiene los espacios en blanco internos a menos que la etiqueta indique `trimmed`.

<a id="catalogs"></a>
## Catálogos

Las claves JSON planas son la fuente en inglés. Un contexto utiliza `context` + U+0004 + la fuente en inglés. Las ranuras de plural permanecen como `{md5}_one`, `{md5}_other` y las otras formas CLDR que `translate-ui` ya escribe. El asistente aplica un hash MD5 al singular recortado y lee los primeros 8 caracteres hexadecimales.

Los archivos Gettext utilizan `msgctxt` para el contexto y `msgid` / `msgid_plural` para los plurales. `ui.gettext.compileMo` escribe el `.mo` junto al `.po`. `purge-locale` elimina el `.po` y el `.mo` de esa configuración regional. Cuando `flatOutput` es falso, deja intactos los archivos JSON planos porque no fueron escritos.

`t(..., plurals=True)` con una configuración regional de origen en inglés y un origen plural explícito omite el modelo y almacena `one` / `other` a partir de las cadenas de origen.

<a id="locale"></a>
## Configuración regional en cada framework

`set_locale` devuelve un token `ContextVar`. Restablézcalo en `finally`, incluyendo el middleware de FastAPI y Flask, para que las solicitudes concurrentes no filtren una configuración regional.

- **Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")` escribe `st.session_state.locale` y `st.query_params["lang"]`. Asigne a cada widget una `key` fija. Consulte `examples/python-streamlit`.
- **FastAPI.** Lea `?lang=` o `Accept-Language` en el middleware, llame a `set_locale` y `reset_locale` en `finally`. Las rutas llaman a `t()` y `_()`. Consulte `examples/python-fastapi`.
- **Flask y Pyramid.** Establezca la configuración regional desde la solicitud e inyecte `_`, `t`, `current_locale`, `ui_languages` y `direction` en el contexto de la plantilla. Consulte `examples/python-flask`.
- **gettext existente.** Deje `_()`, `gettext()` y `ngettext()` en su lugar. Apunte `ui.gettext` al árbol `locales/` actual y ejecute `extract` y luego `translate-ui`. Consulte `examples/python-gettext`.
- **Django.** Utilice `gettext`, `ngettext` y `{% blocktrans %}`. La `ui-python-django` de la plantilla de inicialización coincide con el directorio `locale/` y el dominio `django` de Django.
- **Tkinter.** Llame a `t()` o `_()` al crear cada widget, luego reconstruya el texto visible después de `set_locale`.
- **PyQt / PySide.** `self.tr("...")` se extrae. Un archivo `.ui` aporta elementos `<string>` a menos que `notr="true"`. El atributo `comment` se convierte en el contexto de gettext.
- **PyWebView / PyWebKit.** Extraiga el shell de Python con las plantillas de Python anteriores. Extraiga la página HTML con marcadores `data-i18n` o con un documento HTML por configuración regional.
