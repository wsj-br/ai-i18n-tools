<a id="add-i18n-to-a-python-app"></a>
# Ajouter l'i18n à une application Python

Cette page prend une application Python monolingue et lui ajoute des locales avec ai-i18n-tools. Elle suit un chemin : le modèle `ui-python`, un petit utilitaire `i18n.py` et des fichiers JSON de traductions. Ce chemin convient aux applications Streamlit, FastAPI, Flask, aux applications de bureau et aux scripts.

Le moyen le plus rapide est de donner à un agent de codage l'invite de cette page. Il configure la configuration, enveloppe vos chaînes, vérifie le résultat et peut ajouter un menu de langue. Vous installez la CLI, choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela entraîne des coûts sur votre compte.

Vous utilisez Django, les catalogues Flask-Babel ou GNU gettext, et vous souhaitez conserver ces appels ? Utilisez plutôt [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext). Il conserve `gettext` et écrit les fichiers `.po` et `.mo`, sans utilitaire. Vous ne savez pas lequel s'applique ? Voir [Pas votre cas ?](#not-your-case) à la fin.

Le processus :

1. [Installer l'interface de ligne de commande (CLI) et choisir un fournisseur](#install-and-choose-a-provider).
2. [Initialiser le projet](#initialise-the-project) avec `init`.
3. [Exécuter l'invite de l'agent](#run-the-agent-prompt).
4. [Examiner le résultat](#review-the-result).
5. [Choisir les modèles et traduire](#choose-models-and-translate), puis vérifier une langue.
6. [Maintenir la traduction](#keep-it-translated).

Vous préférez effectuer les modifications vous-même, ou vous voulez savoir ce que fait l'invite ? [Faire manuellement](#do-it-by-hand) décrit les mêmes étapes une par une.

<a id="install-and-choose-a-provider"></a>
## Installer et choisir un fournisseur

Vous effectuez cette partie, pas l'agent. L'installateur modifie votre machine, et la clé API est un secret qui doit rester dans votre shell, pas dans une invite.

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

Ollama ne nécessite pas de clé. Autres préréglages : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers). Notez le nom du fournisseur, car vous le passerez à `init` à l'étape suivante. L'agent n'a jamais besoin de la clé : il exécute uniquement des commandes qui n'effectuent aucun appel de modèle. Vous utiliserez la clé plus tard, lorsque vous [traduirez](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Initialiser le projet

Vous exécutez ceci une fois, avant l'invite. Il écrit la configuration et l'utilitaire `i18n.py`, et il utilise le fournisseur que vous avez choisi ci-dessus.

Cette page utilise un modèle, `ui-python`. Il écrit la configuration, l'utilitaire `i18n.py` et les catalogues JSON. Il convient à ces applications :

| Votre application | Notes |
| --- | --- |
| Streamlit | Le menu de langue nécessite quelques lignes dans l'application ; voir [Ajouter un sélecteur de langue](#step-4-add-a-language-switch) |
| FastAPI | La locale est définie par requête |
| Flask | Catalogues JSON plats. Pour les catalogues Flask-Babel dans `translations/`, utilisez la [page gettext](/fr/guide/add-i18n-to-django-gettext) |
| Pyramid | Câblage identique à Flask |
| Applications de bureau (Tkinter, PyQt, PySide) | Reconstruire le texte visible après les changements de locale |
| PyWebView | Le modèle couvre le shell Python. Traduisez sa page HTML séparément |
| Outils en ligne de commande et scripts | Le cas le plus simple |

Exécutez init avec le fournisseur que vous avez choisi (Cheaper Inference dans cet exemple) :

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

Ensuite, modifiez `sourceLocale` et `targetLocales` dans `ai-i18n-tools.config.json`. `sourceLocale` est la langue des chaînes dans la source. Toute langue BCP-47 est valide ; les exemples utilisent souvent `en`.

Exécutez `init` une seule fois. Il réécrit `ai-i18n-tools.config.json` à chaque fois, donc une deuxième exécution annule les modifications que vous avez apportées. Si `i18n.py` contient déjà le marqueur `ai-i18n-tools-i18n-py`, le projet est déjà initialisé : ignorez cette étape.

`init` définit `ui.sourceRoots` sur `"."`, donc `extract` scannerait l'ensemble du dépôt (tests, scripts, docs). L'invite le restreint à votre code d'application (manuellement, c'est-à-dire [Étape 1](#place-the-helper)).

Câblage du framework : [Intégrations Python](/fr/guide/integrations/python). Formes d'appel et disposition du catalogue : [Applications Python](/fr/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot ou similaire), démarrez une nouvelle conversation et collez l'invite ci-dessous. Le projet doit déjà être initialisé. Il n'y a rien à modifier. Si vous souhaitez omettre quelque chose, par exemple pas de menu de langue, indiquez-le dans le même message.

L'agent vérifie d'abord que la CLI, la configuration et `i18n.py` existent, et s'arrête avec des instructions si l'un d'eux est manquant. Ensuite, il fonctionne en trois parties :

- La partie 1 place `i18n.py` et `locales/` là où le dépôt conserve son code, et configure le fichier de configuration pour qu'il les pointe.
- La partie 2 enveloppe les chaînes de caractères destinées à l'utilisateur dans `t()` et `_()`, exécute `extract`, et vérifie les appels enveloppés avec `migrate-python-i18n`.
- La partie 3 ajoute un menu de langue, ou une option de langue CLI et un paramètre régional d'environnement.

Il n'installe ni n'initialise rien, ne lit pas votre clé API et ne traduit pas. La traduction est l'étape après la révision, et c'est vous qui l'exécutez.

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## Examiner le résultat

L'agent termine par un rapport. Vérifiez-le avant de traduire :

- Le diff. Le texte enveloppé doit être identique à avant, sans reformatage non lié. `git diff --stat` indique l'ampleur des changements.
- Les chaînes ignorées et les cas ambigus dans le rapport : les pluriels laissés comme une seule chaîne, un mot utilisé comme valeur stockée et comme légende, et les phrases construites à partir de morceaux traduits. Décidez-les manuellement.
- `ai-i18n-tools extract` s'exécute sans erreur, et `strings.json` se trouve dans le dossier attendu.
- Vos tests passent, et l'application a le même aspect dans la langue source.
- Aucun script jetable ou `migrate-python-i18n-report.md` n'a été laissé.

Les chaînes que l'agent a manquées apparaissent plus tard comme du texte qui reste dans la langue source. [L'étape 2](#wrap-strings) contient un script facultatif qui affiche le texte non enveloppé.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

Vous exécutez cette partie. Elle utilise votre clé API et dépense de l'argent sur votre compte.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` ne remplace que `translationModels`. Utilisez `--max-output-price` pour exclure les modèles dont le prix de sortie dépasse une limite. Si vous préférez une interface graphique, utilisez `ai-i18n-tools dashboard` pour sélectionner les [modèles](/fr/guide/translation-dashboard/models).

Ensuite, extrayez et traduisez :

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` écrit `strings.json` et `ui-languages.json`. `translate-ui` écrit un fichier JSON par langue cible. Laissez ces fichiers générés non modifiés.

`t()` recherche la phrase source dans le JSON de la locale. L'ID dans `strings.json` n'est pas la clé de recherche. Un fichier manquant ou une clé manquante renvoie la phrase source. L'aide conserve le JSON chargé en mémoire pour le processus, y compris une carte vide lorsque le fichier était manquant lors de la première recherche, donc redémarrez l'application après `translate-ui`.

<a id="check-one-language"></a>
### Vérifier une langue

Redémarrez l'application, passez à une langue cible et ouvrez une page avec quelques chaînes enveloppées. Utilisez le menu de langue ajouté par l'agent, ou définissez la locale manuellement. Le texte qui est toujours dans la langue source n'a pas été enveloppé, s'exécute au moment de l'importation, ou n'a pas d'entrée dans `locales/<code>.json`. Vérifiez le JSON pour la phrase avant de suspecter le code.

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` (ou `extract` puis `translate-ui`) après avoir modifié le texte source. Le cache signifie que seules les chaînes nouvelles ou modifiées sont envoyées au modèle. Exécutez-le en CI pour que les traductions ne divergent pas. Redémarrez l'application après une exécution de traduction pour qu'elle recharge le JSON. `ai-i18n-tools dashboard` ouvre le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) pour réviser les traductions.

Pour traduire `README.md` dans la même exécution, générez avec `--with-readme` (ou ajoutez le bloc à une configuration existante). Consultez [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faites-le manuellement

Suivez ces étapes si vous préférez effectuer les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Chaque étape correspond à une partie de l'invite. Vous [installez toujours la CLI](#install-and-choose-a-provider), [initialisez le projet](#initialise-the-project) et [traduisez](#choose-models-and-translate) à la fin.

1. [Placez l'aide et les catalogues](#place-the-helper) là où ce dépôt conserve son code.
2. [Enveloppez les chaînes](#wrap-strings) dans `t()` ou `_()`.
3. [Vérifiez les appels enveloppés](#step-3-check-wrapped-calls) avec `migrate-python-i18n`.
4. [Ajoutez un sélecteur de langue](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Étape 1 : Placer l'aide et les catalogues

`init` écrit ceci à la racine du dépôt :

| Fichier | Ce que c'est | Le modifier ? |
| --- | --- | --- |
| `i18n.py` | L'aide que votre code importe (`t`, `_`, `set_locale`) | Non. Il est généré |
| `locales/strings.json` | Le cache d'extraction. L'application ne le lit jamais | Non. Il est généré par l'extracteur |
| `locales/<code>.json` | Les traductions que l'application charge, un fichier par langue | Non. `translate-ui` les écrit |
| `locales/ui-languages.json` | La liste des langues, pour un menu de langue | Non. Elle est générée par l'extracteur |

`i18n.py` charge `locales/` depuis le dossier où il se trouve. Déplacez l'aideur et le dossier `locales/` ensemble, et laissez les chemins à l'intérieur de `i18n.py` inchangés.

| Votre dépôt | Où ils vont |
| --- | --- |
| Un script à la racine du dépôt | Laissez `i18n.py` et `locales/` là où `init` les a écrits |
| Un paquet, incluant une disposition `src/` | Déplacez les deux dans le paquet, à côté du code qui les importe |

Exemple : un paquet installable `mypkg` sous `src/mypkg/` conserve `src/mypkg/i18n.py` et `src/mypkg/locales/`.

Mettez à jour la configuration vers le nouvel emplacement :

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` est le dossier que `extract` scanne. Gardez-le sur le paquet d'application afin que les tests et les fichiers de données restent en dehors du catalogue. Le chemin de la liste des langues, `languagesManifestPath`, suit `flatOutputDir` lorsqu'il n'est pas défini. Si la configuration le définit déjà, modifiez-le pour qu'il corresponde.

Importez `t` depuis le chemin du module que vous avez choisi : `from i18n import t` à la racine du dépôt, ou `from mypkg.i18n import t` à l'intérieur d'un paquet.

Lorsque l'application est installée ou livrée dans un conteneur, le JSON de locale doit voyager avec le paquet. Ajoutez-le aux données du paquet (le motif est relatif au répertoire du paquet) :

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

Confirmez avec `ai-i18n-tools extract`. Le catalogue devrait apparaître dans le nouveau dossier `locales/`.

<a id="step-2-wrap-strings"></a>
## Étape 2 : Encapsuler les chaînes

`extract` enregistre une chaîne uniquement lorsqu'il s'agit d'un littéral passé à `t()` ou `_()`. Importez-les depuis le module généré.

Recherchez d'abord l'entrée du catalogue, puis interpolez :

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Ceux-ci exécutent le formatage avant toute recherche, de sorte que l'extracteur les marque comme non sûrs. L'[étape suivante](#step-3-check-wrapped-calls) les trouve :

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

Encadrez le texte qu'une personne voit : libellés de widgets, titres de page, légendes, erreurs affichées dans l'interface utilisateur, lignes de progression, messages de validation et paragraphes qui incluent quelques nombres. Un paragraphe avec des nombres interpolés reste un seul appel à `t()`. Les espaces réservés sont des noms tels que `{name}`, `{price:,.2f}` ou `{rate:.2%}`. Passez `rate=row.rate`. Un espace réservé comme `{row.rate:.2%}` est rejeté.

Laissez la formulation source telle quelle. Une traduction manquante renvoie cette phrase, de sorte que l'application reste la même dans la langue source.

Ignorez le texte que le programme fait correspondre ou enregistre : SQL, expressions régulières, en-têtes de fichiers, lignes de journalisation, CSS, clés de widgets, codes d'énumération et invites que vous envoyez à un modèle. Lorsqu'une valeur est à la fois stockée et affichée (une boîte de sélection dont l'option est également comparée dans le code), conservez la valeur stockée dans la langue source et traduisez l'étiquette avec `format_func`.

`t()` au moment de l'importation s'exécute une fois et conserve la langue source jusqu'à ce que ce module soit importé à nouveau. Appelez `t()` lorsque le widget est construit.

<a id="find-unwrapped-strings"></a>

Travaillez par passes : listez les littéraux qui ne sont pas des arguments de `t()` ou `_()`, encadrez ceux destinés à l'utilisateur, puis listez à nouveau. Le script ci-dessous est facultatif. Il affiche les candidats, y compris les f-strings et le texte joint avec `+`. Il ignore les docstrings, le SQL et le texte sans espace, donc une courte étiquette telle que `Overview` nécessite toujours un examen. Supprimez-le lorsque vous avez terminé. Un script qui réécrit les fichiers est un brouillon : conservez les lignes vides existantes, placez la nouvelle importation avec les autres importations du projet, exécutez le formateur du projet et examinez le diff avant de le conserver.

<details>
<summary>Facultatif : listez les chaînes qui ne sont pas encadrées</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## Étape 3 : Vérifier les appels encapsulés

Utilisez cette étape lorsque le code contient des appels qui formatent la chaîne avant la recherche dans le catalogue. C'est typique de l'encapsulation plus ancienne et d'une erreur d'agent :

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` les réécrit en une recherche qui a lieu en premier. Une deuxième exécution ne change rien.

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

Les chaînes brutes telles que `st.write(f"Hello, {name}!")` restent telles quelles. Les encapsuler est [Encapsuler les chaînes](#wrap-strings). Si `extract` est propre et que le code ne présente aucune des trois formes ci-dessus, il n'y a rien à réécrire.

Exécutez-le après `extract` et avant `translate-ui`, afin que le catalogue ne stocke jamais une f-string comme clé.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

La commande est une exécution à blanc jusqu'à ce que vous passiez `--write`. Elle écrit `migrate-python-i18n-report.md`. Lisez ce rapport. Lorsque les modifications semblent correctes :

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

Exécutez à nouveau l'exécution à blanc. Arrêtez-vous lorsqu'elle ne liste aucune modification, puis exécutez les tests du projet.

Les lignes que la commande laisse en place (champs de débogage tels que `{value=}`, spécifications de format imbriquées) sont listées dans le rapport. Corrigez-les manuellement et exécutez à nouveau l'exécution à blanc. `i18n.py` généré est ignoré. Le rapport est un artefact de build : supprimez-le ou ignorez-le avec Git.

Un rapport sans modifications signifie que les appels encapsulés sont sûrs. Cela ne signifie pas que chaque phrase destinée à l'utilisateur a été encapsulée. La [liste des littéraux non encapsulés](#find-unwrapped-strings) est la vérification pour cela.

`--report <path>` (facultatif) modifie le chemin du rapport. `--ui-block` (facultatif) limite l'analyse à un seul bloc d'interface utilisateur.

<a id="step-4-add-a-language-switch"></a>
## Étape 4 : Ajouter un sélecteur de langue

Chaque framework a besoin des quatre mêmes choses :

1. Choisissez la locale au début de chaque requête, exécution de script ou événement de fenêtre, et appelez `set_locale` avant le premier `t()`.
2. Acceptez uniquement les langues listées dans `ui-languages.json` (`get_ui_languages()`), et faites-les correspondre de manière souple. Les navigateurs envoient `pt-br`, tandis que le catalogue est `pt-BR`.
3. Proposez un sélecteur construit à partir de `get_ui_languages()`.
4. Mémorisez le choix.

L'ouverture de `?lang=pt-BR` ne fait rien tant que l'application ne l'a pas lu. L'[invite de l'agent](#run-the-agent-prompt) fait tout cela pour les applications dotées d'une interface utilisateur, et elle détermine le framework par elle-même. Les sections ci-dessous montrent le résultat pour Streamlit, FastAPI, Flask et Tkinter. Les autres frameworks suivent les mêmes règles.

<a id="streamlit"></a>
### Streamlit

Un script Streamlit se réexécute à chaque interaction, de sorte que la locale est choisie en haut du script à chaque exécution. Ordre :

1. Lisez la valeur du sélecteur de l'exécution précédente, puis `?lang=`, puis la locale stockée.
2. Appelez `set_locale` avec ce code, avant `st.set_page_config`.
3. Appelez `st.set_page_config(page_title=t("…"))`.
4. Dessinez le sélecteur. En cas de modification, stockez le code, définissez `?lang=` et `st.rerun()`.

La valeur du sélecteur l'emporte une fois que l'utilisateur a choisi. `?lang=` s'applique lors d'une nouvelle visite, avant que cette valeur n'existe. Le menu se trouve dans l'application, pas dans `i18n.py`, donc son étiquette peut être `t("Language")`. Affichez-le sur chaque écran qui doit changer de langue, y compris une page de connexion.

<details>
<summary>Code du widget</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

Modifiez `from i18n import …` pour qu'il corresponde au chemin du package de [Placer l'aide et les catalogues](#place-the-helper). Donnez à chaque autre widget un `key` fixe, et appelez `t()` lorsque le widget est construit. Les étiquettes calculées au moment de l'importation restent dans la langue source après un changement. Lorsqu'un titre de page est comparé ultérieurement, encapsulez les deux côtés : `nav.title != t("Forecast settings")`, car `nav.title` est déjà traduit.

`streamlit_language_selector()` de `i18n.py` est suffisant pour un script court dont le titre est une chaîne de caractères simple. Il appelle `set_locale` lorsque le widget est dessiné, de sorte qu'un `page_title` traduit au-dessus reste dans la langue précédente pour cette exécution, et son étiquette reste en anglais. Voir `examples/python-streamlit`.

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask et Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### Choisir la locale pour une requête

Une application web a trois sources pour la langue, dans cet ordre : le choix explicite du visiteur (`?lang=`), le cookie qui le mémorise, et l'en-tête `Accept-Language` du navigateur. La langue source est la langue de repli.

`set_locale` ne valide ni ne normalise ce qui lui est donné. Un navigateur qui envoie `pt-br` ou `pt` obtiendrait silencieusement la langue source, car le fichier de catalogue est `pt-BR.json`. Le module ci-dessous effectue la correspondance et ignore les codes qui ne sont pas dans `ui-languages.json`. Enregistrez-le à côté de `i18n.py`, et importez-le depuis le middleware ou le hook (utilisez le chemin du paquet lorsque `i18n.py` est à l'intérieur d'un paquet).

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

Choisissez la locale dans le middleware HTTP. Conservez le jeton de `set_locale` et réinitialisez-le dans `finally`, afin que les requêtes concurrentes conservent leur propre langue. Le middleware enregistre également le cookie lorsque `?lang=` est présent, et envoie `Content-Language` et `Vary` afin que les caches conservent une copie par langue. Les routes appellent `t()` et `_()` comme d'habitude. Pour les pages HTML, ajoutez les helpers à l'environnement de template une seule fois.

<details>
<summary>Middleware et templates FastAPI</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

Une API qui ne renvoie que du JSON n'a pas besoin de menu. Les clients envoient `Accept-Language` ou `?lang=`. Le texte construit après le retour du middleware, comme dans une tâche d'arrière-plan ou pendant l'envoi d'une réponse en streaming, peut s'exécuter après la réinitialisation. Construisez-le avant de renvoyer la réponse.

<a id="flask"></a>
#### Flask

Flask a un hook pour chaque tâche. `before_request` choisit la locale et conserve le jeton, `after_request` stocke le cookie, `teardown_request` réinitialise la locale, et un processeur de contexte donne aux templates `t`, `_`, `get_locale`, `get_ui_languages` et `get_direction`. Pyramid utilise la même forme avec un abonné `NewRequest`.

<details>
<summary>Hooks Flask</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### Le menu de langue dans un template

Le `Jinja2Templates` de FastAPI et Flask rendent tous deux ceci. Un lien qui porte `?lang=` conserve la page et définit le cookie, de sorte que le choix persiste sur les pages suivantes. L'attribut `dir` utilise `get_direction()` pour les langues de droite à gauche.

<details>
<summary>Template</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter crée ses widgets une seule fois, donc un changement de langue doit les mettre à jour. Écrivez chaque texte visible comme une fonction qui appelle `t("…")` avec le littéral à l'intérieur, enregistrez le widget avec cette fonction, et appelez `refresh()` après `set_locale`. `extract` voit toujours chaque littéral. Enregistrez le code choisi dans le fichier de paramètres de l'application, et appelez `set_locale` avec celui-ci avant la construction de la fenêtre.

<details>
<summary>Fenêtre Tkinter avec un menu de langue</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

Un nouveau thread démarre dans la langue source, et non celle de la fenêtre. Traduisez dans le thread principal, ou appelez `set_locale` au début de la fonction du thread. D'autres toolkits ont besoin des mêmes éléments : une fonction qui définit chaque texte visible, et un gestionnaire de menu qui appelle `set_locale` puis cette fonction. PyQt et PySide ont leurs propres hooks de retranslation ; voir [Locale dans chaque framework](/fr/guide/ui-strings/python#locale-in-each-framework).

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#choose-models-and-translate).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Vous avez | Lire |
| --- | --- |
| Des catalogues Django, Flask-Babel, ou une application qui utilise déjà GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext) |
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

Copiez-en un avec `npx degit`, ou téléchargez `ai-i18n-tools-python-examples.zip` depuis la publication GitHub. Commandes : [Exemples](/fr/examples#python-examples). Pour une application qui utilise gettext, consultez l'[exemple gettext](/fr/examples#python-gettext).
