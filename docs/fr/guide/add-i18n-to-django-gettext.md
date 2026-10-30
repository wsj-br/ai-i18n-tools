<a id="add-i18n-to-a-django--python-gettext-app"></a>
# Ajouter l'i18n à une application Django / Python utilisant gettext

Cette page s'adresse aux applications Python qui utilisent GNU gettext pour la traduction, ou à celles qui le feront : Django, Flask avec des catalogues de style Flask-Babel, ou toute application qui appelle `gettext()`. Vous conservez les appels gettext. ai-i18n-tools les lit, traduit les messages et écrit les fichiers `.po` et `.mo` compilés que votre application charge déjà. Aucun module d'aide n'est nécessaire.

Le moyen le plus rapide est de donner une invite à un agent de codage sur cette page. Il configure, enveloppe vos chaînes de caractères, vérifie le résultat et peut ajouter un sélecteur de langue. Vous installez l'interface de ligne de commande (CLI), choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela entraîne des coûts sur votre compte et réécrit vos fichiers `.po` et `.mo`.

Vous développez une application Streamlit, FastAPI, Flask, de bureau ou un script qui n'utilise pas gettext aujourd'hui ? Utilisez plutôt [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Il ajoute un petit assistant `i18n.py` et écrit des catalogues JSON. Vous ne savez pas ce qui s'applique ? Voir [Pas votre cas ?](#not-your-case) à la fin.

Le flux :

1. [Installer la CLI et choisir un fournisseur](#install-and-choose-a-provider).
2. [Initialiser le projet](#initialise-the-project) avec `init`.
3. [Exécuter l'invite de l'agent](#run-the-agent-prompt).
4. [Examiner le résultat](#review-the-result).
5. [Choisir les modèles et traduire](#translate), puis vérifier une langue.
6. [Maintenir la traduction](#keep-it-translated).

Vous préférez effectuer les modifications vous-même, ou vous voulez savoir ce que fait l'invite ? [Faites-le manuellement](#do-it-by-hand) parcourt les mêmes étapes une par une.

<a id="install-and-choose-a-provider"></a>
## Installer et choisir un fournisseur

Vous faites cette partie, pas l'agent. L'installateur modifie votre machine, et la clé API est un secret qui doit rester dans votre shell, pas dans une invite.

Utilisez le package npm lorsque la machine dispose déjà de Node.js `>=22.16.0` ([Installation](/fr/guide/installation)). Pour un projet Python, installez l'exécutable autonome (sans Node.js).

Linux et macOS :

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell) :

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

L'installateur vérifie `SHA256SUMS.txt`, installe la commande sous le nom `ai-i18n-tools` et l'ajoute à `PATH`. Les binaires ne sont pas notarisés ni signés Authenticode. Étapes manuelles et noms des ressources : [Exécutables autonomes](/fr/guide/installation#standalone-executables).

Vérifier l'installation :

```bash
ai-i18n-tools --version
```

Ensuite, choisissez un fournisseur et définissez sa clé API dans le shell qui exécutera la traduction. Par exemple, pour Cheaper Inference :

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama ne nécessite pas de clé. Autres préréglages : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers). Notez le nom du fournisseur, car vous le passerez à `init` à l'étape suivante. L'agent n'a jamais besoin de la clé : il exécute uniquement des commandes qui n'effectuent aucun appel de modèle. Vous utiliserez la clé plus tard, lorsque vous [traduirez](#translate).

<a id="initialise-the-project"></a>
## Initialiser le projet

Vous exécutez ceci une seule fois, avant l'invite. Il écrit la configuration et utilise le fournisseur que vous avez choisi ci-dessus. Choisissez le modèle qui correspond à votre application :

| Votre application | Modèle | Catalogues écrits |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` et `.mo` |
| Flask avec des catalogues de style Flask-Babel | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` et `.mo` |
| Toute autre application Python utilisant déjà GNU gettext | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` et `.mo` |

Exécutez l'initialisation avec le nom du modèle et le fournisseur que vous avez choisi :

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

Exécutez `init` une seule fois. Il réécrit `ai-i18n-tools.config.json` à chaque exécution, donc une deuxième exécution annule les modifications que vous avez apportées. Si la configuration existe déjà et est personnalisée, ignorez `init` et modifiez la configuration.

`ui-python-gettext` et `ui-python-flask` écrivent également un assistant `i18n.py` lorsque ce fichier est manquant. Une application gettext n'en a pas besoin, supprimez-le donc (l'invite le fait pour vous). `ui-python-gettext` écrit également des fichiers JSON à côté des catalogues gettext. Pour écrire uniquement des catalogues gettext, définissez `"flatOutput": false` dans le bloc `ui` (l'invite le fait aussi). `ui-python-django` n'écrit ni l'assistant ni le JSON, car Django gère son propre système de traduction.

Modifiez ensuite `sourceLocale` et `targetLocales` dans `ai-i18n-tools.config.json`. `sourceLocale` est la langue des chaînes de caractères de votre code. Toute langue BCP-47 est valide ; les exemples utilisent souvent `en`. Écrivez les codes cibles comme `pt-BR`. Le dossier du catalogue est `pt_BR`, le format attendu par gettext et Django (`localeFormat` est `posix`).

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot ou similaire), démarrez une nouvelle conversation et collez l'invite ci-dessous. Le projet doit déjà être initialisé. Il n'y a rien à modifier. Si vous voulez omettre quelque chose, par exemple pas de sélecteur de langue, précisez-le dans le même message.

L'agent vérifie d'abord que la CLI et la configuration existent, et s'arrête avec des instructions si l'une d'elles est manquante. Ensuite, il fonctionne en quatre parties :

- La partie 1 adapte la configuration à vos catalogues existants et supprime le `i18n.py` que certains modèles écrivent.
- La partie 2 enveloppe les chaînes de caractères destinées à l'utilisateur avec les appels gettext que vous utilisez déjà, et les balises de modèle.
- La partie 3 exécute `extract` et trouve les appels qui formatent avant la recherche.
- La partie 4 ajoute le sélecteur de langue.

Il n'installe ni n'initialise rien, ne lit pas votre clé API et ne traduit pas. Il n'exécute pas `makemessages` ou `compilemessages`, et il laisse vos fichiers `.po` et `.mo` intacts. La traduction est l'étape après la révision, et c'est vous qui l'exécutez.

<details class="agent-prompt">
<summary>Invite de l'agent : ajouter des langues à une application Django ou gettext</summary>

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
## Réviser le résultat

L'agent termine avec un rapport. Vérifiez-le avant de traduire :

- Le diff. Seuls les appels enveloppés, les balises de modèle, la configuration et le sélecteur de langue devraient avoir changé. Vos fichiers `.po` et `.mo` devraient être intacts jusqu'à ce que vous traduisiez.
- `ai-i18n-tools.config.json` : `gettext.outputDir` et `domain` pointent vers les catalogues que votre application charge, et `sourceRoots` couvre le code de l'application.
- `ai-i18n-tools extract` liste les nouveaux messages et conserve les traductions déjà présentes dans vos fichiers `.po`.
- L'exécution à blanc de `migrate-python-i18n` ne liste rien qui reste à corriger.
- Les vérifications de Django et vos tests passent, et l'application a le même aspect dans la langue source.
- Les chaînes ignorées et les cas ambigus dans le rapport : pluriels laissés comme une seule chaîne, un mot avec deux significations, et phrases construites à partir de morceaux traduits. Décidez-les manuellement.

Commitez cet état. `translate-ui` réécrit vos fichiers `.po`, vous voudrez donc un diff propre à examiner.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

Vous exécutez cette partie. Elle utilise votre clé API, dépense de l'argent sur votre compte et réécrit vos fichiers `.po`, alors commitez d'abord.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` remplace uniquement `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models). Ensuite, traduisez :

```bash
ai-i18n-tools translate-ui
```

`translate-ui` écrit le modèle `.pot`, un `.po` par locale cible, et le `.mo` compilé. Laissez ces fichiers non modifiés à partir de maintenant, car la prochaine exécution les régénérera. Examinez le premier diff avant de le commiter.

Redémarrez le serveur s'il ne prend pas en compte les nouveaux fichiers `.mo`.

<a id="check-one-language"></a>
### Vérifier une langue

Passez à une langue cible et regardez une page avec quelques chaînes enveloppées. Les textes qui affichent toujours la langue source n'ont pas été enveloppés, ou le `.mo` n'a pas été rechargé. Les textes qui affichent `%(name)s` dans la sortie ont perdu leur dictionnaire. Vérifiez les espaces réservés dans le fichier `.po`.

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` (ou `extract` puis `translate-ui`) après avoir modifié le texte source. Le cache signifie que seules les chaînes nouvelles ou modifiées sont envoyées au modèle. Exécutez-le en CI pour que les traductions ne divergent pas. `ai-i18n-tools dashboard` ouvre le [tableau de bord de traduction](/fr/guide/translation-dashboard/) pour réviser les traductions.

`purge-locale` supprime les fichiers `.po` et `.mo` d'une locale. Commitez les fichiers `.po`. Commitez également les fichiers `.mo`, à moins que votre build ne les compile.

Pour traduire `README.md` dans la même exécution, générez avec `--with-readme` (ou ajoutez le bloc à une configuration existante). Consultez [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faire manuellement

Suivez ces étapes si vous préférez apporter les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Chaque étape correspond à une partie de l'invite. Vous devez toujours [installer l'interface de ligne de commande (CLI)](#install-and-choose-a-provider), [initialiser le projet](#initialise-the-project) et [traduire](#translate) à la fin.

1. [Pointer la configuration vers vos catalogues](#point-the-config).
2. [Encapsuler les chaînes](#wrap-strings) avec les appels gettext que vous utilisez déjà.
3. [Extraire et vérifier les appels](#extract-and-check).
4. [Changer de langue à l'exécution](#switch-language).

<a id="step-1-point-the-config-at-your-catalogs"></a>
## Étape 1 : Pointer la configuration vers vos catalogues

Le modèle définit des valeurs par défaut pertinentes. Voici celui de Django :

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

Vérifiez quatre points par rapport à votre projet :

- `gettext.outputDir` et `potPath` sont l'endroit où vos catalogues résident déjà. Django : le dossier dans `LOCALE_PATHS`, ou le dossier `locale/` à l'intérieur d'une application. Flask-Babel : `translations/`.
- `gettext.domain` est le nom de fichier que votre application charge. Django utilise `django`. Flask-Babel utilise `messages`. Pour gettext simple, c'est le domaine dans votre appel `gettext.translation(...)`.
- `sourceRoots` liste les dossiers que `extract` scanne. Restreignez-le de `"."` à votre code d'application, afin que les tests et les scripts restent en dehors du catalogue.
- `stringsJson` est le cache d'extraction, un fichier que cet outil possède. Gardez-le à côté des catalogues. Ce n'est pas un fichier d'exécution. Votre application ne le lit jamais.

Lorsque chaque application Django conserve son propre dossier `locale/`, utilisez un bloc `ui` par arborescence de catalogue. `ui` accepte une liste, et `--ui-block` exécute un bloc. Les chemins doivent être uniques entre les blocs. Voir [Configuration](/fr/reference/configuration).

`ingestExistingPo` est activé par défaut. Pendant `extract`, les traductions déjà présentes dans vos fichiers `.po` remplissent les emplacements vides. Une traduction déjà définie n'est pas remplacée. Commitez vos catalogues avant le premier `translate-ui`, car il réécrit les fichiers `.po` et compile les fichiers `.mo`. Examinez cette différence.

`compileMo` écrit le `.mo` pour vous, vous n'avez donc pas besoin de `compilemessages` dans ce flux de travail. Choisissez un outil pour écrire les catalogues : l'exécution de `makemessages` après `translate-ui` réécrit les mêmes fichiers `.po`.

<a id="step-2-wrap-strings"></a>
## Étape 2 : Encapsuler les chaînes

`extract` enregistre une chaîne uniquement lorsqu'il s'agit d'un littéral passé à l'un des noms de fonction dans `ui.uiExtractor.funcNames`, ou d'une balise de modèle. Gardez les appels que vous avez. Ajoutez ce qui manque.

Code Python :

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

Les espaces réservés utilisent `%(name)s`. Passez les valeurs après la recherche avec `%`, jamais avant. Les modèles, formulaires et paramètres s'exécutent lorsque le module est importé, ils utilisent donc la forme paresseuse (lazy). N'appliquez pas `%` à une chaîne paresseuse (lazy string) au moment de l'importation. Utilisez `format_lazy` à la place.

Modèles (Django `{% load i18n %}`, ou Jinja dans Flask) :

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}`, et `{% blocktrans %}` sont collectés de manière autonome. Une variable de modèle telle que <code v-pre>{{ name }}</code> est stockée sous la forme `%(name)s`. Gardez-le sous cette forme.

Les noms que `extract` ne connaît pas sont ignorés. La liste par défaut est `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext`, et `self.tr`. Si le code appelle directement `gettext_lazy("…")`, `ngettext_lazy`, `pgettext_lazy`, `npgettext`, ou `gettext_noop`, ajoutez ces noms à `ui.uiExtractor.funcNames`. Lorsque vous importez la fonction paresseuse (lazy) en tant que `_`, comme dans `gettext_lazy as _`, le nom `_` est déjà couvert.

Encapsulez le texte qu'une personne voit : étiquettes, titres, messages, texte de formulaire et de modèle, e-mails. Laissez les identifiants, les URL, les noms de champs, les clés de paramètres, les messages de journal et les migrations tels quels. Ne reformulez pas le texte source. Une traduction manquante renvoie la phrase source, ainsi l'application apparaît la même dans la langue source.

Ces appels évaluent le formatage avant la recherche, donc la chaîne ne correspond jamais à une entrée de catalogue :

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## Étape 3 : Extraire et vérifier les appels

Exécutez `extract` une fois que les appels sont encapsulés. Il écrit le cache d'extraction et remplit les emplacements vides à partir de vos fichiers `.po` existants. Il n'appelle pas de modèle.

```bash
ai-i18n-tools extract
```

Recherchez ensuite les appels qui formatent avant la recherche. `migrate-python-i18n` les trouve. Exécutez-le sans `--write` :

```bash
ai-i18n-tools migrate-python-i18n
```

Il écrit `migrate-python-i18n-report.md`. Lisez-le et corrigez chaque appel listé manuellement avec `%(name)s` et un dictionnaire. Supprimez le rapport ou ignorez-le via Git.

Ne passez pas `--write` sur cette page. Cette option réécrit une f-string ou un appel `.format()` en `t("…", name=name)`, un appel qui n'existe que dans l'aide `i18n.py`. Une application gettext n'a pas de `t`. Un rapport sans lignes signifie que les appels encapsulés sont sûrs. Cela ne signifie pas que chaque phrase a été encapsulée, alors lisez le diff de `strings.json` et recherchez le texte que vous vous attendiez à voir.

<a id="step-4-switch-language-at-runtime"></a>
## Étape 4 : Changer de langue à l'exécution

Votre framework choisit la langue. ai-i18n-tools n'ajoute pas de menu ni d'aide.

<a id="django"></a>
### Django

Dans `settings.py` :

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

`LocaleMiddleware` se place après le middleware de session et avant `CommonMiddleware`. `LANGUAGE_CODE` est la langue source. `LANGUAGES` liste les langues qu'un visiteur peut choisir. `LOCALE_PATHS` pointe vers le dossier dans lequel `gettext.outputDir` écrit, à moins que chaque application ne conserve son propre dossier `locale/`.

Ajoutez la vue de changement de langue de Django à `urls.py` :

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

Ajoutez ensuite un formulaire à un modèle :

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

La vue enregistre le choix dans un cookie. Pour placer la langue dans l'URL à la place, utilisez `i18n_patterns`. Les deux sont des fonctionnalités standard de Django. Consultez la documentation de Django sur l'internationalisation.

<a id="plain-gettext-and-flask-babel"></a>
### gettext simple et Flask-Babel

Chargez le catalogue pour la langue souhaitée et appelez-le. L'exemple [python-gettext](/fr/examples#python-gettext) le fait dans un outil en ligne de commande :

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

Convertissez `pt-BR` en `pt_BR`, le nom de dossier que `translate-ui` a écrit. Conservez `fallback=True` afin qu'un catalogue manquant affiche le texte source. Dans une application web, construisez l'objet de traductions par requête et n'en installez pas un globalement avec `gettext.install`, sinon les requêtes concurrentes partageront une langue. Dans Flask-Babel, renvoyez le code de votre fonction de sélection de locale, et conservez `translations/` comme répertoire de traduction.

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#translate).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Vous avez | Lisez |
| --- | --- |
| Une application Streamlit, FastAPI, Flask, de bureau ou script sans gettext | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Une application JS/TS | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) |
| Un site web ou un site de documentation | [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website) |
| Un fichier README de dépôt ou d'autres fichiers Markdown | [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Exemples

| Exemple | Ce qu'il montre |
| --- | --- |
| [python-gettext](/fr/examples#python-gettext) | Un outil en ligne de commande gettext existant ; `translate-ui` rafraîchit `.po` et `.mo` |

Il n'y a pas de répertoire d'exemple Django. L'exemple `python-gettext` montre la même forme de configuration avec le domaine `messages`. Copiez-le avec `npx degit`, ou téléchargez `ai-i18n-tools-python-examples.zip` depuis la version GitHub. Commandes : [Exemples](/fr/examples#python-examples).
