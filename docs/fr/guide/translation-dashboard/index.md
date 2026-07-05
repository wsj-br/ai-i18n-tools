<a id="translation-dashboard"></a>
# Tableau de bord de traduction

Le tableau de bord de traduction est une interface utilisateur web locale permettant d'inspecter et de modifier les données de traduction de votre projet. Il lit à partir de trois sources :

- **Cache SQLite** (`cacheDir`) — traductions de segments de documentation, enregistrements d'échec, analyses de problèmes Markdown
- **`strings.json`** — catalogue de chaînes d'interface utilisateur (chaînes simples et groupes de pluriels)
- **CSV du glossaire utilisateur** (`glossary.userGlossary`) — suggestions terminologiques pour `translate-ui` et `proofread-ui`

Utilisez-le après une exécution de traduction pour trouver des problèmes, annuler une mauvaise sortie ou vérifier la couverture du cache, sans avoir à fouiller manuellement dans SQLite ou JSON.

<a id="start-the-dashboard"></a>
## Démarrer le tableau de bord

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Le port d'écoute par défaut est **8675**. Si ce port est indisponible, le serveur essaie le port suivant (jusqu'à 1000 tentatives) et enregistre dans les journaux le port choisi. L'alias obsolète `editor` fonctionne encore mais affiche un avertissement — privilégiez `dashboard`.

L'interface utilisateur du tableau de bord utilise la même résolution de paramètres régionaux que la CLI : `-L` / `--ui-lang` → `AI_I18N_LANG` → config `uiLanguage` → paramètres régionaux du système d'exploitation. Voir [Langue de l'interface utilisateur de l'outil](/reference/environment-variables#tool-ui-language).

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## Quel onglet dois-je utiliser ?

| Je veux… | Onglet | Guide |
| --- | --- | --- |
| Corriger les segments de document qui n'ont pas été traduits | **Échecs** | [Échecs](/guide/translation-dashboard/failures) |
| Corriger le Markdown source avant de traduire | **Problèmes Markdown** | [Problèmes Markdown](/guide/translation-dashboard/markdown-issues) |
| Annuler une traduction de document mise en cache | **Documentation** | [Cache de documentation](/guide/translation-dashboard/documentation-cache) |
| Corriger une étiquette d'interface utilisateur | **Chaînes d'interface utilisateur** | [Chaînes et pluriels d'interface utilisateur](/guide/translation-dashboard/ui-strings) |
| Corriger une forme plurielle (`one`, `other`, …) | **Pluriels d'interface utilisateur** | [Chaînes et pluriels d'interface utilisateur](/guide/translation-dashboard/ui-strings) |
| Verrouiller la terminologie pour la traduction de l'interface utilisateur | **Glossaire** | [Glossaire](/guide/translation-dashboard/glossary) |
| Voir la couverture du cache et l'utilisation du modèle | **Statistiques** | [Statistiques](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## Après avoir modifié

| Vous avez modifié… | Puis exécutez… | Évitez… |
| --- | --- | --- |
| Ligne du cache de documentation | `sync --force-update` ou `translate-docs --force-update` | — |
| Chaîne ou pluriel d'interface utilisateur | `sync` ou `translate-ui` simple | `--force` (écrase les lignes `user-edited`) |
| Ligne du glossaire | prochain `translate-ui` ou `proofread-ui` | — |

**Documentation (cache SQLite)** — Les modifications manuelles sont étiquetées avec le modèle `user-edited` dans le cache. Réexécuter `translate-docs` ou `sync` sur une source inchangée réutilise la traduction mise en cache (pas d'appel LLM). Exécutez `sync --force-update` ou `translate-docs --force-update` pour actualiser le markdown sur disque à partir du cache. Utilisez `--force` uniquement si vous souhaitez contourner le cache et retraduire à partir du LLM (écrasant les corrections manuelles).

**Chaînes d'interface utilisateur (`strings.json`)** — Les modifications manuelles sont étiquetées avec `user-edited` dans `models[locale]`. Réexécuter `translate-ui` ou `sync` ignore les entrées qui ont déjà une traduction. Utilisez `--force` sur les commandes d'interface utilisateur pour retraduire et écraser les corrections manuelles.

<a id="tips"></a>
## Conseils

- Les **boutons de lien de journal** (🔗 dans les lignes de tableau) affichent des indications fichier:ligne dans le **terminal** où `ai-i18n-tools dashboard` est en cours d'exécution — utile pour passer du navigateur à votre éditeur. Si vous utilisez un IDE dérivé de VS Code (comme Cursor, Antigravity, ...), vous pouvez cliquer sur le lien fichier:ligne dans la fenêtre du Terminal avec `CTRL` pour ouvrir le fichier à la ligne indiquée.
- Le bouton **Fermer** (en haut à droite de la barre d'onglets) arrête le serveur du tableau de bord de manière élégante.
- Si le serveur s'arrête alors que l'onglet du navigateur est toujours ouvert, une superposition apparaît. Redémarrez `ai-i18n-tools dashboard` pour vous reconnecter, ou fermez la fenêtre si vous avez terminé avec le tableau de bord.
