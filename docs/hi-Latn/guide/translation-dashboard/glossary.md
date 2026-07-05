<a id="glossary"></a>
# Shabdkosh

**Shabdkosh** tab aapke user shabdkosh CSV (config mein `glossary.userGlossary`) ko edit karta hai. Yahan ki entries `translate-ui` aur `proofread-ui` ke liye shabdavali ke sanket hain — inka upyog documentation translation dwara **nahi** kiya jata hai.

Jab `glossary.userGlossary` configure nahi hota hai to tab chhupa hota hai.

<a id="csv-columns"></a>
## CSV columns

| Column | Matlab |
| --- | --- |
| **Mool bhasha string** | Source term ya phrase |
| **locale** | Target locale, ya sabhi locales ke liye `*` |
| **Anuvaad** | Pasandeeda anuvaad |
| **Force** | Jab check kiya jata hai, to term ko bilkul waisa hi anuvaad kiya jana chahiye jaisa diya gaya hai |

<a id="add-a-row"></a>
## Ek row joden

Tab ke upar diye gaye form ka upyog karein:

1. **Original**, **locale** (`*` ya ek target locale code), aur **Translation** darj karein.
2. Vikalp roop se **Force** check karein.
3. **Add** par click karein.

CSV file pehli baar add karne par ban jati hai agar woh abhi tak maujood nahi hai.

<a id="edit-or-delete"></a>
## Edit ya delete karein

- **Inline edit** — table mein fields ko seedhe badlein aur us row par **Save** par click karein.
- **Delete** — delete control se ek row hatayein.

Parivartan agle `translate-ui`, `proofread-ui`, ya `sync` UI step par prabhavi honge.

<a id="filters"></a>
## Filters

**Original text**, **locale** (jismein `*` shamil hai), ya **translation text** substring dwara filter karein, phir **Apply** par click karein.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Dashboard edits aur glossary auto-add

Jab aap **UI strings** ya **UI plurals** tab mein ek UI string theek karte hain, to agla `translate-ui` run us sudhar ko glossary mein automatically jod sakta hai agar `glossary.autoAddUserEditedToGlossary` `true` hai. Un auto-added rows ki review, adjust, ya remove karne ke liye Glossary tab ka upyog karein.
