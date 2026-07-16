#!/usr/bin/env node
/**
 * One-off generator: writes `src/core/han-variant-data.ts` from the MIT-licensed
 * Simplified/Traditional character lists in `traditional-or-simplified`
 * (https://github.com/nickdrewe/traditional-or-simplified). Run manually if the
 * vendored data ever needs refreshing:
 *
 *   node dev/scripts/gen-han-variant-data.mjs
 *
 * The generated file is committed; this script is not part of the build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://raw.githubusercontent.com/nickdrewe/traditional-or-simplified/master/TradOrSimp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "..", "..", "src", "core", "han-variant-data.ts");

function extract(label, text) {
  const re = new RegExp(`var ${label} = new String\\('([\\s\\S]*?)'\\)`);
  const m = text.match(re);
  if (!m) {
    throw new Error(`Could not extract ${label} from source`);
  }
  const value = m[1];
  if (value.includes("'") || value.includes("\\")) {
    throw new Error(`Unexpected quote/backslash in ${label} data`);
  }
  return value;
}

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
}
const src = await res.text();
const simplified = extract("S", src);
const traditional = extract("T", src);

const header = `/**
 * Simplified- and Traditional-exclusive Chinese character data, used to tell a
 * \`zh-Hans\` output apart from a \`zh-Hant\` one (Unicode has no Simplified/Traditional
 * script property, so both map to a single \`Han\` script). Characters that exist in
 * both writing systems are intentionally absent from these sets.
 *
 * The two character lists below are vendored verbatim from the MIT-licensed
 * \`traditional-or-simplified\` package by Nick Drewe
 * (https://github.com/nickdrewe/traditional-or-simplified). Regenerate with
 * \`node dev/scripts/gen-han-variant-data.mjs\`.
 *
 * MIT License — Copyright (c) Nick Drewe
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
`;

const body = `
/** Characters that only exist in Simplified Chinese (vendored verbatim). */
const SIMPLIFIED_ONLY_CHARS =
  "${simplified}";

/** Characters that only exist in Traditional Chinese (vendored verbatim). */
const TRADITIONAL_ONLY_CHARS =
  "${traditional}";

/**
 * Characters the upstream data lists as variant-exclusive but that are in fact used unchanged in
 * BOTH writing systems — almost all are the appendix the source tacks onto the Simplified list
 * (\`志制咨只里系范松没尝闹面准钟别闲干尽脏拼\`), where a Simplified form merged a different
 * Traditional character (e.g. \`麵\`→\`面\`, \`製\`→\`制\`) onto a glyph that already exists in
 * Traditional. Counting these as Simplified-only mislabels ordinary Traditional words such as
 * \`界面\` (interface), \`控制\` (control) and \`系統\` (system), so they are removed from BOTH sets
 * and treated as shared (non-discriminating).
 */
const VARIANT_AMBIGUOUS = new Set([..."志制咨只里系范松没尝闹面准钟别闲干尽脏拼后表"]);

/** Set of Simplified-exclusive characters (single code points), minus shared/ambiguous glyphs. */
export const SIMPLIFIED_ONLY: ReadonlySet<string> = new Set(
  [...SIMPLIFIED_ONLY_CHARS].filter((ch) => !VARIANT_AMBIGUOUS.has(ch))
);

/** Set of Traditional-exclusive characters (single code points), minus shared/ambiguous glyphs. */
export const TRADITIONAL_ONLY: ReadonlySet<string> = new Set(
  [...TRADITIONAL_ONLY_CHARS].filter((ch) => !VARIANT_AMBIGUOUS.has(ch))
);
`;

fs.writeFileSync(outFile, header + body, "utf8");
console.log(
  `Wrote ${path.relative(path.join(__dirname, ".."), outFile)} ` +
    `(simplified=${simplified.length}, traditional=${traditional.length})`
);
