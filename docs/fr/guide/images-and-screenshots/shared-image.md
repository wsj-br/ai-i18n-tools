<a id="shared-raster"></a>
# Raster partagé

À utiliser lorsqu'une seule image est partagée entre toutes les langues (pas de variante par langue).

- **`docsOutput.style = "flat"`** — le réécriveur de liens plat calcule le préfixe de profondeur par fichier de sortie, de sorte qu'un actif relatif à côté du fichier source (par exemple, `docs/figure.png` référencé comme `figure.png` depuis `docs/page.md`) se résout correctement dans chaque sortie traduite — aucune règle `postProcessing.regexAdjustments` n'est nécessaire. Lorsque les fichiers source se trouvent dans des sous-répertoires, activez `flatPreserveRelativeDir: true` afin que les chemins de sortie préservent l'arborescence source (voir [Préfixe de profondeur par fichier](/fr/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)).
- **`docsOutput.style = "vitepress"`** (et d'autres préréglages de système de documentation avec un normaliseur de liens) — les chemins absolus à la racine du site tels que `/translation-dashboard.png` restent inchangés lorsque l'URL est identique dans chaque langue — aucune règle `regexAdjustments` n'est nécessaire.

**Exemple plat :** un projet traduit `docs/guide/quick-start.md` en `translated-docs/docs/guide/quick-start.<locale>.md`. Cela suppose `flatPreserveRelativeDir: true` afin que `docs/guide/quick-start.md` produise `translated-docs/docs/guide/quick-start.<locale>.md` (pas `translated-docs/quick-start.<locale>.md`). Une image sœur `docs/translation-dashboard.png` est référencée depuis `quick-start.md` comme `../translation-dashboard.png`. Le réécriveur calcule le préfixe par fichier du répertoire du fichier de sortie vers le répertoire source (`../../docs/`), produisant `../../docs/translation-dashboard.png`. Depuis `translated-docs/docs/guide/`, cela se résout correctement en `docs/translation-dashboard.png`.

Une règle `postProcessing` est toujours nécessaire lorsque :
- L'actif est référencé via une URL absolue dans **`docsOutput.style = "flat"`** (par exemple `/img/figure.png`) — le réécriveur plat ne gère que les chemins relatifs
- Vous souhaitez modifier l'URL de l'actif pour d'autres raisons (par exemple, passer à un CDN)

<a id="implementation-example"></a>
### Exemple de mise en œuvre

La documentation de ce dépôt utilise la variante d'URL absolue des images partagées : le [guide du tableau de bord de traduction](/fr/guide/translation-dashboard/) référence sa capture d'écran comme `![Translation Dashboard](/translation-dashboard.png)` — un chemin absolu, à la racine du site, servi depuis [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Étant donné que l'URL est identique pour chaque langue, aucune règle `postProcessing.regexAdjustments` n'est nécessaire.
