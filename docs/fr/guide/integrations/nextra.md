<a id="nextra-integration"></a>
# Intégration Nextra

Utilisez `init -t ui-nextra` et `docsOutput.style: "nextra"` pour les sites de documentation [Nextra](https://nextra.site/) 4 sur Next.js App Router. Le préréglage est un alias pour `doc-system` avec un `localeSubpath` vide et les noms de dossiers de paramètres régionaux BCP-47 conservés (`localePathLowercase` est par défaut `false`, donc les dossiers restent `pt-BR`, `zh-Hans`, etc.).

Voir aussi [Documents](/fr/guide/documents/), et la démo exécutable [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init -t ui-nextra -P gemini
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Activez `features.translateDocs` lorsque vous traduisez le contenu des pages, les étiquettes de la barre latérale `_meta.ts` et les modules de dictionnaire de thème en une seule exécution de `sync`.

<a id="page-layout"></a>
## Disposition de la page

Nextra 4 avec i18n conserve le **MDX de la locale source dans un dossier de locale** (généralement `content/en/` lorsque l'anglais est la source). `sourceLocale` peut être n'importe quelle langue. Les copies traduites sont écrites dans des dossiers de locale frères :

```text
content/en/index.mdx              →  content/pt-BR/index.mdx
content/en/guide/getting-started.mdx  →  content/zh-Hans/guide/getting-started.mdx
```

Configurez un bloc `docs[]` :

```json
{
  "contentPaths": ["content/en"],
  "outputDir": "content",
  "docsOutput": {
    "style": "nextra",
    "docsRoot": "content/en",
    "rewriteNextraLinks": true
  }
}
```

Pointez `contentPaths` vers les fichiers et répertoires `.mdx` écrits en `sourceLocale`. Cette langue peut être n'importe quelle langue. Définissez `docsRoot` sur le dossier de la locale source à l'intérieur de `content/` (par exemple `content/en` lorsque l'anglais est la source).

Connectez l'[internationalisation](https://nextra.site/docs/guide/i18n) Nextra : définissez `i18n.locales` et `defaultLocale` dans `next.config`, et maintenez `targetLocales` dans `ai-i18n-tools.config.json` aligné avec ces codes de paramètres régionaux et les noms de dossiers `content/{locale}/`.

<a id="enable-i18n-in-an-existing-site"></a>
### Activer l'i18n dans un site existant

Un site Nextra 4 uniquement en anglais nécessite un dossier de locale, un paramètre de route et une configuration i18n de Next.js avant que `translate-docs` n'ait un endroit où écrire. L'[invite du dictionnaire](#agent-prompt-dictionary) le fait en une seule passe. Liste de contrôle :

- Déplacez le MDX vers `content/en/` (l'anglais est un dossier de locale, pas la racine du contenu).
- `i18n.locales` et `defaultLocale` dans `next.config`.
- Une route `app/[lang]/`, `getPageMap('/${lang}')` et `<Layout i18n={…}>`.
- `app/_dictionaries/en.ts` plus `get-dictionary.ts`, passés dans `<Layout>`, `<Navbar>` et `<Footer>`.
- `proxy.ts` facultatif qui réexporte `nextra/locales` (voir [Proxy de locale facultatif](#optional-locale-proxy)).
- `targetLocales` aligné avec ces codes de locale, puis `sync`.

<a id="theme-strings"></a>
## Chaînes de thème

Le chrome du thème Nextra (`editLink`, l'espace réservé à la recherche, le pied de page, etc.) n'est pas extrait du markdown. Rédigez les chaînes anglaises dans un module de dictionnaire TypeScript (par exemple `app/_dictionaries/en.ts`) et traduisez-le dans **`translate-docs`** :

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/en"],
      "outputDir": "content",
      "nextraDictionaryPath": "app/_dictionaries/en.ts",
      "docsOutput": {
        "style": "nextra",
        "docsRoot": "content/en"
      }
    }
  ]
}
```

L'outil écrit `app/_dictionaries/{locale}.ts` (modèle par défaut : `{dir}/{locale}.ts`). Chargez le module par paramètres régionaux dans `app/_dictionaries/get-dictionary.ts` et transmettez les chaînes traduites à `<Layout>`, `<Search>`, `<Footer>` et aux composants de thème associés.

**N'utilisez pas** `json[]` pour les chaînes du dictionnaire de thème Nextra — ce modèle est uniquement destiné aux bundles de paramètres régionaux d'applications non liés.

<a id="sidebar-labels-_metats"></a>
## Étiquettes de la barre latérale (`_meta.ts`)

Nextra 3+ utilise des fichiers TypeScript `_meta.ts` / `_meta.tsx` pour la structure et les titres de la barre latérale. Lorsque `docsOutput.style` est `"nextra"`, **`translate-docs`** collecte automatiquement `_meta.ts`, `_meta.tsx` et `_meta.js` sous `docsRoot`, traduit les littéraux de chaîne dans la carte méta `export default { … }` et écrit des fichiers en miroir sous `content/{locale}/**`.

**Modèle recommandé :** conservez les littéraux anglais en ligne dans `content/en/**/_meta.ts` (comme pour [swr-site](https://github.com/shuding/nextra/tree/main/examples/swr-site)) :

```text
content/en/_meta.ts           English sidebar labels (source)
content/pt-BR/_meta.ts        Translated copy (generated by translate-docs)
```

Facultatif : remplacez la collection par `docs[].nextraMetaGlob` ou restreignez les noms de propriétés traduisibles avec `docs[].nextraMetaTranslatableKeys` (par défaut : `title`, `display`, `breadcrumb`).

**Ne créez pas manuellement** de sidecars JSON (`i18n/meta.en.json`) ou de fichiers `_meta.ts` minces qui importent du JSON traduit — régénérez les fichiers `_meta` de paramètres régionaux avec `sync` / `translate-docs` lorsque l'anglais change.

<a id="example-project"></a>
## Exemple de projet

[examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) — Sources anglaises à `content/en/`, arborescences de pages `pt-BR` et `zh-Hans` validées, fichiers `_meta.ts` en ligne et `app/_dictionaries/{locale}.ts`. Un composant serveur (`app/_components/feedback-links.tsx`) utilise `t()` via une recherche de bundle plat afin que le chrome personnalisé puisse se trouver à côté du dictionnaire. Exécutez `pnpm run dev` sur le port 3070.

<a id="agent-prompt-dictionary-and-routes"></a>
## Invite de l'agent : dictionnaire et routes

Utilisez ceci lorsque le site a encore des chaînes de mise en page codées en dur et aucune arborescence `content/en/`. Il suit le chemin par défaut (dictionnaire + `_meta.ts` + `translate-docs`). Il n'introduit pas `t()`.

<details class="agent-prompt">
<summary>Invite dictionnaire et routes</summary>

````markdown
# Add Nextra 4 i18n with a theme dictionary

## Context

ai-i18n-tools translates Nextra page bodies, `_meta.ts` object literals, and the
theme dictionary module (`nextraDictionaryPath`, usually
`app/_dictionaries/en.ts`) with `translate-docs`. The English sentence in that
dictionary is the source text. Do not translate strings yourself. Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit `next.config`, `app/[lang]/layout.tsx`, `app/_dictionaries/en.ts`,
`app/_dictionaries/get-dictionary.ts`, and move MDX under `content/en/`. Skip
`docsRepositoryBase` (a URL). Keep native language names in a `LOCALE_LABELS`
map untranslated (`English`, `Português (Brasil)`). Do not move `_meta.ts`
sidebar labels into the dictionary or into `t()`.

## Call shape

- `next.config`: `i18n.locales` and `defaultLocale`.
- English MDX and `_meta.ts` live under `content/en/`. `getPageMap('/${lang}')`
  loads the matching tree.
- `app/_dictionaries/en.ts` exports the English chrome (`siteTitle`, `footer`,
  `editLink`, search placeholder, table-of-contents title, last-updated label).
  `get-dictionary.ts` dynamically imports `./${locale}`.
- Pass those fields into `<Layout>`, `<Navbar>`, and `<Footer>`. Set
  `<Layout i18n>` from `LOCALE_LABELS`.
- Config: `features.translateDocs`, `docsOutput.style: "nextra"`,
  `docsRoot: "content/en"`, `nextraDictionaryPath: "app/_dictionaries/en.ts"`.
  `targetLocales` matches `i18n.locales` except the default locale.

## Order

1. Route, config, and dictionary wiring.
2. Move existing MDX into `content/en/` and point `contentPaths` at that folder.
3. Ask the user to run `sync`. Do not write `app/_dictionaries/pt-BR.ts` or
   `content/pt-BR/` by hand.

## Do not

- Do not translate, rename, or reword the English dictionary strings.
- Do not add `t()`, `getRequestConfig`, or a `dictionary.ts` filename. The
  English module is `app/_dictionaries/en.ts`.
- Do not duplicate a string in both the dictionary and a later `t()` call.
- Do not hand-edit generated locale dictionaries or locale `_meta.ts` files.

## Verify

- `pnpm build` passes.
- `/` shows the English dictionary strings. After `sync`, one non-English route
  shows translated chrome and page titles.
- Sidebar labels come from `content/en/**/_meta.ts`, not from the dictionary.

## Report back

List files changed, each layout string you left untranslated and why (URLs,
native language names), and any MDX you were not sure belonged under
`content/en/`.
````

</details>

<a id="optional-t-for-app-react-hybrid"></a>
## Facultatif : `t()` pour `app/` React (hybride)

**Par défaut :** Les littéraux d'objet `_meta.ts` et `app/_dictionaries/en.ts` sont traduits par `translate-docs`. Aucun `t()` n'est requis pour ce chrome.

**Hybride facultatif :** les composants serveur personnalisés peuvent appeler `t("source sentence")` et `translate-ui`. La phrase est écrite en `sourceLocale`, qui peut être n'importe quelle langue. Ne copiez pas les chaînes de dictionnaire ou les titres `_meta.ts` dans ces appels. `extract` ne voit que les littéraux à l'intérieur de `t()`, donc `ui.sourceRoots` ne doit lister que les dossiers qui contiennent ces appels (l'exemple utilise `app/_components`), et non `app/_dictionaries`.

Un singleton i18next au niveau du module avec `changeLanguage` est dangereux dans un composant serveur : les requêtes concurrentes le partagent. L'exemple utilise plutôt une recherche sans état. `getT(lang)` charge `locales/{lang}.json` pour une locale cible, traite la route source comme un bundle vide (le littéral anglais est déjà le texte), et interpole avec `interpolateTemplate` de `ai-i18n-tools/runtime`. Les espaces réservés sont <code v-pre>{{name}}</code> avec des clés de mots ASCII. C'est la même idée que [examples/astro-website/src/i18n/t.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-website/src/i18n/t.ts).

Cette recherche ne sélectionne pas les formes plurielles. Un composant qui a besoin de `plurals: true` doit utiliser le chemin i18next de [Wire i18next](/fr/guide/ui-strings/i18next-runtime) dans un composant client, ou un `createInstance()` par requête.

Configuration pour l'hybride, à côté du bloc de documentation existant :

- `features.translateUIStrings`
- `ui.sourceRoots` — dossiers qui contiennent des appels `t()`
- `ui.stringsJson`
- `ui.flatOutputDir`

Le `sourceLocale` de l'exemple est `en-GB` et la route du site est `en`. Avec la recherche sans état, la route `en` n'a pas besoin de bundle, donc cette non-concordance n'a pas d'importance. Cela n'a d'importance que si vous basculez ce composant vers le bootstrap i18next, qui clé les bundles par `sourceLocale`.

| Contenu | Pipeline par défaut | Alternative facultative |
|---------|---------------------|-------------------------|
| Corps de page MDX | `translate-docs` | — |
| Titres d'objet `_meta.ts` / `_meta.tsx` | `translate-docs` | refactoriser en `t()` dans JSX (hybride) |
| Mise en page `app/`, `_components/` | `nextraDictionaryPath` + dictionnaire `.ts` | `t()` + `translate-ui` |

Voir `app/_components/feedback-links.tsx` et `lib/ui-t.ts` dans [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/). `pnpm run i18n:sync-ui` dans cet exemple exécute l'extraction et `translate-ui` sans toucher au pipeline de documentation.

**Exemple d'invite d'agent IA** (copiez dans Cursor ou un autre agent de codage lors de l'ajout de `t()` à côté du dictionnaire) :

<details class="agent-prompt">
<summary>Invite t() hybride</summary>

````markdown
# Add a stateless t() lookup to a Nextra 4 server component

## Context

MDX pages, `_meta.ts`, and `app/_dictionaries/en.ts` stay on `translate-docs`.
Do not duplicate those strings in `t()`. This task adds `t("source sentence")`
only in custom components that the dictionary does not cover. The literal is the
catalog key and is written in `sourceLocale`, which can be any language. Do not translate any string.

Follow `lib/ui-t.ts` and `app/_components/feedback-links.tsx` in
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit the named components and `ai-i18n-tools.config.json`. Do not edit
`app/_dictionaries`, `content/**/_meta.ts`, or generated locale trees. Skip
URLs, native language names, and `docsRepositoryBase`.

## Call shape

Create `lib/ui-t.ts`. `getT(lang)` loads `locales/{lang}.json` through a
dynamic-import map for target locales, uses an empty bundle for the source
route, and returns
`(source, vars) => interpolateTemplate(flat[source] ?? source, vars ?? {})` with
`interpolateTemplate` imported from `ai-i18n-tools/runtime`.

Replace hardcoded sentences in the named server components with `t("source sentence")`. The sentence is written in `sourceLocale`, which can be any language.
A placeholder is `t("You are reading {{page}}.", { page })`.

Do not use `getRequestConfig` (that is a next-intl API) and do not call
`changeLanguage` on a shared i18next instance. This lookup does not resolve
plurals. Leave plural copy on the i18next client path.

Set `features.translateUIStrings`, `ui.sourceRoots` to only the folders that
contain `t()` calls, `ui.stringsJson`, and `ui.flatOutputDir`.

## Order

1. Add `lib/ui-t.ts` and the `t()` calls.
2. Set the four `ui` config keys.
3. Run `ai-i18n-tools extract` (or `sync-ui`). Do not hand-write
   `locales/*.json`.

## Do not

- Do not translate, rename, or reword the source sentences.
- Do not put `t()` keys in `app/_dictionaries` or move `_meta.ts` titles into
  `t()`.
- Do not hand-edit `strings.json` or flat locale files.
- Do not change layout or Nextra theme props that already receive dictionary
  strings.

## Verify

- `extract` writes a non-empty catalog containing the new sentences and nothing
  from the dictionary.
- The project build passes.
- The source route still shows the English sentences. After `translate-ui`, one
  non-English route renders the translated component.

## Report back

List files changed, each string you left in the dictionary on purpose, and any
plural or server-concurrency case you did not convert.
````

</details>

<a id="link-conventions"></a>
## Conventions de lien

Nextra sert des routes préfixées par le locale via Next.js `i18n` (`/guide/getting-started`, `/pt-BR/guide/getting-started`). **Les liens internes à la page doivent rester neutres par rapport au locale** (`/guide/getting-started`) afin que Next.js puisse préfixer automatiquement le locale actif.

Activez le normaliseur intégré pour que `translate-docs` corrige automatiquement les liens dans chaque fichier traduit :

```json
"docsOutput": {
  "style": "nextra",
  "docsRoot": "content/en",
  "rewriteNextraLinks": true
}
```

`rewriteNextraLinks` est activé par défaut lorsque `style` est `"nextra"`.

| Auteur dans la locale source | Après normalisation |
|--------------------------|------------------|
| `[Guide](content/en/guide/getting-started.mdx)` | `[Guide](/fr/guide/getting-started)` |
| `[Guide](/fr/guide/getting-started.mdx)` | `[Guide](/fr/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | inchangé (URL complète) |

**Règles de rédaction**

- Liens de documentation inter-pages : utilisez des **routes de site neutres par rapport au locale** (`/guide/…`) dans MDX anglais, ou des chemins `content/en/…` / `.mdx` relatifs et laissez le normalisateur les réécrire pendant `sync`.
- Fichiers de dépôt en dehors de l'arborescence de contenu : utilisez des **URL complètes**.
- Ne modifiez **pas** manuellement les liens dans `content/<locale>/` — régénérez avec `sync` / `translate-docs`.

<a id="optional-locale-proxy"></a>
## Proxy de locale facultatif

Nextra fournit un proxy de détection de locale pour les sites i18n. Exportez-le depuis `proxy.ts` à la racine de votre projet :

```ts
export { proxy } from 'nextra/locales'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)',
  ],
}
```

**Codes de locale de site vs `sourceLocale` :** Nextra et Next.js utilisent des codes de route courts (`en`, `pt-BR`, `zh-Hans`) dans `next.config`, `content/{locale}/` et le cookie `NEXT_LOCALE`. `sourceLocale` dans `ai-i18n-tools.config.json` peut être une balise BCP-47 telle que `en-GB` pour la qualité de la traduction — cette balise n'est **pas** une route de site. Si le cookie du navigateur ou `Accept-Language` se résout en une balise en dehors de `i18n.locales` (par exemple `en-GB` lorsque seul `en` est configuré), le proxy standard de Nextra peut rediriger en boucle. La démo [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) enveloppe `nextra/locales` pour réinitialiser les cookies et chemins invalides au locale de site par défaut avant de déléguer.

Cela ne fonctionne pas avec les exportations statiques `output: 'export'`. Voir [Nextra i18n docs](https://nextra.site/docs/guide/i18n).

Voir aussi [Configuration — `docsOutput`](/fr/reference/configuration#docsoutput) et [Output layouts](/fr/guide/documents/output-layouts).
