<a id="t-calls--plurals"></a>
# Appels t() et pluriels

<a id="using-t-in-source-code"></a>
## Utilisation de `t()` dans le code source

Appelez `t()` avec une **chaîne de caractères littérale** afin que le script d'extraction puisse la trouver :

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Le même modèle fonctionne en dehors de React (Node.js, composants serveur, CLI) :

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Règles :**

- Seules ces formes sont extraites : `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clé doit être une **chaîne de caractères littérale** — pas de variables ou d'expressions comme clé.
- N'utilisez pas de littéraux de modèle pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

<a id="interpolation"></a>
## Interpolation

Utilisez l'interpolation native du deuxième argument d'i18next pour les espaces réservés <code v-pre>{{var}}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

La commande d'extraction analyse le **deuxième argument** lorsqu'il s'agit d'un littéral d'objet simple et lit les drapeaux réservés aux outils tels que `plurals: true` et `zeroDigit` (voir **Pluriels cardinaux** ci-dessous). Pour les chaînes ordinaires, seule la clé littérale est utilisée pour le hachage ; les options d'interpolation sont toujours transmises à i18next au moment de l'exécution.

Si votre projet utilise un utilitaire d'interpolation personnalisé (par exemple, en appelant `t('key')` puis en transmettant le résultat via une fonction de modèle comme <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) rend cela inutile — il applique l'interpolation <code v-pre>{{var}}</code> même lorsque la locale source renvoie la clé brute. Migrez les sites d'appel vers <code v-pre>t('Hello {{name}}', { name })</code> et supprimez l'utilitaire personnalisé.

<a id="cardinal-plurals-plurals-true"></a>
## Pluriels cardinaux (`plurals: true`)

**Vous n'écrivez pas les formes plurielles à la main.** Dans le code source, écrivez le message une fois et passez deux choses dans le deuxième argument :

1. **`plurals: true`** — indique à l'extraction et à `translate-ui` que cet appel est un groupe de pluriels cardinaux.
2. **`count`** — le nombre qu'i18next utilise au moment de l'exécution pour choisir la bonne forme.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

C'est tout ce dont vous avez besoin au niveau du site d'appel. Vous ne définissez **pas** `_zero`, `_one`, `_other` ou d'autres clés de suffixe vous-même.

Lorsque vous exécutez `translate-ui`, **ai-i18n-tools appelle un LLM** pour générer chaque catégorie cardinale requise pour chaque locale cible (`zero`, `one`, `two`, `few`, `many`, `other` — selon ce que `Intl.PluralRules` exige pour cette langue). Le modèle reçoit votre littéral original ainsi que les variantes plurielles de la langue source, puis renvoie les formes traduites. L'outillage les écrit dans `strings.json` et émet un JSON i18next plat (`<groupId>_zero`, `<groupId>_one`, …) afin que la résolution des pluriels au moment de l'exécution fonctionne sans configuration supplémentaire de votre part.

- `zeroDigit` (facultatif) — réservé aux outils ; **non** lu par i18next. Lorsque `true`, l'invite LLM préfère un `0` arabe littéral dans la chaîne `_zero` pour chaque locale où cette forme existe ; lorsque `false` ou omis, une formulation naturelle du zéro est utilisée. Supprimez ces clés avant d'appeler `i18next.t` (voir `wrapT` ci-dessous).

**Validation :** Si le message contient **deux ou plusieurs** espaces réservés <code v-pre>{{…}}</code> distincts, **l'un d'entre eux doit être** <code v-pre>{{count}}</code> (l'axe pluriel). Sinon, `extract` **échoue** avec un message clair de fichier/ligne.

Après que le LLM a renvoyé les formes CLDR, `translate-ui` vérifie également chaque forme par rapport au **littéral original du développeur** : chaque espace réservé source doit apparaître dans chaque catégorie (y compris `one`), les formes ne doivent pas inventer de nouveaux jetons <code v-pre>{{…}}</code> / `%d` / `{n}`, et les sources uniquement nominales (pas de <code v-pre>{{count}}</code> et pas de chiffres, par exemple des étiquettes d'unité comme `Minutes`) doivent rester uniquement nominales. Les non-concordances rejettent la réponse de ce modèle et réessayent le modèle suivant dans la liste de secours.

**Deux comptes indépendants** (par exemple, sections et pages) ne peuvent pas partager un seul message pluriel — utilisez **deux** appels `t()` (chacun avec `plurals: true` et son propre `count`) et concaténez dans l'interface utilisateur.

**Pas dans la v1 :** pluriels ordinaux (`_ordinal_*`, `ordinal: true`), pluriels d'intervalle, pipelines uniquement ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
## Comment les pluriels sont stockés et émis

**Dans** `strings.json`, les groupes de pluriels utilisent **une ligne par hachage** avec `"plural": true`, le littéral original dans `source`, et `translated[locale]` comme un objet mappant les catégories cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) aux chaînes de caractères pour cette locale.

**JSON de locale plat :** Les lignes non-plurielles restent **phrase source → traduction**. Les lignes plurielles sont émises comme `<groupId>_original` (égal à `source`, pour référence) et `<groupId>_<form>` pour chaque suffixe afin que i18next résolve les pluriels nativement. `translate-ui` écrit également `{sourceLocale}.json` contenant **uniquement** les clés plates plurielles (chargez ce bundle pour la langue source afin que les clés suffixées soient résolues ; les chaînes de caractères simples utilisent toujours la clé par défaut). Pour chaque locale cible, les clés de suffixe émises correspondent à `Intl.PluralRules` pour cette locale (`requiredCldrPluralForms`) : si `strings.json` a omis une catégorie parce qu'elle correspondait à une autre après la compaction (par exemple, l'arabe `many` identique à `other`), `translate-ui` écrit toujours chaque suffixe requis dans le fichier plat en copiant à partir d'une chaîne sœur de secours afin que la recherche à l'exécution ne manque jamais une clé.

Exécution (`ai-i18n-tools/runtime`) : **Appelez** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — il exécute `wrapI18nWithKeyTrim`, enregistre le bundle de pluriels optionnel `translate-ui` `{sourceLocale}.json`, puis `wrapT` en utilisant `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` supprime `plurals` / `zeroDigit`, réécrit la clé vers l'ID de groupe si nécessaire, et transmet `count` (optionnel : s'il y a un seul espace réservé non-<code v-pre>{{count}}</code>, `count` est copié à partir de cette option numérique). Voir [Connecter i18next](/fr/guide/ui-strings/i18next-runtime) et [Aides à l'exécution](/fr/guide/runtime-helpers).
