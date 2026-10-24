<a id="python"></a>
# Python

Sélecteur pour les applications Python. L'extraction, les catalogues et les formes d'appel se trouvent dans [Applications Python](/fr/guide/ui-strings/python). La procédure pas à pas pour une application existante monolingue est [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide et PyWebView appellent l'assistant `i18n.py` généré (Python 3.10 ou version ultérieure). Django conserve le gettext de Django. Quatre copies exécutables sont fournies dans le dépôt : `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` et `examples/python-gettext`. Pyramid, Django, Tkinter, Qt et PyWebView ne possèdent pas de répertoire d'exemples distinct.

<a id="which-template"></a>
## Quel modèle choisir

| Framework | Modèle d'initialisation | Catalogue | Exemple |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | JSON à clés anglaises plates | [python-streamlit](/fr/examples#python-streamlit) |
| FastAPI | `ui-python` | JSON à clés anglaises plates | [python-fastapi](/fr/examples#python-fastapi) |
| Flask + Jinja, JSON plat | `ui-python` | JSON à clés anglaises plates | [python-flask](/fr/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` sous `translations/` | Utiliser les notes Flask ci-dessous |
| Pyramid | `ui-python` ou `ui-python-flask` | Identique à Flask | Même configuration que Flask |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | Pas de répertoire d'exemples |
| GNU gettext existant | `ui-python-gettext` | JSON plat et `.po` / `.mo`, ou gettext uniquement | [python-gettext](/fr/examples#python-gettext) |
| Tkinter | `ui-python` | JSON à clés anglaises plates | Pas de répertoire d'exemples |
| PyQt / PySide | `ui-python` ou un modèle gettext | JSON plat et/ou `.po` | Pas de répertoire d'exemples |
| PyWebView / PyWebKit | Un modèle Python pour le shell | Catalogues shell, plus marqueurs HTML ou un fichier HTML par locale | Pas de répertoire d'exemples |

`ui-python`, `ui-python-gettext` et `ui-python-flask` écrivent `i18n.py` lorsque ce fichier est manquant. `ui-python-django` ne le fait pas.

<a id="framework-notes"></a>
## Notes sur les frameworks

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` écrit la locale dans l'état de session et la chaîne de requête. Donnez à chaque widget une `key` fixe. Détails : [Locale — Streamlit](/fr/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

Lisez `?lang=` ou `Accept-Language` dans le middleware, appelez `set_locale` et `reset_locale` dans `finally` afin que les requêtes simultanées conservent leur propre locale. Détails : [Locale — FastAPI](/fr/guide/ui-strings/python#fastapi).

<a id="flask"></a>
### Flask et Pyramid

L'exemple [python-flask](/fr/examples#python-flask) utilise du JSON plat. `init -t ui-python-flask` est la disposition gettext sous `translations/` pour une application qui utilise déjà des catalogues de type Flask-Babel. Dans les deux cas, définissez la locale à partir de la requête et injectez `_`, `t`, `current_locale`, `ui_languages` et `direction` dans le contexte du modèle. Pyramid utilise le même modèle à portée de requête. Détails : [Locale — Flask and Pyramid](/fr/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

Conservez `gettext`, `ngettext` et `{% blocktrans %}`. `init -t ui-python-django` correspond au répertoire `locale/` de Django et au domaine `django`, et laisse l'exécution de Django en place. Détails : [Locale — Django](/fr/guide/ui-strings/python#django).

<a id="gettext"></a>
### gettext existant

Laissez `_()`, `gettext()` et `ngettext()` en place. Pointez `ui.gettext` vers l'arborescence de catalogue actuelle et exécutez `extract`, puis `translate-ui`. L'exemple [python-gettext](/fr/examples#python-gettext) est uniquement gettext (`flatOutput: false`). `init -t ui-python-gettext` écrit également du JSON plat. Détails : [Locale — Existing gettext](/fr/guide/ui-strings/python#gettext).

<a id="desktop"></a>
### Tkinter, Qt et PyWebView

Appelez `t()` ou `_()` lors de la création de chaque widget Tkinter, puis reconstruisez le texte visible après `set_locale`. Les appels PyQt et PySide `self.tr("...")` sont extraits, et les fichiers Qt `.ui` contribuent aux éléments `<string>` sauf si `notr="true"`. Pour PyWebView ou PyWebKit, extrayez le shell Python avec un modèle ci-dessus et extrayez la page HTML avec les marqueurs `data-i18n` ou avec un document HTML par locale. Détails : [Locale — Tkinter](/fr/guide/ui-strings/python#tkinter), [PyQt / PySide](/fr/guide/ui-strings/python#pyqt) et [PyWebView](/fr/guide/ui-strings/python#pywebview).
