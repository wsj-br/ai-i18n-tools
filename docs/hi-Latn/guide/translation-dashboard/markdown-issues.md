<a id="markdown-issues-static-checks"></a>
# Markdown issues (static checks)

**Markdown issues** tab `markdown_source_issues` SQLite table se rows list karta hai. Har row ek **pre-translation** finding hai: jaise delimiter runs jo kabhi bhi CommonMark-style rules ke tahat emphasis/strikethrough ke roop mein pair nahi karte hain, jinka upyog `translate-docs` masking ke liye karta hai, ek inline code span jo backticks ke saath khola gaya hai lekin kabhi band nahi kiya gaya hai, ya `STRONG_OUTSIDE_LINK` jab `**` / `__` ek `[text](url)` link ko wrap karte hain (bold ko sirf link text ke andar rakhein).

Yeh **Failures** jaisa **nahi** hai, jo per-locale model output aur post-translation validation problems (`AST mismatch`, placeholder leaks, aur is tarah ke) ko record karta hai.

<a id="when-to-use-it"></a>
## Iska upyog kab karen

Is tab ka upyog tab karein jab aap tokens kharch karne se pehle **source markdown** ko theek karna chahte hain — khaaskar jab quality checks [Failures](/guide/translation-dashboard/failures) tab mein structure par fail hote rehte hain.

<a id="how-to-use-the-tab"></a>
## Tab ka upyog kaise karen

1. **Summary** strip padhein — total issue rows aur har issue code ke liye counts.
2. Filepath (cache key ke khilaaf partial match, jismein `doc-block:{index}:` prefixes shamil hain), **issue code**, ya **source hash** dwara filter karein.
3. **Filepath + line** (default) ya **newest scan time** dwara sort karein.
4. 🔗 link button terminal par file/line hints log karta hai jahan `ai-i18n-tools dashboard` chal raha hai.

Source file ko theek karein, phir translation ko phir se chalayein.

<a id="refreshing-rows"></a>
## Rows ko refresh karna

| Command / event | Effect |
| --- | --- |
| `ai-i18n-tools check-markdown` | Configured docs ko rescan karein; optional `-p` / `--path` scope, `--no-cache`, `--json` |

| `translate-docs` (default) | Har markdown file ke liye rows ko rescan karta hai aur replace karta hai jab `docs[].warnMarkdownSourceIssues` `false` nahi hota hai |

| Ek filepath ke liye sabhi translations delete karein | Us filepath ke liye markdown issue rows ko hata deta hai (failures jaisa hi cleanup) |

| `cleanup` | Poori `markdown_source_issues` table ko clear karta hai, phir rows ko repopulate karne ke liye `sync --force-update` chalata hai |


<a id="common-issue-codes"></a>
## Common issue codes

| Code | Meaning |
| --- | --- |
| Unpaired emphasis / strikethrough | Delimiter runs jo CommonMark rules ke tahat kabhi band nahi hote |

| Unclosed inline code | Backtick span khola gaya lekin band nahi kiya gaya |

| `STRONG_OUTSIDE_LINK` | Bold markers ek markdown link ko wrap karte hain — bold ko link text ke andar le jayein |


[Complex Markdown aur failed quality checks](/guide/documents/#complex-markdown-and-failed-quality-checks) bhi dekhein.
