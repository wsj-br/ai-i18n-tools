<a id="astro-website"></a>
# Site web Astro

Pour les sites marketing ou les applications Astro statiques (Astro simple, pas Starlight), combinez le [routage i18n intégré d'Astro](https://docs.astro.build/en/guides/internationalization/) avec ai-i18n-tools. Voir aussi l'[intégration Astro](/guide/integrations/astro).

L'implémentation de référence est [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (voir aussi son [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)) : l'anglais à `/`, neuf locales cibles à `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Pipelines hybrides

La plupart des équipes utilisent un pipeline **hybride** combinant les deux (ils ne sont pas en conflit) :

| Pipeline | À utiliser pour | Commandes | Sortie |
|----------|---------|----------|--------|
| **HTML des pages** | Titres, paragraphes, libellés de navigation, tableaux intégrés dans le corps du modèle | `translate-docs` | Un `src/pages/{locale}/index.astro` par localisation |
| **Chaînes d'interface utilisateur (`t()`)** | Données du frontmatter, libellés d'onglets de captures d'écran, tableaux partagés | `extract` → `translate-ui` | `public/locales/{locale}.json` (source anglaise utilisée comme clé) |

Maintenez trois listes alignées lorsque vous ajoutez ou supprimez une langue : `targetLocales` dans `ai-i18n-tools.config.json`, `i18n.locales` dans `astro.config.mjs` (Astro utilise des codes de route en **minuscules** tels que `pt-br`), et `ui-languages.json` (via `generate-ui-languages`). Les **noms de fichiers** des bundles plats utilisent la casse de la configuration (`pt-BR.json`) ; mappez la route `pt-br` d'Astro vers ce fichier via votre champ de manifeste `code` (voir `examples/astro-website/src/i18n/locale.ts`).

Exemples de scripts `package.json` (issus du projet de référence) :

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## Chaînes d'interface utilisateur (SSG)

Échafaudez l'extraction de l'interface utilisateur avec `init -t ui-astro-website`, puis fusionnez dans un bloc `docs[]` lorsque vous traduisez également le HTML de la page (voir [Analyser et remplacer les pages](#astro-website-pages-parse-and-replace)). Encapsulez le texte dans `t('…')` dans les modules TypeScript et le frontmatter `.astro` (et les blocs de modèle `{expression}` lorsque vous préférez les chaînes d'interface utilisateur aux pages de locale dupliquées) :

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Définissez `sourceLocale` pour qu'il corresponde à `i18n.defaultLocale` dans `astro.config.mjs`. Écrivez les bundles plats dans un répertoire que Astro peut importer au moment de la construction (le modèle utilise `public/locales/`). Résolvez `t('…')` au **moment de la construction** en recherchant le texte source en anglais comme clé (voir `examples/astro-website/src/i18n/t.ts` ; `strings.json` est le cache d'extraction, pas le bundle au moment de l'exécution). Vous n'avez **pas besoin** de `ai-i18n-tools/runtime` ou d'i18next pour un site statique, sauf si vous ajoutez des îlots clients qui changent de langue après le chargement.

Connectez chaque page qui appelle `t()` (page racine en anglais et chaque copie `src/pages/{locale}/`) :

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Prise en charge des assistants dans l'exemple : `src/i18n/utils.ts`, `src/i18n/locale.ts` et `ui-languages.json` pour les étiquettes, la direction et les codes BCP-47. Exécutez `generate-ui-languages` après avoir modifié `targetLocales` (définissez éventuellement `languagesManifestPath` pour que le manifeste se trouve à côté de vos assistants, par exemple `src/i18n/ui-languages.json`). `MainLayout.astro` définit `<html lang>` et `<html dir>` à partir de `resolveUiLanguage(Astro.currentLocale)` ; `LanguagePicker.astro` utilise `getRelativeLocaleUrl` à partir de `astro:i18n`.

<a id="pages-parse-and-replace"></a>
## Pages (analyse et remplacement)

Pour les pages marketing contenant du HTML en dur dans les fichiers `.astro`, laissez `translate-docs` extraire les nœuds de texte et les attributs (`alt`, `title`, `aria-label`, `placeholder`), les traduire à l'aide du cache de document, puis écrire des copies spécifiques à chaque localisation dans votre arborescence de pages. Vous n'avez **pas besoin** de `t()` pour la plupart des textes visibles.

Les valeurs d'attributs structurels et de clés ne sont **pas** traduites par défaut : une protection intégrée couvre les attributs JSX/HTML tels que `class`, `id`, `style`, `src`, `href`, `data-*`, et la plupart des `aria-*`, ainsi que les clés d'objet comme `class`, `key` et `id` à l'intérieur des blocs de modèle `{expression}`. Utilisez `docs[].protectAttributes` et `docs[].protectKeys` pour étendre ces listes lorsque vous utilisez des attributs personnalisés (par exemple, les champs Tailwind `variant` ou CMS `slug`). Les mêmes options s'appliquent au JSX MDX pendant la traduction Markdown (voir [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

Activez `features.translateDocs` et ajoutez un bloc `docs[]`, par exemple :

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Exécutez `npx ai-i18n-tools translate-docs` (ou `pnpm i18n:translate` dans [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)). La source anglaise reste à `src/pages/index.astro` ; chaque locale cible obtient `src/pages/{locale}/index.astro` avec les importations ajustées pour le niveau de répertoire supplémentaire (par exemple `../layouts/` → `../../layouts/`).

Dans le **corps du modèle**, les littéraux de chaîne dans les blocs `{expression}` (tableaux en ligne, champs d'objet `title`/`desc`) sont traduits s'ils sont destinés à l'utilisateur ; les valeurs entre guillemets sur les attributs/clés protégés, les littéraux à l'intérieur de `t('…')`, `<script>` et `<style>` sont laissés inchangés. **Le TypeScript du frontmatter n'est pas traduit** par ce chemin — gardez le frontmatter partagé (y compris les importations `t()` et les tableaux de données) identique sur les pages anglaises et locales, ou réexécutez `translate-docs` après avoir modifié la page anglaise afin que les copies locales prennent en compte les modifications du frontmatter. Pour le texte uniquement dans le frontmatter, utilisez plutôt le [pipeline de chaînes d'interface utilisateur](#astro-website-ui-strings-ssg).

Voir [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) pour la page de destination hybride complète (HTML via `translate-docs`, étiquettes d'onglet de capture d'écran via `t()` + `translate-ui`).
