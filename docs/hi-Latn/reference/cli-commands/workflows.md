<a id="cli--workflows--status"></a>
# CLI — Workflows aur status

<a id="sync"></a>
### `sync`

**Sankshipt vivaran:** `ai-i18n-tools sync [options]`

Nikasi (yadi saksham kiya gaya hai), phir UI anuvad, phir `translate-svg` jab `features.translateSVG` aur `config.svg` set hote hain, phir documentation anuvad, phir `translate-json` jab `features.translateJson` aur `json[]` set hote hain — jab tak `--no-ui`, `--no-svg`, `--no-docs`, ya `--no-json` ke saath chhoda nahi jata.

**Mukhya vikalp:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` ko UI aur SVG charanon ke saath-saath docs/JSON mein bhi aage badhaya jata hai; `--force-update` docs, JSON, aur SVG (UI nahi) par lagu hota hai. Docs charan `--emphasis-placeholders` aur `--debug-failed` (`translate-docs` ke saman arth) ko bhi aage badhata hai. `--prompt-format` `sync` flag nahi hai; docs aur JSON charan nirdharit default (`json-array`) ka upyog karte hain.

---

<a id="status"></a>
### `status`

**Sankshipt vivaran:** `ai-i18n-tools status [--max-columns <n>]`

Jab `features.translateUIStrings` chalu hota hai, to yah UI coverage prati sthal (`Translated` / `Missing` / `Total`) print karta hai. Phir yah markdown anuvad sthiti prati file × sthal (koi `--locale` filter nahi; sthal config se aate hain) print karta hai. Jab `features.translateJson` chalu hota hai aur `json[]` konfig kar diya jata hai, to yah JSON bundle sthiti prati block bhi print karta hai. Bade sthal suchi ko `n` sthal sthambh tak ki baari-baari ki gayi suchiyon mein vibhajit kiya jata hai (default **9**) taaki terminal mein rekhaen sankriya rahen.

**Mukhya vikalp:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**Sankshipt vivaran:** `ai-i18n-tools statistics [--max-columns <n>]`

Documentation cache aur `strings.json` aankde (Translation Dashboard → Statistics ke saman sangraha) print karta hai. `--max-columns`: prati model × sthal suchi ke liye adhiktam sthal sthambh (default **6**).

**Mukhya vikalp:** `--max-columns`

**Dekhein bhi:** [Dashboard statistics](/guide/translation-dashboard/statistics)
