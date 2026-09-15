<a id="svg-troubleshooting"></a>
# Dépannage SVG

Voir aussi [Dépannage des images et captures d'écran](/fr/guide/images-and-screenshots/troubleshooting).

- **Sources et sorties SVG dans le même répertoire** — maintenez `svg.sourcePath` et `svg.outputDir` séparés.
- **URL statiques absolues de Docusaurus pour les SVG colocalisés** — utilisez des chemins `../assets/` relatifs dès le début.
- **Balise de fermeture inattendue `text` vs `g` après la traduction** — Inkscape émet souvent des `<text … />` auto-fermantes vides à côté des étiquettes réelles. Les expressions régulières des extracteurs plus anciens les étendaient jusqu'au prochain `</text>` et écrivaient un fermeur égaré. Mettez à niveau et réexécutez `translate-svg` (ou `sync`) pour régénérer le SVG de la locale.
- **Étiquettes romanisées ou uniquement latines dans les SVG en hindi, arabe, CJK ou cyrillique** — la même politique de système d'écriture que pour les documents s'applique ; les lignes de cache de script incorrectes sont rejetées lors du prochain `translate-svg` / `sync`. Réexécutez avec `--debug-failed` global pour écrire un journal `FAILED-TRANSLATION` sous `cacheDir` pour **chaque** modèle écarté (invite, sortie brute, erreur de script), pas seulement lorsque tous les modèles échouent. Voir [La sortie en hindi, arabe, CJK ou cyrillique est romanisée](/fr/guide/documents/troubleshooting#wrong-script-or-romanized-output).
