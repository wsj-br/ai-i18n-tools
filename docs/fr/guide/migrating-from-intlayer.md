<a id="migrating-from-intlayer"></a>
# Migration depuis Intlayer

Vous migrez depuis [Intlayer](https://intlayer.org/) ? Cette commande importe vos dictionnaires de traduction existants et les implémentations de traduction les plus simples de votre application vers ai-i18n-tools. Elle applique automatiquement des mises à jour sûres, puis génère un rapport clair pour tout ce qui nécessite encore votre attention. Cela vous permet de migrer progressivement sans avoir à comprendre toutes les différences au préalable.

Vous utilisez déjà des fichiers de traduction JSON i18next ? Vous n'avez pas besoin de cette commande de migration ; utilisez plutôt le [pipeline JSON](/fr/guide/json#i18next-namespace-files).

<a id="what-migrate-intlayer-does"></a>
## Ce que fait `migrate-intlayer`

1. Analyse les exports par défaut de `*.content.ts` (`key` + `content` + `t({ locale: '…' })` feuilles).
2. Initialise `ui.stringsJson` et les fichiers par locale sous `ui.flatOutputDir` à partir du texte de la locale source et des traductions déjà présentes dans le dictionnaire. Les lignes importées n'ont pas de champ `models` (elles n'ont pas été traduites automatiquement lors de cette exécution).
3. Réécrit les points d'appel **sûrs** :
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. Laisse tout le reste (clés dynamiques, spreads JSX, `.replace().replace()` chaînés, déstructuration) intact. Le rapport liste chacun de ces sites avec l'expression exacte, un remplacement `t()` ou JSX concret, et la ligne `import { t } from '…';` à ajouter.
5. Exécution à blanc par défaut. Transmettez `--write` pour appliquer l'initialisation du catalogue et les réécritures sûres. Le rapport est toujours généré. Il liste également les fichiers de dictionnaire et les utilisations résiduelles de `useIntlayer` / `IntlayerProvider` à supprimer après les réécritures manuelles, les clés de catalogue qui nécessitent encore `extract` puis `translate-ui`, ainsi qu'un bootstrap d'exécution à coller pour remplacer le module i18n de l'application.

<a id="migrate-your-project"></a>
## Migrer votre projet

1. Installez `ai-i18n-tools` (voir [Installation](/fr/guide/installation)). Si votre projet n'a pas encore de `ai-i18n-tools.config.json`, initialisez-en un :

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

Modifiez `sourceLocale` et `targetLocales` pour qu'ils correspondent aux locales déjà présentes dans vos dictionnaires Intlayer, et configurez `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir` pour pointer vers le code source de votre application et les chemins de catalogue souhaités — les mêmes clés que celles utilisées par `translate-ui`, voir [Chaînes d'interface utilisateur — Étape 1 : Initialisation](/fr/guide/ui-strings/#step-1-initialise).
2. Faites d'abord une simulation : `ai-i18n-tools migrate-intlayer` (sans `--write`). Lisez `migrate-intlayer-report.md` pour voir ce qu'il trouve et quels sites d'appel nécessitent une révision manuelle avant toute modification de fichier.
3. `ai-i18n-tools migrate-intlayer --write` pour initialiser `ui.stringsJson` / `ui.flatOutputDir` et réécrire les sites d'appel sûrs.
4. Transmettez le rapport régénéré `migrate-intlayer-report.md` à un agent de codage IA (recommandé), ou traitez-le vous-même en suivant les étapes :

- Le rapport se termine par un **TODO étape par étape** : finalisez chaque site à revoir manuellement avec le `t('…')`/JSX concret qui y est indiqué, ajoutez la ligne `import { t } from '…';`, puis supprimez les fichiers `*.content.ts` restants et les utilisations de `useIntlayer` / `IntlayerProvider` répertoriées dans le rapport.
   - Collez le bootstrap d'exécution du rapport par-dessus le module i18n de votre application. Dans le contrôle des locales, appelez `loadLocale(next)` puis `i18n.changeLanguage(next)` — `loadLocale` ne fait qu'enregistrer le bundle plat et ne change pas la langue active.
   - Exécutez `ai-i18n-tools extract` puis `ai-i18n-tools translate-ui` (ou `sync`) pour toutes les chaînes source que le rapport marque comme nouvelles. `extract` écrit également `ui-languages.json`, qui est importé par le bootstrap, exécutez-le donc avant de démarrer l'application même si aucune nouvelle chaîne n'a été ajoutée. Ne modifiez pas manuellement `strings.json`, les fichiers de locales plats, ou `ui-languages.json` — ces commandes en assurent la gestion.
   - Une fois la liste de nettoyage du rapport terminée et l'application fonctionnant avec ai-i18n-tools, supprimez les dépendances `intlayer` / `react-intlayer` et les fichiers de dictionnaire.

<a id="run-the-example"></a>
## Exécuter l'exemple

Les étapes ci-dessus s'appliquent à tout projet Intlayer. L'exemple [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) les détaille sur une petite application Vite + React avec des cas basiques (réécritures automatiques) et complexes (révision manuelle), afin que vous puissiez voir le rapport et le code d'amorçage à l'exécution avant de l'essayer sur votre propre code. `intlayer-pristine/` n'est jamais modifié ; `src/` est la copie de travail.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

Transmettez `migrate-intlayer-report.md` à un agent de codage IA (ou modifiez vous-même les fichiers signalés). Le rapport inclut le module d'exécution à coller pour remplacer `src/i18n.ts`. Dans le gestionnaire de locale, appelez `loadLocale(next)` puis `i18n.changeLanguage(next)`. `loadLocale` enregistre uniquement le bundle plat.

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` exécute d'abord `extract`, qui écrit `ui-languages.json`. Le bootstrap importe ce fichier, démarrez donc l'application uniquement après l'extraction. Ne modifiez pas manuellement `strings.json`, les fichiers de paramètres régionaux à plat, ni `ui-languages.json`.

`pnpm reset` recopie `intlayer-pristine/` sur `src/` et efface les catalogues générés afin que vous puissiez recommencer.

Procédure complète : [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md).

<a id="command"></a>
## Commande

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

Nécessite `ui.stringsJson` et `ui.flatOutputDir` dans la configuration (identique à `translate-ui`). N'appelle pas de LLM.

| Option | Signification |
| --- | --- |
| `[paths...]` | Fichiers/répertoires/globs à scanner (par défaut : `ui.sourceRoots`) |
| `--write` | Initialiser le catalogue et réécrire les sites d'appel sûrs (par défaut : exécution à blanc) |
| `--report <path>` | Chemin du rapport (par défaut : `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | Motif glob de nom de fichier de dictionnaire (par défaut : `**/*.content.ts`) |
| `--t-import <specifier>` | Spécificateur d'importation pour `t()` généré (par défaut : `./i18n` relatif si `src/i18n.ts` existe, sinon `i18next`) |

Après `--write`, finalisez les sites à révision manuelle indiqués dans le rapport, supprimez les fichiers `*.content.ts` inutilisés et le wrapper `IntlayerProvider` qu'il répertorie, insérez le bootstrap d'exécution et appelez `i18n.changeLanguage` depuis le contrôle des paramètres régionaux. Exécutez `extract` puis `translate-ui` (ou `sync`) pour les chaînes source que le rapport signale comme nouvelles. `extract` écrit également `ui-languages.json`, que le bootstrap importe. Ne modifiez pas manuellement `strings.json`, les fichiers de paramètres régionaux à plat, ni `ui-languages.json`.

**Voir aussi :** [CLI — Chaînes d'interface utilisateur](/fr/reference/cli-commands/ui-strings#migrate-intlayer), [Connecter i18next](/fr/guide/ui-strings/i18next-runtime)
