<a id="statistics"></a>
# Sankhyiki (Statistics)

**Sankhyiki (Statistics)** tab aapke documentation cache aur UI string catalog ke liye read-only aggregates dikhata hai. Data command line par `ai-i18n-tools statistics` se mel khata hai.

Iska upyog in sawalon ke jawab dene ke liye karein: *kitna anuvad kiya gaya hai, kaun se model ka upyog kiya gaya hai, aur kahan kamiyaan hain?*

<a id="documentation-cache"></a>
## Documentation cache

**Saransh (Summary) cards:**

| Card | Matlab (Meaning) |
| --- | --- |
| Kul segments | Sabhi cached doc segment rows |
| Stale / Active | Segments jinhe banane ke baad kabhi upyog nahi kiya gaya vs kam se kam ek baar upyog kiya gaya |
| Tracked files / Unique filepaths | Cache mein file ki sankhya |
| Upyog kiye gaye models | Vibhinn anuvad models |
| Glossary entries | User glossary CSV mein row ki sankhya (jab configure kiya gaya ho) |

**Tables:**

- **Locale ke anusar segments** — har target locale ke liye sankhya, stale/active breakdown ke saath
- **Model ke anusar segments** — har model ke liye sankhya
- **Model × locale matrix** — poora cross-tab (CLI `--max-columns` terminal output par seema ke samaan)

<a id="ui-strings"></a>
## UI strings

Tab dikhaya jata hai jab `strings.json` uplabdh ho:

| Section | Matlab (Meaning) |
| --- | --- |
| Sadharan (Plain) vs bahuvachan (plural) sankhya | Kul non-plural aur plural-group entries |
| Pratyeik locale ke liye sadharan (plain) coverage | Pratyeik locale ke liye kitni sadharan (plain) strings ka anuvad hai |
| Pratyeik locale ke liye bahuvachan (plural) poornata | Kitne plural groups mein sabhi avashyak CLDR forms hain |
| Model ke anusar / model × locale | Documentation cache ke samaan matrix layout |

<a id="no-editing-on-this-tab"></a>
## Is tab par koi editing nahi

Sankhyiki (Statistics) kewal dekhne ke liye hai. Data badalne ke liye, anya dashboard tabs ka upyog karein ya anuvad commands ko phir se chalayein, phir dashboard ko reload karein.

Scripted output ke liye, run karein:

```bash
ai-i18n-tools statistics
# Optional: widen model × locale tables
# ai-i18n-tools statistics --max-columns 12
```
