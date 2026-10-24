<a id="add-i18n-to-a-python-app"></a>
# Añadir i18n a una aplicación Python

Esta guía toma una aplicación Python que tiene un único idioma y añade configuraciones regionales con ai-i18n-tools. `migrate-python-i18n` aplica ediciones seguras en los puntos de llamada. Cualquier elemento que aún requiera revisión se incluye en un informe.

¿Ya utiliza catálogos de GNU gettext, Django o Flask? Mantenga esas llamadas. Elija la plantilla de inicialización correspondiente a continuación y deje que `extract` rellene los espacios vacíos del catálogo a partir de los archivos `.po` existentes.

<a id="install"></a>
## Instalar

Utilice el paquete npm cuando la máquina ya tenga Node.js `>=22.16.0` ([Instalación](/es/guide/installation)). Para un proyecto de Python, la ruta habitual es el ejecutable independiente de GitHub Release: Linux (`x64`, `arm64`), macOS (`arm64`, `x64`) y Windows (`x64`). Compruebe `SHA256SUMS.txt`, ejecute `chmod +x` en Unix y coloque el archivo en `PATH`. Los binarios no están firmados. Nombres de activos y sumas de comprobación: [Ejecutables independientes](/es/guide/installation#standalone-executables).

Establezca la clave de API para el proveedor que pasa a `init`. Por ejemplo, Inferencias más baratas:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama no necesita clave. Otros ajustes preestablecidos: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Elija una plantilla

| Aplicación actual | Comando | Lo que obtiene |
| --- | --- | --- |
| Cadenas codificadas, o nuevas llamadas a `t()` / `_()` | `ai-i18n-tools init -t ui-python -P cheaperinference` | JSON plano con claves en inglés y `i18n.py` |
| GNU gettext, y también quiere JSON plano | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON más `.po` / `.mo`, y `i18n.py` |
| Catálogos de Flask o Jinja bajo `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Catálogos de Gettext y `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (sin `i18n.py`) |

Edite `sourceLocale` y `targetLocales`. `sourceLocale` es el idioma de las cadenas en el código fuente (a menudo `en`). Conexión del framework: [Integraciones de Python](/es/guide/integrations/python). Formas de llamada y diseño del catálogo: [Aplicaciones Python](/es/guide/ui-strings/python).

<a id="wrap-strings"></a>
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

<a id="migrate"></a>
## Migrar puntos de llamada

`migrate-python-i18n` es una ejecución de prueba hasta que pase `--write`. Siempre escribe `migrate-python-i18n-report.md`. Los archivos `i18n.py` generados se omiten. Los campos de depuración como `{value=}` y las especificaciones de formato anidadas se notifican y se dejan en su lugar.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Lea el informe antes de `--write` cuando la ejecución de prueba enumere sitios que requieren revisión manual. El parámetro opcional `--report <path>` cambia la ruta del informe. El parámetro opcional `--ui-block` limita el análisis a un bloque de interfaz de usuario.

<a id="translate"></a>
## Elija modelos y traduzca

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

<a id="switch-locale"></a>
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

<a id="examples"></a>
## Ejemplos

| Ejemplo | Qué muestra |
| --- | --- |
| [python-streamlit](/es/examples#python-streamlit) | Panel, `t()` / `_()`, JSON plano |
| [python-fastapi](/es/examples#python-fastapi) | Configuración regional con ámbito de solicitud, JSON plano |
| [python-flask](/es/examples#python-flask) | Flask + Jinja, JSON plano |
| [python-gettext](/es/examples#python-gettext) | CLI de gettext existente; `translate-ui` actualiza `.po` y `.mo` |

Copie uno con `npx degit`, o descargue `ai-i18n-tools-python-examples.zip` desde la versión de GitHub. Comandos: [Ejemplos](/es/examples#python-examples).
