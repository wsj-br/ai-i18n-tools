<a id="t-calls--plurals"></a>
# Appels t() et pluriaux

<a id="using-t-in-source-code"></a>
## Utilisation de `t()` dans le code source

Appelez `t()` avec une **chaîne littérale** afin que le script d'extraction puisse la repérer :

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Le même modèle fonctionne en dehors de React (Node.js, composants serveur, CLI) :

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Règles :**

- Seules ces formes sont extraites : `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clé doit être une **chaîne littérale** — aucune variable ou expression ne peut servir de clé.
- N'utilisez pas de littéraux de gabarit (template literals) pour la clé : <code>{'t(`Hello ${name}`)'}</code> n'est pas extractible.

<a id="interpolation"></a>
## Interpolation

Utilisez l'interpolation native du deuxième argument d'i18next pour les espaces réservés <code v-pre>{{var}}</code> :

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

La commande extract analyse le **deuxième argument** lorsqu'il s'agit d'un objet littéral simple et lit des indicateurs dédiés aux outils tels que `plurals: true` et `zeroDigit` (voir **Pluriels cardinaux** ci-dessous). Pour les chaînes ordinaires, seule la clé littérale est utilisée pour le hachage ; les options d'interpolation sont tout de même transmises à i18next au moment de l'exécution.

Si votre projet utilise un utilitaire d'interpolation personnalisé (par exemple, en appelant `t('key')` puis en transmettant le résultat via une fonction de modèle comme <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) rend cela inutile — il applique l'interpolation <code v-pre>{{var}}</code> même lorsque la locale source renvoie la clé brute. Migrez les sites d'appel vers <code v-pre>t('Hello {{name}}', { name })</code> et supprimez l'utilitaire personnalisé.

<a id="cardinal-plurals-plurals-true"></a>
## Pluriels cardinaux (`plurals: true`)

**Vous n'écrivez pas les formes plurielles à la main.** Dans le code source, écrivez le message une fois et passez deux choses dans le deuxième argument :

1. **`plurals: true`** — indique à l'extraction et à `translate-ui` que cet appel est un groupe de pluriels cardinaux.
2. **`count`** — le nombre qu'i18next utilise à l'exécution pour choisir la bonne forme.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

C'est tout ce dont vous avez besoin sur le site d'appel. Vous ne définissez **pas** vous-même `_zero`, `_one`, `_other` ou toute autre clé de suffixe.

Lorsque vous exécutez `translate-ui`, **ai-i18n-tools appelle un LLM** pour générer chaque catégorie cardinale requise pour chaque locale cible (`zero`, `one`, `two`, `few`, `many`, `other` — selon ce que `Intl.PluralRules` exige pour cette langue). Le modèle reçoit votre littéral original ainsi que les variantes plurielles de la langue source, puis renvoie les formes traduites. L'outillage les écrit dans `strings.json` et émet du JSON i18next plat (`<groupId>_zero`, `<groupId>_one`, …) afin que la résolution des pluriels à l'exécution fonctionne sans configuration supplémentaire de votre part.

- `zeroDigit` (facultatif) — uniquement pour l'outillage ; **non** lu par i18next. Lorsque `true`, l'invite LLM préfère un littéral arabe `0` dans la chaîne `_zero` pour chaque locale où cette forme existe ; lorsque `false` ou omis, une formulation naturelle du zéro est utilisée. Supprimez ces clés avant d'appeler `i18next.t` (voir `wrapT` ci-dessous).

**Validation :** Si le message contient **deux ou plusieurs** espaces réservés <code v-pre>{{…}}</code> distincts, **l'un d'entre eux doit être** <code v-pre>{{count}}</code> (l'axe pluriel). Sinon, `extract` **échoue** avec un message clair de fichier/ligne.

**Deux compteurs indépendants** (par exemple, sections et pages) ne peuvent pas partager un même message pluriel — utilisez **deux** appels à `t()` (chacun avec `plurals: true` et son propre `count`) et concaténez-les dans l'interface utilisateur.

**Non inclus en v1 :** pluriels ordinaux (`_ordinal_*`, `ordinal: true`), pluriels par intervalle, pipelines uniquement ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
## Comment les pluriels sont stockés et émis

**Dans** `strings.json`, les groupes pluriels utilisent **une ligne par hachage** avec `"plural": true`, le littéral d'origine dans `source`, et `translated[locale]` sous forme d'objet mappant les catégories cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) aux chaînes de caractères correspondant à ce paramètre régional.

**JSON plat par langue :** Les lignes non plurielles restent **phrase source → traduction**. Les lignes plurielles sont émises sous forme de `<groupId>_original` (égal à `source`, à titre de référence) et de `<groupId>_<form>` pour chaque suffixe, afin qu’i18next puisse résoudre les pluriels nativement. `translate-ui` écrit également `{sourceLocale}.json` contenant **uniquement** les clés plurielles plates (chargez ce bundle pour la langue source afin que les clés suffixées soient résolues ; les chaînes simples utilisent toujours la clé comme valeur par défaut). Pour chaque langue cible, les clés suffixées émises correspondent à `Intl.PluralRules` pour cette langue (`requiredCldrPluralForms`) : si `strings.json` a omis une catégorie car elle correspondait à une autre après compactage (par exemple, le `many` arabe identique à `other`), `translate-ui` écrit quand même chaque suffixe requis dans le fichier plat en le copiant depuis une chaîne de secours, afin qu'aucune clé ne soit manquée lors de la recherche au runtime.

Exécution (`ai-i18n-tools/runtime`) : **Appelez** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — il exécute `wrapI18nWithKeyTrim`, enregistre le bundle pluriel facultatif `translate-ui` `{sourceLocale}.json`, puis `wrapT` en utilisant `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` supprime `plurals` / `zeroDigit`, réécrit la clé vers l'ID de groupe si nécessaire, et transmet `count` (facultatif : s'il y a un seul espace réservé non-<code v-pre>{{count}}</code>, `count` est copié à partir de cette option numérique). Voir [Wire i18next](/guide/ui-strings/i18next-runtime) et [Runtime helpers](/guide/runtime-helpers).

**Environnements anciens :** `Intl.PluralRules` est requis pour les outils et pour un comportement cohérent ; utilisez un polyfill si vous ciblez des navigateurs très anciens.
