<a id="translating-intlayer"></a>
# Traduire Intlayer sur place

[Intlayer](https://intlayer.org/) est une bonne solution pour les applications qui conservent les traductions dans des dictionnaires de contenu typés, ou qui utilisent un système de gestion de traduction et la traduction humaine. `translate-intlayer` s’adresse à ce public. Il remplit les feuilles de paramètres régionaux manquantes et obsolètes dans vos dictionnaires `*.content.ts`, sur place. Les dictionnaires restent la source de vérité, Intlayer reste à l’exécution, et ai-i18n-tools agit comme moteur de traduction (sélection du fournisseur, glossaire, contexte de traduction et repli du modèle).

<a id="which-one"></a>
## Conserver Intlayer ou passer aux appels de chaînes sources ?

| Votre public | Commande | Guide |
| --- | --- | --- |
| Dictionnaires de contenu typés, un système de gestion de traduction ou une traduction humaine. Intlayer reste à l’exécution. | `translate-intlayer` | cette page |
| Appels de chaînes sources, `t('…')`, avec le texte de la langue source conservé avec le code qui l’utilise. La langue source peut être n’importe quelle langue. | `migrate-intlayer` | [Migration d’Intlayer vers les appels de chaînes sources](/fr/guide/migrating-from-intlayer) |

`translate-intlayer` est une tâche continue que vous réexécutez chaque fois que vous ajoutez des chaînes sources ou modifiez des chaînes existantes. `migrate-intlayer` est un déplacement unique pour l’autre public. Chaque appel réécrit porte la chaîne de la langue source avec le code qui l’utilise, ce qui simplifie la maintenance et réduit la complexité de ce code. Cette langue est `sourceLocale`, et elle peut être n’importe quelle langue.

<a id="what-translate-intlayer-does"></a>
## Ce que fait `translate-intlayer`

1. Analyse les exportations par défaut de `*.content.ts` et collecte chaque feuille `t({ locale: '…' })`. Les valeurs de paramètres régionaux peuvent être des chaînes simples ou des nœuds d’insertion `insert('…')` Intlayer.
2. Initialise le `ui.stringsJson` du bloc d’interface utilisateur avec le texte source, puis exécute le même moteur que [`translate-ui`](/fr/reference/cli-commands/ui-strings#translate-ui) pour les paramètres régionaux manquants et obsolètes.
3. Réécrit les nouvelles chaînes par paramètres régionaux dans chaque objet `t({ … })`. Les modifications sont chirurgicales : seules les lignes de paramètres régionaux manquantes ou obsolètes changent, de sorte que votre formatage, l’ordre des clés et les commentaires sont préservés. Les traductions existantes sont laissées telles quelles. Lorsqu’une feuille utilise `insert('…')`, les nouvelles valeurs de paramètres régionaux sont également encapsulées dans `insert(…)`, de sorte que la feuille reste appelable à l’exécution.
4. Préserve les espaces réservés. La syntaxe d’insertion d’Intlayer <code v-pre>{{token}}</code> est transmise inchangée. Les espaces réservés `{token}` à accolade unique sont également pris en charge : ils deviennent <code v-pre>{{token}}</code> pour la traduction et reviennent à `{token}` lors de l’écriture.
5. Exécution à blanc avec `--dry-run` : elle signale les nombres manquants/obsolètes sans appeler un LLM ni écrire quoi que ce soit.

<a id="missing-vs-stale"></a>
## Manquant vs. obsolète

Une feuille + paramètres régionaux est traduite lorsque l’une des conditions suivantes est remplie :

- Les paramètres régionaux sont absents de la feuille (manquant), ou
- Le texte des paramètres régionaux sources a changé depuis la dernière exécution pour ces paramètres régionaux (obsolète). La langue source est `sourceLocale` et peut être n’importe quelle langue.

L’obsolescence est suivie par feuille dans `cacheDir`, donc la modification d’une chaîne anglaise ne retraduit que cette feuille lors de la prochaine exécution ; tout le reste reste mis en cache. Une traduction qui était déjà obsolète lors de la toute première exécution est acceptée comme actuelle ; seules les modifications ultérieures la marquent comme obsolète.

<a id="translate-your-project"></a>
## Traduire votre projet

1. Installez `ai-i18n-tools` (voir [Installation](/fr/guide/installation)). Si votre projet n'a pas encore de `ai-i18n-tools.config.json`, initialisez-en un :

   ```bash
   ai-i18n-tools init -P gemini
   ```

Définissez `sourceLocale` et `targetLocales` sur les paramètres régionaux utilisés par vos dictionnaires, et pointez `ui.sourceRoots`, `ui.stringsJson` et `ui.flatOutputDir` vers votre source et un chemin de catalogue — les mêmes clés que celles utilisées par `translate-ui`, voir [Chaînes d’interface utilisateur — Étape 1 : Initialiser](/fr/guide/ui-strings/#step-1-initialise). Le catalogue peut se trouver dans un répertoire temporaire (par exemple `.i18n/`) ; il est utilisé comme cache de traduction et vous ne le modifiez jamais manuellement.
2. Exécutez d’abord à blanc pour voir ce qui serait rempli :

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. Appliquez-le (nécessite une clé API de fournisseur) :

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. Réexécutez chaque fois que vous ajoutez une nouvelle chaîne ou modifiez une chaîne anglaise. Seules les feuilles nouvelles ou modifiées sont traduites. Définissez la portée d’une exécution avec `-l de,fr` ou `--ui-block` si nécessaire.

<a id="run-the-example"></a>
## Exécuter l'exemple

L’exemple [intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) est une petite application Vite + React dont les dictionnaires sont livrés avec l’anglais et le portugais brésilien ; l’espagnol et le chinois simplifié sont volontairement manquants. `pristine/` est une référence en lecture seule ; `src/` est la copie de travail. `pnpm reset` ramène `src/` à cet état initial (et efface le catalogue et le cache) afin que vous puissiez répéter l’exercice.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev` exécute l'application sur [http://localhost:3093](http://localhost:3093). Changez la locale en `es` ou `zh-Hans` avant de traduire et les chaînes reviendront à l'anglais ; après `pnpm translate`, les traductions remplies apparaissent. Modifiez une chaîne anglaise et réexécutez `pnpm translate` pour voir uniquement cette feuille se rafraîchir.

Guide complet : [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md).

<a id="command"></a>
## Commande

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

Nécessite `features.translateUIStrings` et le `ui.stringsJson` du bloc d'interface utilisateur (identique à `translate-ui`). `--dry-run` n'appelle pas de LLM.

| Option | Signification |
| --- | --- |
| `[paths...]` | Fichiers/répertoires/globs à scanner (par défaut : `ui.sourceRoots`) |
| `-l`, `--locale <codes>` | Locales cibles séparées par des virgules à remplir (par défaut : le `targetLocales` du bloc) |
| `--ui-block <selector>` | Bloc d'interface utilisateur : index basé sur zéro, description ou chemin `stringsJson` (par défaut : bloc 0) |
| `--dry-run` | Signaler uniquement les nombres manquants/obsolètes ; pas d'appel LLM, pas d'écritures |
| `-j`, `--concurrency <n>` | Nombre maximal de locales cibles parallèles (par défaut : config `concurrency` ou 4) |

**Voir aussi :** [CLI — Chaînes d'interface utilisateur](/fr/reference/cli-commands/ui-strings#translate-intlayer), [Migration d'Intlayer vers les appels de chaînes source](/fr/guide/migrating-from-intlayer)
