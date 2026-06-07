Optional upstream doc tweaks (not required):

In GETTING_STARTED.md, the language-switcher example uses i18n.changeLanguage(code) without await, while ai-i18n-tools-context.md uses await i18n.changeLanguage(code). Aligning those would be a small doc consistency fix.
A troubleshooting note that a stale dev-server can make i18n fixes look broken would help future debugging — but that belongs in Transrewrt dev docs, not in the package.
Unrelated to this revert: ai-i18n-tools now recommends setupKeyAsDefaultT over wrapI18nWithKeyTrim for apps with plural support in strings.json. That is a separate migration if you want plural-aware t() — it has nothing to do with the language-switching revert.

Bottom line: keep using ai-i18n-tools as-is (^1.5.1). No package or config changes needed on its side.
