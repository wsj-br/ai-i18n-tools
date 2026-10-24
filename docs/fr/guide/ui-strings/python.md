<a id="python"></a>
# Applications Python

`ai-i18n-tools` extrait les chaînes d'interface utilisateur de Python ainsi que des fichiers Jinja, Django et Qt `.ui`, puis génère des fichiers JSON à clés anglaises, des catalogues GNU gettext, ou les deux. L'assistant d'exécution est un module de la bibliothèque standard `i18n.py` (Python 3.10 ou version ultérieure). Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid et FastAPI appellent cet assistant. Django utilise le gettext propre à Django.

Ajout de paramètres régionaux à une application monolingue existante : [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Sélecteur de framework : [Intégrations Python](/fr/guide/integrations/python). Liste des fonctions : [Runtime Python (`i18n.py`)](/fr/reference/programmatic-api#python-runtime).

Les copies exécutables se trouvent dans `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` et `examples/python-gettext`. Ce sont des projets Python. Les trois premiers utilisent un virtualenv et `pip install -r requirements.txt`. `python-gettext` utilise uniquement la bibliothèque standard. Ce ne sont pas des paquets npm. L'archive de version `ai-i18n-tools-python-examples.zip` contient les quatre mêmes répertoires. L'archive tar npm et l'exécutable autonome ne les contiennent pas.

<a id="init"></a>
## Scaffold

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` écrit du JSON plat et `i18n.py`. `ui-python-gettext` écrit du JSON et `.po` / `.mo`. `ui-python-flask` écrit des catalogues gettext sous `translations/` et `i18n.py`. `ui-python-django` écrit `locale/<lang>/LC_MESSAGES/django.po` et n'écrit pas `i18n.py`.

Les racines d'analyse ignorent `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache` et `.eggs`.

<a id="calls"></a>
## Appels qui traduisent

Recherchez d'abord l'entrée du catalogue, puis effectuez l'interpolation.

Portable :

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Sur Python 3.14, l'assistant accepte également une chaîne de modèle :

```python
translate(t"Hello, {name}!")
```

`translate` est un alias de `t`. Les arguments nommés remplacent les valeurs extraites de la chaîne de modèle.

Gettext natif, toujours sûr car le modèle est l'argument :

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

Ceux-ci sont évalués avant toute recherche dans le catalogue, l'extracteur les marque donc comme non sécurisés et `migrate-python-i18n` les réécrit :

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` est une simulation (dry run) tant que vous ne passez pas `--write`. Il écrit `migrate-python-i18n-report.md`. Les champs de débogage tels que `{value=}` et les spécifications de format imbriquées sont signalés et conservés en place.

`{% trans %}` et `{% blocktrans %}` deviennent des espaces réservés gettext `%(name)s`. Jinja supprime et réduit les espaces. Django conserve les espaces internes, sauf si la balise indique `trimmed`.

<a id="catalogs"></a>
## Catalogues

Les clés JSON plates sont la source anglaise. Un contexte utilise `context` + U+0004 + la source anglaise. Les emplacements pluriels restent `{md5}_one`, `{md5}_other` et les autres formes CLDR que `translate-ui` écrit déjà. L'assistant hache le singulier tronqué avec MD5 et lit les 8 premiers caractères hexadécimaux.

Les fichiers Gettext utilisent `msgctxt` pour le contexte et `msgid` / `msgid_plural` pour les pluriels. `ui.gettext.compileMo` écrit le `.mo` à côté du `.po`. `purge-locale` supprime le `.po` et le `.mo` de cette locale. Lorsque `flatOutput` est faux, il laisse les fichiers JSON plats intacts car ils n'ont pas été écrits.

`t(..., plurals=True)` avec une locale source anglaise et une source plurielle explicite ignore le modèle et stocke `one` / `other` à partir des chaînes sources.

<a id="locale"></a>
## Locale dans chaque framework

`set_locale` renvoie un jeton `ContextVar`. Réinitialisez-le dans `finally`, y compris dans les middlewares FastAPI et Flask, afin que les requêtes simultanées ne provoquent pas de fuite de paramètres régionaux.

- <a id="streamlit"></a>**Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")` écrit `st.session_state.locale` et `st.query_params["lang"]`. Donnez à chaque widget une `key` fixe. Voir `examples/python-streamlit`.
- <a id="fastapi"></a>**FastAPI.** Lisez `?lang=` ou `Accept-Language` dans le middleware, appelez `set_locale`, et `reset_locale` dans `finally`. Les routes appellent `t()` et `_()`. Voir `examples/python-fastapi`.
- <a id="flask"></a>**Flask et Pyramid.** Définissez la locale à partir de la requête et injectez `_`, `t`, `current_locale`, `ui_languages` et `direction` dans le contexte du modèle. Voir `examples/python-flask`.
- <a id="gettext"></a>**gettext existant.** Laissez `_()`, `gettext()` et `ngettext()` en place. Pointez `ui.gettext` vers l'arborescence `locales/` actuelle et exécutez `extract` puis `translate-ui`. Voir `examples/python-gettext`.
- <a id="django"></a>**Django.** Utilisez `gettext`, `ngettext` et `{% blocktrans %}`. Le modèle d'initialisation `ui-python-django` correspond au répertoire `locale/` et au domaine `django` de Django.
- <a id="tkinter"></a>**Tkinter.** Appelez `t()` ou `_()` lors de la création de chaque widget, puis reconstruisez le texte visible après `set_locale`.
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")` est extrait. Un fichier `.ui` contribue aux éléments `<string>` sauf si `notr="true"`. L'attribut `comment` devient le contexte gettext.
- <a id="pywebview"></a>**PyWebView / PyWebKit.** Extrayez le shell Python avec les modèles Python ci-dessus. Extrayez la page HTML avec les marqueurs `data-i18n` ou avec un document HTML par locale.
