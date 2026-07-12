<a id="anchor-links"></a>
# Liens d'ancrage

Lorsque `docsOutput.style = "flat"`, la sortie réécrit les **chemins relatifs** entre les pages pour chaque locale (`guide.md` → `guide.de.md`). Les **liens d'ancre** — la forme habituelle en ligne dans le markdown avec un `#` après le chemin — permettent de sauter vers une section dans le fichier cible :

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Ici, la cible du lien est `setup.md`, et `#first-run` est l'ancre : elle doit faire défiler jusqu'au bon titre à l'intérieur de ce fichier.

<a id="why-anchor-links-need-attention"></a>
## Pourquoi les liens d'ancrage nécessitent une attention particulière

- `rewriteRelativeLinks` fixe le **nom de fichier** pour chaque langue (`setup.md` → `setup.de.md`).
- De nombreux moteurs de rendu dérivent le slug `#` du **texte visible du titre**. Après traduction, les titres diffèrent selon la langue, donc un slug généré automatiquement peut changer alors que le lien réécrit pourrait toujours indiquer `#first-run` — ou bien votre ancre anglaise `#…` ne correspond plus au slug que le moteur construit à partir du titre traduit.
- Résultat : les lecteurs arrivent sur le bon **fichier** mais à la mauvaise **ligne**, ou le navigateur ne trouve aucune correspondance pour le titre.

<a id="what-to-do"></a>
## Que faire

<a id="docusaurus-sites-preferred"></a>
### Sites Docusaurus (préféré)

Sur la documentation [Docusaurus](/fr/guide/integrations/docusaurus) (`docsOutput.style = "docusaurus"`), préférez les identifiants d'en-tête natifs de Docusaurus au lieu de `ai-i18n-tools write-heading-ids` :

1. Ajoutez un identifiant explicite sur la ligne d'en-tête avec le suffixe `{#…}` de Docusaurus, par exemple `## TLS configuration {#tls-configuration}`. Pendant la `translate-docs`, seul le texte visible de l'en-tête est traduit — le suffixe `{#tls-configuration}` est conservé dans chaque langue.
2. Exécutez `docusaurus write-heading-ids` depuis la racine de votre projet Docusaurus (souvent `pnpm run write-heading-ids` lorsqu'il est configuré dans `package.json`) pour ajouter ou actualiser les suffixes `{#…}` sur les en-têtes qui en sont dépourvus. Réexécutez après avoir renommé les en-têtes afin que les identifiants obsolètes correspondent aux titres actuels.

Pointez vos **liens d'ancrage** Markdown vers ces identifiants stables, par exemple `[label](other.md#tls-configuration)`, où le fragment correspond au suffixe `{#…}` — et non à un slug deviné à partir de mots anglais uniquement. Voir [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) pour des documents validés qui utilisent ce modèle.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### Autres mises en page (flat, Starlight, VitePress, etc.)

Lorsque vous n'êtes pas sur Docusaurus, ou que vous avez besoin d'ancres HTML au lieu de suffixes `{#…}` :

1. Exécutez `ai-i18n-tools write-heading-ids` sur votre source `.md` / `.mdx` avant `translate-docs` (même `docs[]` / `contentPaths` que d'habitude). Cet outil insère des ancres HTML explicites sur la ligne précédant chaque en-tête, afin que les valeurs `id` soient partagées par chaque copie traduite. Réexécutez-le après avoir renommé des en-têtes afin que les identifiants d'ancre obsolètes soient actualisés pour correspondre au titre actuel.
2. Faites pointer vos **liens d'ancre** en markdown vers ces identifiants stables, par exemple `[label](other.md#section-id)`, où `section-id` correspond à l'ancre insérée par l'outil — et non une déduction basée uniquement sur les mots anglais.

<a id="example"></a>
## Exemple

<a id="example-docusaurus"></a>
### Suffixe Docusaurus `{#…}`

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (source anglaise) :

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

Après `translate-docs`, le fragment de lien reste `#tls-configuration` dans chaque langue ; seuls le texte de l'en-tête et l'étiquette du lien changent :

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### Ancres HTML (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` après `write-heading-ids` (simplifié) :

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

Après `translate-docs`, les chemins de fichiers et les ancres `#…` restent alignés dans chaque fichier de langue, par exemple :

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

L'ancre `#tls-configuration` est identique dans toutes les langues car le `id` est fixé dans la source ; seuls le **texte** du titre et l'**étiquette** du lien sont traduits.

Si les liens ne fonctionnent toujours pas après la traduction, consultez [Dépannage](/fr/guide/documents/troubleshooting).
