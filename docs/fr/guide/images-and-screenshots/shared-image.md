<a id="shared-raster"></a>
# Raster partagé

À utiliser lorsqu'une seule image est partagée entre tous les paramètres régionaux (aucune variante par paramètre régional). Lorsque `docsOutput.style = "flat"`, le réécritureur de liens plat calcule le préfixe de profondeur pour chaque fichier de sortie, donc une ressource située à côté du fichier source (par exemple `docs/figure.png` référencée comme `figure.png` depuis `docs/page.md`) est correctement résolue dans chaque sortie traduite — aucune règle `postProcessing.regexAdjustments` n'est nécessaire.

Exemple : un projet traduit `docs/guide/quick-start.md` en `translated-docs/docs/guide/quick-start.<locale>.md`. Une image sœur `docs/translation-dashboard.png` est référencée depuis `quick-start.md` comme `../translation-dashboard.png`. Le réécriveur calcule le préfixe par fichier du répertoire de sortie vers le répertoire source (`../../docs/`), produisant `../../docs/translation-dashboard.png`. À partir de `translated-docs/docs/guide/`, cela se résout correctement en `docs/translation-dashboard.png`.

Une règle `postProcessing` est tout de même nécessaire lorsque :
- La ressource est référencée via une URL absolue (par exemple `/img/figure.png`) — le réécritureur ne gère que les chemins relatifs
- Vous souhaitez modifier l'URL de la ressource pour d'autres raisons (par exemple passer à un CDN)

<a id="implementation-example"></a>
### Exemple de mise en œuvre

La documentation de ce dépôt utilise la variante d'URL absolue des images partagées : le [guide du tableau de bord de traduction](/fr/guide/translation-dashboard/) référence sa capture d'écran comme `![Translation Dashboard](/translation-dashboard.png)` — un chemin absolu, à la racine du site, servi depuis [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Étant donné que l'URL est identique pour chaque locale, aucune règle `postProcessing.regexAdjustments` n'est nécessaire ; actualisez le PNG avec [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) lorsque l'interface utilisateur du tableau de bord change.
