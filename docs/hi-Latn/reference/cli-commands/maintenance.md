<a id="cli--cache--maintenance"></a>
# CLI — Cache aur maintenance

<a id="cleanup"></a>
### `cleanup`

**Synopsis:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Poori `markdown_source_issues` table ko saaf karta hai, phir `sync --force-update` (extract, UI, SVG, docs, aur `translate-json` jab enable ho) chalata hai taaki markdown issues abhi configure kiye gaye docs ke liye phir se populate ho saken; phir stale segment rows (null `last_hit_at` / empty filepath) ko hataata hai; `file_tracking` rows ko hataata hai jinka resolved source path disk par missing hai; translation rows ko hataata hai jinka `filepath` metadata ek missing file ki taraf ishara karta hai; orphaned `translation_failures` rows ko prunes karta hai. Sync ke baad chaar prune counts (stale segments, orphaned `file_tracking`, orphaned translations, orphaned failures) aur upfront markdown-issues clear count ko log karta hai.

**Mukhya vikalp:** `--dry-run`, `--backup`

`--backup <path>` modifications se pehle us path par ek SQLite backup likhta hai (jab tak yeh flag set na ho tab tak koi backup nahi).

---

<a id="clean-temp"></a>
### `clean-temp`

**Synopsis:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

Koi config nahi. `*.log`, `*.tmp`, aur `cache.db.backup*.sqlite` ke liye ek directory tree (default: cwd) ko walk karta hai, `./…` paths ko `find -print` ki tarah print karta hai. Matches ke saath: `Delete these files? (y/n)` prompt karta hai jab tak `-f` / `--force` (bina prompt ke delete karein). Koi matches na hone par: bina prompting ke exit karta hai. `--dry-run`: sirf list karein, koi prompt ya deletes nahi (`--force` ko override karta hai).

**Mukhya vikalp:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**Synopsis:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

Diye gaye locale(s) ke liye sabhi cached rows ko `translations`, `file_tracking`, aur `translation_failures` se delete karein, aur us locale ke liye generate kiye gaye artifacts: translated documents (`.md` / `.mdx` / `.astro` outputs jo `docs[]` se resolve kiye gaye hain, jismein orphaned outputs bhi shaamil hain jinka source hata diya gaya tha — har block ke output tree ko sweep karke paaya gaya, siwaye jab ek custom `pathTemplate` configure kiya gaya ho), per-locale flat UI file (`<flatOutputDir>/<locale>.json`), aur `strings.json` mein locale ki entries.

Locales ko repeatable `-l` / `--locale` (BCP-47 mein normalize kiya gaya) ke madhyam se pass kiya jaata hai. Per-locale counts (cache rows, documents, `strings.json` entries, flat file) print karta hai; un locales ke liye warn karta hai (error nahi deta) jinke paas purge karne ke liye kuch nahi hai. Confirmation ke liye prompt karta hai jab tak `-y` / `--yes` / `-f` / `--force` na ho. `--dry-run`: counts aur un files ki report karein jo hata di jaayengi, kuch bhi delete na karein. `--keep-files`: sirf SQLite cache ko purge karein, generated files aur `strings.json` ko untouched chhod dein. Koi SQLite backup nahi banaya jaata jab tak `--backup <path>` pass na kiya jaaye, jo deletion se pehle us path par ek backup likhta hai.

**Mukhya vikalp:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
