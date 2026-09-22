<a id="glossary"></a>
# Glossaire

Le glossaire garantit une terminologie produit cohérente dans toutes les traductions. Les utilisateurs peuvent définir la traduction d'un terme dans une ou plusieurs langues, ce qui permet au modèle d'IA d'utiliser cette traduction prédéfinie au lieu de deviner la meilleure option. Il peut également être utilisé pour conserver certains termes, tels que les noms de produits, inchangés lors de la traduction dans d'autres langues.

Deux types d'indications sont envoyés au modèle :

- Les **lignes de terme** dans `glossary.userGlossary` (et, pour certains pipelines, les traductions d'interface existantes issues de `glossary.uiGlossary`). Une ligne n'est incluse que si le terme source correspondant apparaît dans le texte en cours de traduction.
- Les **fichiers de contexte de projet** dans `glossary.contextFiles`. Le brief complet est injecté dans chaque prompt d'interface, de documentation, JSON, SVG et de relecture. Cette section est [ci-dessous](#project-context-files).

<a id="how-the-glossary-works"></a>
## Fonctionnement du glossaire

<a id="where-terms-come-from"></a>
### D'où viennent les termes

| Source | Config | Utilisé par |
| --- | --- | --- |
| Catalogue d'interface | `glossary.uiGlossary` — généralement le même chemin que `ui.stringsJson` | `translate-docs`, `translate-json`, `translate-svg` |
| CSV utilisateur | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary` réutilise comme indications les traductions déjà stockées dans `strings.json`, afin que la documentation, le JSON et le SVG restent alignés avec l'interface. `translate-ui` et `proofread-ui` ne lisent pas `uiGlossary` — ils ne prennent des indications que du CSV utilisateur, de sorte qu'une mauvaise traduction d'interface n'est pas réinjectée comme terme préféré.

Le CSV utilisateur prime sur le catalogue d'interface. Une ligne dont le `locale` est un code spécifique remplace à la fois la ligne `*` et la traduction du catalogue d'interface pour cette locale. Un `locale` de `*` applique la même traduction à chaque entrée `targetLocales` qui n'en possède pas déjà une provenant du catalogue d'interface.

Les abréviations compactes des libellés d'interface (un point final tel que `Alm.`, ou une compression courte en un seul mot telle que `Size` → `Tam`) restent disponibles pour la traduction d'interface. Les prompts de documentation les ignorent, afin de ne pas pousser les modèles à inventer des jetons <code v-pre>{{…}}</code> dans le markdown ou le MDX.

<a id="when-a-term-is-sent"></a>
### Quand un terme est envoyé

La correspondance ne tient pas compte de la casse et s'arrête à une limite de mot (espace ou ponctuation). Les termes les plus longs sont privilégiés, et les correspondances qui se chevauchent sont écartées. Lorsqu'un terme correspond au lot en cours, le prompt reçoit une indication du type `"dashboard" → "Tableau"`. Si cette ligne comporte une note de **Contexte**, la note est ajoutée uniquement pour cette correspondance.

Le **Contexte** est une indication d'usage dans la langue source (ce que signifie le terme, ou comment l'utiliser). Ce n'est pas une traduction. Modifier une note de **Contexte**, ou tout contenu `glossary.contextFiles`, actualise les traductions en cache pour la locale concernée lors de la prochaine exécution — inutile de passer `--force`. Modifier uniquement la **Traduction** préférée conserve le cache existant jusqu'à ce que vous passiez `--force` ou `--force-update`. Les lignes que vous avez modifiées dans le dashboard restent en `user-edited`.

<a id="force"></a>
### Force

Lorsque **Force** vaut `true`, `yes` ou `1`, le terme source est retiré du texte avant que le modèle ne le voie, puis la traduction préférée est réinsérée ensuite. Le libellé est exact, et non une simple suggestion. Les mêmes règles de limite de mot et de correspondance la plus longue s'appliquent. Laissez **Force** vide (ou mettez `false`) lorsque le modèle doit privilégier la traduction mais peut néanmoins la fléchir.

<a id="generate-a-glossary"></a>
## Générer un glossaire

`glossary-generate` écrit un CSV vide avec l'en-tête standard. Il utilise `glossary.userGlossary` depuis la config, ou `glossary-user.csv` lorsque cette clé n'est pas définie. Il refuse d'écraser un fichier déjà existant (code de sortie **1**).

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

Faites pointer la config vers le fichier :

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

Vous pouvez également créer le fichier de glossaire CSV directement depuis le tableau de bord. La première action **Ajouter** de l'onglet [Glossaire](/fr/guide/translation-dashboard/glossary) créera le fichier si `glossary.userGlossary` est spécifié et que le fichier n'existe pas déjà. Lorsque `glossary.autoAddUserEditedToGlossary` est défini sur `true` (la valeur par défaut), la correction d'une chaîne d'interface utilisateur dans le tableau de bord peut ajouter cette modification au CSV lors de la prochaine exécution de `translate-ui`. Le tableau de bord sert également d'éditeur pour le glossaire CSV, vous permettant d'ajouter, de modifier ou de filtrer des lignes directement dans l'interface.

<a id="csv-columns"></a>
## Colonnes CSV

Ligne d'en-tête :

```text
Original language string,locale,Translation,Force,Context
```

`en` ou `English` est accepté à la place de `Original language string`. `Notes` est accepté à la place de `Context`.

| Colonne | Signification |
| --- | --- |
| **Chaîne dans la langue d’origine** | Terme ou expression source, dans la locale source |
| **locale** | Code de la locale cible, ou `*` pour toutes les cibles |
| **Traduction** | Traduction préférée |
| **Force** | `true`, `yes` ou `1` pour exiger ce libellé ; sinon, une suggestion |
| **Contexte** | Explication facultative dans la langue source. Envoyée uniquement lorsque ce terme correspond |

<a id="examples"></a>
## Exemples

Un terme produit pour chaque locale, un libellé allemand forcé, et une ligne française qui explique un mot que le modèle pourrait prendre au sens littéral :

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

Combiné à un brief de projet :

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

Référence du champ : [`glossary` dans Configuration](/fr/reference/configuration#glossary). Référence de la commande : [`glossary-generate`](/fr/reference/cli-commands/tools#glossary-generate).

<a id="project-context-files"></a>
## Fichiers de contexte de projet

`glossary.contextFiles` est destiné aux directives au niveau du produit qui n'appartiennent pas à une seule ligne CSV : ce qu'est le produit, à qui il est destiné, le ton et les termes faciles à mal traduire. Pointez la configuration vers un ou plusieurs fichiers `.md` / `.txt` relatifs au répertoire de travail ; ils sont concaténés dans l'ordre indiqué et injectés dans chaque invite d'interface utilisateur, de documentation, JSON, SVG et de relecture.

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

Rédigez le brief dans le **paramètre régional source**, maintenez-le bien en dessous de `glossary.contextMaxChars` (par défaut `12000`), et stockez-le en dehors de `docs[].contentPaths`, sauf si vous souhaitez également que ce fichier soit traduit. Voir [`glossary` dans Configuration](/fr/reference/configuration#glossary).

<a id="generate-a-context-file-with-an-ai-agent"></a>
### Générer un fichier de contexte avec un agent IA

Demandez à un agent (Cursor, Claude Code, Copilot, et similaires) de lire le dépôt et de rédiger le brief. Collez une invite comme celle-ci :

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

Examinez le fichier avant la prochaine exécution de `sync` / `translate-*`. La modification du fichier invalide les traductions mises en cache pour chaque paramètre régional lors de cette exécution, alors maintenez le brief stable une fois que la qualité est bonne.
