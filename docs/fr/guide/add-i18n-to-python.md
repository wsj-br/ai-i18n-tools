<a id="add-i18n-to-a-python-app"></a>
# Ajouter l'i18n à une application Python

Cette procédure pas à pas utilise une application Python monolingue et y ajoute des paramètres régionaux avec ai-i18n-tools. Les modifications sécurisées des points d'appel sont effectuées par `migrate-python-i18n`. Tout ce qui nécessite encore une vérification est répertorié dans un rapport.

Vous utilisez déjà des catalogues GNU gettext, Django ou Flask ? Conservez ces appels. Choisissez le modèle d'initialisation correspondant ci-dessous et laissez `extract` remplir les emplacements de catalogue vides à partir des fichiers `.po` existants.

<a id="install"></a>
## Installer

Utilisez le paquet npm si la machine dispose déjà de Node.js `>=22.16.0` ([Installation](/fr/guide/installation)). Pour un projet Python, le chemin habituel est l'exécutable autonome issu de la version GitHub — Linux (`x64`, `arm64`), macOS (`arm64`, `x64`) et Windows (`x64`). Vérifiez `SHA256SUMS.txt`, exécutez `chmod +x` sur Unix et placez le fichier dans `PATH`. Les binaires ne sont pas signés. Noms des ressources et sommes de contrôle : [Exécutables autonomes](/fr/guide/installation#standalone-executables).

Définissez la clé API pour le fournisseur que vous passez à `init`. Par exemple, Cheaper Inference :

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama ne nécessite aucune clé. Autres préréglages : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Choisir un modèle

| Application actuelle | Commande | Ce que vous obtenez |
| --- | --- | --- |
| Chaînes de caractères codées en dur, ou nouveaux appels `t()` / `_()` | `ai-i18n-tools init -t ui-python -P cheaperinference` | JSON à clés anglaises plates et `i18n.py` |
| GNU gettext, et vous voulez aussi du JSON plat | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON plus `.po` / `.mo`, et `i18n.py` |
| Catalogues Flask ou Jinja sous `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Catalogues Gettext et `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (sans `i18n.py`) |

Modifiez `sourceLocale` et `targetLocales`. `sourceLocale` est la langue des chaînes dans le code source (souvent `en`). Configuration du framework : [Intégrations Python](/fr/guide/integrations/python). Formats d'appel et structure du catalogue : [Applications Python](/fr/guide/ui-strings/python).

<a id="wrap-strings"></a>
## Encapsuler les chaînes

Recherchez d'abord l'entrée du catalogue, puis effectuez l'interpolation. Importez `t` et `_` depuis le fichier `i18n.py` généré (Django conserve `gettext` et `ngettext`).

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Ces éléments sont évalués avant toute recherche dans le catalogue. L'extracteur les marque comme non sécurisés et `migrate-python-i18n` les réécrit :

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="migrate"></a>
## Migrer les points d'appel

`migrate-python-i18n` effectue une simulation (dry run) jusqu'à ce que vous passiez `--write`. Il écrit toujours `migrate-python-i18n-report.md`. Les fichiers `i18n.py` générés sont ignorés. Les champs de débogage tels que `{value=}` et les spécifications de format imbriquées sont signalés et conservés tels quels.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Lisez le rapport avant `--write` lorsque la simulation répertorie des sites nécessitant une révision manuelle. L'option `--report <path>` permet de modifier le chemin du rapport. L'option `--ui-block` limite l'analyse à un seul bloc d'interface utilisateur.

<a id="translate"></a>
## Choisir les modèles et traduire

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` remplace uniquement `translationModels`. Le même classement se trouve sous l'onglet [Models](/fr/guide/translation-dashboard/models). Ensuite, extrayez et traduisez :

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` écrit `strings.json` et `ui-languages.json`. `translate-ui` remplit les fichiers JSON plats et, lorsque `ui.gettext` est défini, les catalogues `.po` / `.mo`. Ne modifiez pas manuellement ces catalogues générés.

<a id="switch-locale"></a>
## Changer de locale à l'exécution

`set_locale` renvoie un jeton `ContextVar`. Réinitialisez-le lorsque la requête ou le rappel se termine.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

Le middleware FastAPI et Flask doit se réinitialiser dans `finally` (Flask : `teardown_request`) afin que les requêtes simultanées ne provoquent pas de fuite de locale. Les projets Django conservent l'activation de locale de Django et n'utilisent pas `i18n.py`. Notes par framework : [Locale dans chaque framework](/fr/guide/ui-strings/python#locale).

<a id="examples"></a>
## Exemples

| Exemple | Ce qu'il montre |
| --- | --- |
| [python-streamlit](/fr/examples#python-streamlit) | Tableau de bord, `t()` / `_()`, JSON plat |
| [python-fastapi](/fr/examples#python-fastapi) | Locale limitée à la requête, JSON plat |
| [python-flask](/fr/examples#python-flask) | Flask + Jinja, JSON plat |
| [python-gettext](/fr/examples#python-gettext) | CLI gettext existante ; `translate-ui` actualise `.po` et `.mo` |

Copiez-en un avec `npx degit`, ou téléchargez `ai-i18n-tools-python-examples.zip` depuis la version GitHub. Commandes : [Exemples](/fr/examples#python-examples).
