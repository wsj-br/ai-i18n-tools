<a id="common-mistakes-and-troubleshooting"></a>
# Saamaany galatiyaan aur samasya nivaaran

**Screenshot paths mein koi locale directory nahi hai**
`images/screenshots/screenshot.png` — locale variants ko alag nahi kar sakta aur rewrite nahi kiya ja sakta. [per-locale folder](/hi-Latn/guide/images-and-screenshots/per-locale-folder) rewriting ka upyog karne se pehle `images/screenshots/<locale>/screenshot.png` mein punargathit karein.

**Regex mein hardcoded source locale**
`"search": "screenshots/en-GB/"` — agar `sourceLocale` badalta hai to chupchap toot jaata hai. Iske bajaye `"search": "screenshots/[^/]+/"` ka upyog karein.

**SVG sources aur outputs ek hi directory mein**
Agar `svg.sourcePath` aur `svg.outputDir` overlap karte hain, to generated files hand-edited sources ke saath mil jaate hain. Unhe alag directories mein rakhein.

**Colocated SVGs ke liye Absolute Docusaurus static URLs**
`/img/diagram.svg` (`static/img/` se) anuvadit output mein `../assets/` mein rewrite karne ke liye ek `regexAdjustments` rule ki zaroorat hoti hai. Source SVGs ko `static/assets/` mein rakhein aur shuru se hi relative `../assets/diagram.svg` ka upyog karein taaki isse poori tarah bacha ja sake.

**Docusaurus mein `docs/assets` symlink gayab**
Symlink ke bina, `docs/user-guide/` mein source docs `static/assets/` mein PNGs ya SVGs ko relative path ke madhyam se sandarbhit nahi kar sakte. Project banate samay symlink set karein: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` script kewal source locale ko capture karti hai**
Per-locale folder layout ke liye har locale ke liye PNG files ki avashyakta hoti hai. Yadi script kewal `en-GB` ko capture karti hai, toh anuvadit docs mein missing files ki or ishara karne wale rewritten paths honge.

**fenced config examples ke andar `regexAdjustments` ko phir se likhna**
`postProcessing` poore anuvaadit markdown body par chalta hai, jismein fenced code blocks bhi shaamil hain. Yadi koi doc page ek config snippet ko embed karta hai jismein ek matching path (jaise ki `screenshots/en-GB/`) hota hai, to vah snippet anuvaadit output mein bhi phir se likha jaata hai. Reusable examples mein generic `screenshots/[^/]+/` form ko prefer karein, ya swikaar karein ki anuvaadit docs illustrations ke andar locale-specific paths dikhaenge.
