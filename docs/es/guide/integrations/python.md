<a id="python"></a>
# Python

Cómo elegir la configuración adecuada para aplicaciones Python. La extracción, los catálogos y las formas de llamada residen en [aplicaciones Python](/es/guide/ui-strings/python). El paso a paso para una aplicación existente de una sola configuración regional es [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python), con una [indicación del agente](/es/guide/add-i18n-to-python#run-the-agent-prompt). Los catálogos de Django, Flask-Babel y las aplicaciones que ya usan gettext tienen su propia guía detallada e indicación: [Añadir i18n a una aplicación Django / Python con gettext](/es/guide/add-i18n-to-django-gettext).

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

Llama a `set_locale` antes de `st.set_page_config` y cualquier otro `t()`. Dibuja el menú en la aplicación para que la etiqueta pueda traducirse. `streamlit_language_selector()` escribe la configuración regional en el estado de la sesión y en la cadena de consulta cuando se dibuja el widget, lo cual es demasiado tarde para un título de página traducido, y su etiqueta permanece en inglés. Receta: [Añadir un selector de idioma](/es/guide/add-i18n-to-python#step-4-add-a-language-switch). Asigna a cada widget un `key` fijo. Detalles: [Configuración regional — Streamlit](/es/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

Lea `?lang=` o `Accept-Language` en el middleware, llame a `set_locale` y `reset_locale` en `finally` para que las solicitudes concurrentes mantengan su propio idioma. Detalles: [Locale — FastAPI](/es/guide/ui-strings/python#fastapi).

<a id="flask-and-pyramid"></a>
### Flask y Pyramid

El ejemplo de [python-flask](/es/examples#python-flask) utiliza JSON plano. `init -t ui-python-flask` es el diseño de gettext bajo `translations/` para una aplicación que ya utiliza catálogos al estilo Flask-Babel. En cualquier caso, establezca la configuración regional (locale) desde la solicitud e inyecte `_`, `t`, `current_locale`, `ui_languages` y `direction` en el contexto de la plantilla. Pyramid utiliza el mismo patrón con ámbito de solicitud. Detalles: [Locale — Flask and Pyramid](/es/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

Mantén `gettext`, `ngettext` y `{% blocktrans %}`. `init -t ui-python-django` coincide con el directorio `locale/` de Django y el dominio `django`, y deja el tiempo de ejecución de Django en su lugar. Tutorial: [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext). Detalles: [Configuración regional — Django](/es/guide/ui-strings/python#django).

<a id="existing-gettext"></a>
### gettext existente

Deja `_()`, `gettext()` y `ngettext()` en su lugar. Apunte `ui.gettext` al árbol de catálogo actual y ejecute `extract`, luego `translate-ui`. El ejemplo [python-gettext](/es/examples#python-gettext) es solo gettext (`flatOutput: false`). `init -t ui-python-gettext` también escribe JSON plano. Tutorial: [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext). Detalles: [Configuración regional — gettext existente](/es/guide/ui-strings/python#gettext).

<a id="tkinter-qt-and-pywebview"></a>
### Tkinter, Qt y PyWebView

Llame a `t()` o `_()` al crear cada widget de Tkinter, luego reconstruya el texto visible después de `set_locale`. Las llamadas a `self.tr("...")` de PyQt y PySide se extraen, y los archivos `.ui` de Qt aportan elementos `<string>` a menos que `notr="true"`. Para PyWebView o PyWebKit, extraiga el shell de Python con una plantilla arriba y extraiga la página HTML con marcadores `data-i18n` o con un documento HTML por configuración regional. Detalles: [Locale — Tkinter](/es/guide/ui-strings/python#tkinter), [PyQt / PySide](/es/guide/ui-strings/python#pyqt) y [PyWebView](/es/guide/ui-strings/python#pywebview).
