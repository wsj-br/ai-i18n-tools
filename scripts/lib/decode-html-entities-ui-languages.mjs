/**
 * Decode common Wikimedia/HTML character references for UI language table scraping.
 * `&amp;` must be resolved before numeric/hex references so e.g. `&amp;#160;` becomes a
 * non-breaking space, not a literal `&#160;` substring.
 */

const MAX_PASSES = 32;

export function decodeHtmlEntities(s) {
  let out = s;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const beforePass = out;

    let peeled = out;
    for (let i = 0; i < MAX_PASSES; i++) {
      const next = peeled.replace(/&amp;/g, "&");
      if (next === peeled) break;
      peeled = next;
    }

    out = peeled
      .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
        const cp = parseInt(hex, 16);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const cp = parseInt(dec, 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
      })
      .replace(/&nbsp;/gi, "\u00A0")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    if (out === beforePass) break;
  }
  return out;
}
