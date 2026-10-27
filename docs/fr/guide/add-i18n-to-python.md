<a id="add-i18n-to-a-python-app"></a>
# Ajouter l'i18n à une application Python

Ce guide prend une application Python qui utilise une seule langue et y ajoute des locales avec ai-i18n-tools. Les chaînes de caractères brutes destinées à l'utilisateur sont encapsulées manuellement ou avec les invites sous [Encapsuler les chaînes](#wrap-strings). `migrate-python-i18n` ne répare que les appels non sécurisés qui sont déjà encapsulés. Tout ce qui nécessite encore un examen est listé dans un rapport.

Vous utilisez déjà des catalogues GNU gettext, Django ou Flask ? Conservez ces appels. Choisissez le modèle d'initialisation correspondant ci-dessous et laissez `extract` remplir les emplacements de catalogue vides à partir des fichiers `.po` existants.

Les étapes :

1. [Installer](#install) la CLI et définir la clé API.
2. [Choisir un modèle](#pick-a-template) et exécuter `init`.
3. [Encapsuler les chaînes](#wrap-strings) dans `t()` ou `_()`.
4. [Migrer les sites d'appel](#migrate) qui sont déjà encapsulés de manière non sécurisée.
5. [Choisir les modèles et traduire](#translate).
6. [Changer de locale à l'exécution](#switch-locale).
7. [Maintenir la traduction](#keep-it-translated).

Vous n'êtes pas sûr que ce soit votre cas ? Voir [Pas votre cas ?](#not-your-case) à la fin.

<a id="install"></a>
## Installer

Utilisez le package npm lorsque la machine dispose déjà de Node.js `>=22.16.0` ([Installation](/fr/guide/installation)). Pour un projet Python, installez l'exécutable autonome (sans Node.js).

Linux et macOS :

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell) :

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

L'installateur vérifie `SHA256SUMS.txt`, installe la commande en tant que `ai-i18n-tools`, et l'ajoute à `PATH`. Les binaires ne sont pas notariés ni signés Authenticode. Étapes manuelles et noms des ressources : [Exécutables autonomes](/fr/guide/installation#standalone-executables).

Définissez la clé API pour le fournisseur que vous passez à `init`. Par exemple, Cheaper Inference :

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama ne nécessite aucune clé. Autres préréglages : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Choisir un modèle

| Application actuelle | Commande | Ce que vous obtenez |
| --- | --- | --- |
| Chaînes codées en dur, ou nouveaux appels `t()` / `_()` | `ai-i18n-tools init -t ui-python -P cheaperinference` | JSON plat indexé par la chaîne de la langue source, et `i18n.py` |
| GNU gettext, et vous voulez aussi du JSON plat | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON plus `.po` / `.mo`, et `i18n.py` |
| Catalogues Flask ou Jinja sous `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Catalogues Gettext et `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (sans `i18n.py`) |

Modifiez `sourceLocale` et `targetLocales`. `sourceLocale` est la langue des chaînes dans la source. Toute langue BCP-47 est valide ; les exemples utilisent souvent `en`. Intégration du framework : [Intégrations Python](/fr/guide/integrations/python). Formes d'appel et disposition du catalogue : [Applications Python](/fr/guide/ui-strings/python).

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

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Utilisez ceci pour Streamlit, FastAPI, Flask avec JSON plat, Tkinter, Qt et un shell PyWebView. Copiez-le dans un agent de codage. Un projet Django ou gettext existant devrait plutôt utiliser la [prochaine invite](#agent-prompt-django-gettext).

<details class="agent-prompt">
<summary>Invite de l'agent : assistant i18n.py</summary>

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

Utilisez ceci lorsque l'application appelle déjà Django ou GNU gettext, ou lorsque vous souhaitez conserver les catalogues `.po`. N'ajoutez pas `i18n.py`.

Les modèles d'initialisation reconnaissent exactement ces noms d'appel : `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` et `self.tr`. Les variantes paresseuses (lazy) et noop ne figurent pas dans cette liste. Ajoutez les noms que le projet appelle réellement — généralement `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy` et `gettext_noop` — à `ui.uiExtractor.funcNames`, sinon `extract` les ignore. `ngettext_lazy` est lu comme singulier plus pluriel, et `pgettext_lazy` comme contexte plus message, seulement après que le nom est listé. `{% trans %}` et `{% blocktrans %}` dans les modèles sont collectés séparément.

<details class="agent-prompt">
<summary>Invite de l'agent : Django et gettext natif</summary>

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

<a id="migrate"></a>

<a id="migrate-call-sites"></a>
## Migrer les sites d'appel

`migrate-python-i18n` effectue une simulation (dry run) jusqu'à ce que vous passiez `--write`. Il écrit toujours `migrate-python-i18n-report.md`. Les fichiers `i18n.py` générés sont ignorés. Les champs de débogage tels que `{value=}` et les spécifications de format imbriquées sont signalés et conservés tels quels.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Lisez le rapport avant `--write` lorsque la simulation répertorie des sites nécessitant une révision manuelle. L'option `--report <path>` permet de modifier le chemin du rapport. L'option `--ui-block` limite l'analyse à un seul bloc d'interface utilisateur.

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
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

<a id="switch-locale-at-runtime"></a>
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

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` (ou `extract` puis `translate-ui`) après avoir modifié le texte source. Le cache signifie que seules les chaînes nouvelles ou modifiées sont envoyées au modèle. Exécutez-le en CI pour que les traductions ne divergent pas. `ai-i18n-tools dashboard` ouvre le [tableau de bord de traduction](/fr/guide/translation-dashboard/) pour réviser les traductions.

Pour traduire `README.md` dans la même exécution, générez avec `--with-readme` (ou ajoutez le bloc à une configuration existante). Consultez [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Vous avez | Lisez |
| --- | --- |
| Une application JS/TS | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) |
| Un site web ou un site de documentation | [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website) |
| Un fichier README de dépôt ou d'autres fichiers Markdown | [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme) |
| JSON de locale imbriquée | [JSON](/fr/guide/json) |

<a id="examples"></a>
## Exemples

| Exemple | Ce qu'il montre |
| --- | --- |
| [python-streamlit](/fr/examples#python-streamlit) | Tableau de bord, `t()` / `_()`, JSON plat |
| [python-fastapi](/fr/examples#python-fastapi) | Locale limitée à la requête, JSON plat |
| [python-flask](/fr/examples#python-flask) | Flask + Jinja, JSON plat |
| [python-gettext](/fr/examples#python-gettext) | CLI gettext existante ; `translate-ui` actualise `.po` et `.mo` |

Copiez-en un avec `npx degit`, ou téléchargez `ai-i18n-tools-python-examples.zip` depuis la version GitHub. Commandes : [Exemples](/fr/examples#python-examples).
