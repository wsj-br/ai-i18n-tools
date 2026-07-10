<a id="common-mistakes-and-troubleshooting"></a>
# Erreurs courantes et dépannage

**Pas de répertoire de paramètres régionaux dans les chemins de capture d'écran**
`images/screenshots/screenshot.png` — impossible de distinguer les variantes de paramètres régionaux et de les réécrire. Restructurez en `images/screenshots/<locale>/screenshot.png` avant d'utiliser la réécriture [de dossiers par paramètres régionaux](/fr/guide/images-and-screenshots/per-locale-folder).

**Langue source en dur dans les expressions régulières**
`"search": "screenshots/en-GB/"` — échoue silencieusement si `sourceLocale` change. Utiliser plutôt `"search": "screenshots/[^/]+/"`.

**Fichiers SVG sources et fichiers générés dans le même répertoire**
Si `svg.sourcePath` et `svg.outputDir` se chevauchent, les fichiers générés se mélangent avec les sources modifiées manuellement. Conserver des répertoires séparés.

**URLs statiques Docusaurus absolues pour des SVGs colocalisés**
`/img/diagram.svg` (depuis `static/img/`) nécessite une règle `regexAdjustments` pour réécrire vers `../assets/` dans la sortie traduite. Placer les SVGs sources dans `static/assets/` et utiliser dès le départ des chemins relatifs `../assets/diagram.svg` pour éviter entièrement ce problème.

**Lien symbolique `docs/assets` manquant dans Docusaurus**
Sans le lien symbolique, les documents sources dans `docs/user-guide/` ne peuvent pas faire référence aux PNG ou SVG dans `static/assets/` via un chemin relatif. Configurer le lien symbolique dès la création du projet : `ln -s ../static/assets documentation/docs/assets`.

**Le script `take-screenshots` ne capture que les paramètres régionaux source**
La disposition des dossiers par paramètres régionaux nécessite des fichiers PNG pour chaque paramètre régional. Si le script ne capture que `en-GB`, les documents traduits auront des chemins réécrits pointant vers des fichiers manquants.
