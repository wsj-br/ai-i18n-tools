<a id="svg-troubleshooting"></a>
# Dépannage SVG

Voir aussi [Dépannage des images et captures d'écran](/fr/guide/images-and-screenshots/troubleshooting).

- **Sources et sorties SVG dans le même répertoire** — gardez `svg.sourcePath` et `svg.outputDir` séparés.
- **URL statiques Docusaurus absolues pour les SVG colocalisés** — utilisez des chemins `../assets/` relatifs dès le début.
- **Balise de fermeture inattendue `text` vs `g` après traduction** — Inkscape émet souvent des `<text … />` auto-fermantes vides à côté des étiquettes réelles. Les anciennes expressions régulières d'extraction les étendaient jusqu'au prochain `</text>` et écrivaient une balise de fermeture parasite. Mettez à niveau et réexécutez `translate-svg` (ou `sync`) pour régénérer le SVG localisé.
- **Étiquettes romanisées ou uniquement latines dans les SVG hindi, arabe, CJK ou cyrilliques** — la même politique de système d'écriture que pour les documents s'applique ; les lignes de cache de script incorrect sont rejetées lors du prochain `translate-svg` / `sync`. Réexécutez avec `--debug-failed` global pour écrire un journal `FAILED-TRANSLATION` sous `cacheDir` pour **chaque** modèle rejeté (invite, sortie brute, erreur de script), et pas seulement lorsque tous les modèles échouent. Voir [La sortie hindi, arabe, CJK ou cyrillique est romanisée](/fr/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters).
