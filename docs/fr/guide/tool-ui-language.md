<a id="tool-ui-language"></a>
# Langue de l'interface utilisateur de l'outil

L'`ai-i18n-tools` localise sa propre interface utilisateur (texte d'aide de la CLI, messages de journal/récapitulatifs/erreurs à fort trafic et tableau de bord de traduction) indépendamment des fichiers `sourceLocale` / `targetLocales` de votre projet. Aucune configuration n'est requise : par défaut, l'outil suit les paramètres régionaux de votre système d'exploitation.

<a id="locale-resolution"></a>
## Résolution des paramètres régionaux

Les paramètres régionaux de l'interface utilisateur sont résolus à partir de ces sources, par ordre de priorité décroissant :

1. Indicateur global `-L` / `--ui-lang <code>` (par ex. `-L pt-BR`).
2. Variable d'environnement `AI_I18N_LANG` (par ex. `export AI_I18N_LANG=es`).
3. La clé de configuration `uiLanguage` dans `ai-i18n-tools.config.json` (chaîne BCP-47).
4. La locale du système d'exploitation hôte (via `Intl.DateTimeFormat().resolvedOptions().locale`).

<a id="matching-and-fallback"></a>
## Correspondance et repli

La locale demandée est comparée exactement aux langues d'interface utilisateur fournies ou à la variation la plus proche (par exemple, `pt-PT` se résout en `pt-BR`, et `en-US` se résout en `en-GB`) ; lorsqu'il n'y a pas de correspondance, elle se rabat sur la locale source (`en-GB`). Lorsqu'une langue d'interface utilisateur est demandée explicitement (via le drapeau, la variable d'environnement ou `uiLanguage`) mais qu'aucun bundle fourni ne correspond, la CLI affiche un avertissement unique indiquant que la locale par défaut sera utilisée ; une locale déduite uniquement du système d'exploitation hôte n'émet jamais d'avertissement.

<a id="shipped-ui-languages"></a>
## Langues d'interface utilisateur fournies

Anglais (Royaume-Uni, source), allemand, espagnol, français, hindi, japonais, coréen, portugais (Brésil), chinois (simplifié), chinois (traditionnel).

<a id="translation-dashboard"></a>
## Tableau de bord de traduction

Le tableau de bord de traduction lit les paramètres régionaux résolus, le sens de la mise en page et le bundle de traduction à partir de `GET /api/ui-i18n` et les applique au chargement (il définit `<html lang>` / `dir` et localise le balisage statique via les attributs `data-i18n*`).

<a id="related"></a>
## Liens connexes

- [`AI_I18N_LANG`](/fr/reference/environment-variables) — remplacement de la variable d'environnement
- [`uiLanguage`](/fr/reference/configuration#uilanguage-optional) — remplacement de la clé de configuration
- [`-L` / `--ui-lang`](/fr/reference/cli-commands/) — remplacement de l'indicateur CLI (priorité la plus élevée)
