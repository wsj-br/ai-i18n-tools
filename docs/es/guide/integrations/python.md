<a id="python"></a>
# Python

Selector para aplicaciones Python. La extracción, los catálogos y las formas de llamada residen en [aplicaciones Python](/es/guide/ui-strings/python). El paso a paso para una aplicación existente de una sola configuración regional es [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python), con un [prompt de `i18n.py`](/es/guide/add-i18n-to-python#agent-prompt-i18n-py) y un [prompt de Django / gettext](/es/guide/add-i18n-to-python#agent-prompt-django-gettext).

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide y PyWebView llaman al asistente `i18n.py` generado (Python 3.10 o superior). Django mantiene el gettext de Django. Se incluyen cuatro copias ejecutables en el repositorio: `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` y `examples/python-gettext`. Pyramid, Django, Tkinter, Qt y PyWebView no tienen un directorio de ejemplos independiente.

<a id="which-template"></a>
## Qué plantilla elegir

| Framework | Plantilla de inicialización | Catálogo | Ejemplo |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | JSON plano indexado por la cadena de origen | [python-streamlit](/es/examples#python-streamlit) |
| FastAPI | `ui-python` | JSON plano indexado por la cadena de origen | [python-fastapi](/es/examples#python-fastapi) |
| Flask + Jinja, JSON plano | `ui-python` | JSON plano indexado por la cadena de origen | [python-flask](/es/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` bajo `translations/` | Utilice las notas de Flask a continuación |
| Pyramid | `ui-python` o `ui-python-flask` | Igual que Flask | Misma configuración que Flask |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | Sin directorio de ejemplos |
| GNU gettext existente | `ui-python-gettext` | JSON plano y `.po` / `.mo`, o solo gettext | [python-gettext](/es/examples#python-gettext) |
| Tkinter | `ui-python` | JSON plano indexado por la cadena de origen | Sin directorio de ejemplo |
| PyQt / PySide | `ui-python` o una plantilla gettext | JSON plano y/o `.po` | Sin directorio de ejemplos |
| PyWebView / PyWebKit | Una plantilla Python para el shell | Catálogos de shell, además de marcadores HTML o un archivo HTML por idioma | Sin directorio de ejemplos |

`ui-python`, `ui-python-gettext` y `ui-python-flask` escriben `i18n.py` cuando falta ese archivo. `ui-python-django` no lo hace. Añada `--with-readme` para traducir también el README del repositorio: [Añada i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme).

<a id="framework-notes"></a>
## Notas sobre los frameworks

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` escribe el idioma en el estado de la sesión y en la cadena de consulta. Asigne a cada widget una `key` fija. Detalles: [Locale — Streamlit](/es/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

Lea `?lang=` o `Accept-Language` en el middleware, llame a `set_locale` y `reset_locale` en `finally` para que las solicitudes concurrentes mantengan su propio idioma. Detalles: [Locale — FastAPI](/es/guide/ui-strings/python#fastapi).

<a id="flask"></a>
### Flask y Pyramid

El ejemplo de [python-flask](/es/examples#python-flask) utiliza JSON plano. `init -t ui-python-flask` es el diseño de gettext bajo `translations/` para una aplicación que ya utiliza catálogos al estilo Flask-Babel. En cualquier caso, establezca la configuración regional (locale) desde la solicitud e inyecte `_`, `t`, `current_locale`, `ui_languages` y `direction` en el contexto de la plantilla. Pyramid utiliza el mismo patrón con ámbito de solicitud. Detalles: [Locale — Flask and Pyramid](/es/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

Mantenga `gettext`, `ngettext` y `{% blocktrans %}`. `init -t ui-python-django` coincide con el directorio `locale/` de Django y el dominio `django`, y deja el tiempo de ejecución de Django intacto. Detalles: [Locale — Django](/es/guide/ui-strings/python#django).

<a id="gettext"></a>
### gettext existente

Deje `_()`, `gettext()` y `ngettext()` en su lugar. Apunte `ui.gettext` al árbol de catálogos actual y ejecute `extract`, y luego `translate-ui`. El ejemplo de [python-gettext](/es/examples#python-gettext) es solo para gettext (`flatOutput: false`). `init -t ui-python-gettext` también escribe JSON plano. Detalles: [Locale — Existing gettext](/es/guide/ui-strings/python#gettext).

<a id="desktop"></a>
### Tkinter, Qt y PyWebView

Llame a `t()` o `_()` al crear cada widget de Tkinter, luego reconstruya el texto visible después de `set_locale`. Las llamadas a `self.tr("...")` de PyQt y PySide se extraen, y los archivos `.ui` de Qt aportan elementos `<string>` a menos que `notr="true"`. Para PyWebView o PyWebKit, extraiga el shell de Python con una plantilla arriba y extraiga la página HTML con marcadores `data-i18n` o con un documento HTML por configuración regional. Detalles: [Locale — Tkinter](/es/guide/ui-strings/python#tkinter), [PyQt / PySide](/es/guide/ui-strings/python#pyqt) y [PyWebView](/es/guide/ui-strings/python#pywebview).
