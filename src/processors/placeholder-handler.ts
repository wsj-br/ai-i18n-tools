import { protectAdmonitionSyntax, restoreAdmonitionSyntax } from "./admonition-placeholders.js";
import { protectDocAnchors, restoreDocAnchors } from "./anchor-placeholders.js";
import { protectFencedCodeBlocks, restoreFencedCodeBlocks } from "./code-fence-placeholders.js";
import {
  protectBoldWrappedInlineCode,
  restoreBoldWrappedInlineCode,
} from "./bold-code-placeholders.js";
import { protectInlineCodeSpans, restoreInlineCodeSpans } from "./inline-code-placeholders.js";
import {
  applyEmphasisCloserSpacing,
  protectMarkdownEmphasis,
  restoreMarkdownEmphasis,
} from "./emphasis-placeholders.js";
import {
  reattachHeadingIdSuffixes,
  stripHeadingIdSuffixes,
} from "./heading-id-suffix-placeholders.js";
import { protectHtmlTags, restoreHtmlTags } from "./html-tag-placeholders.js";
import { protectMdx, restoreMdx } from "./mdx-placeholders.js";
import type { ExpressionProtectionOptions } from "./expression-attribute-protection.js";
import { protectMarkdownUrls, restoreMarkdownUrls } from "./url-placeholders.js";

/**
 * Emphasis spellings that already exist in the source (for example a documented
 * `<code v-pre>{{SE}}</code>`). HTML masking leaves the token in the segment, and
 * {@link restoreMarkdownEmphasis} would turn it into `**` on CJK/RTL. Quarantine
 * them before emphasis masking and put them back immediately after that restore.
 */
const LITERAL_EMPHASIS_KINDS = ["SE", "SU", "IT", "IU", "ST"] as const;

function quarantineLiteralEmphasisTokens(text: string): string {
  let out = text;
  for (const kind of LITERAL_EMPHASIS_KINDS) {
    out = out.split(`{{${kind}}}`).join(`{{LIT_${kind}}}`);
  }
  return out;
}

function restoreLiteralEmphasisTokens(text: string): string {
  let out = text;
  for (const kind of LITERAL_EMPHASIS_KINDS) {
    out = out.split(`{{LIT_${kind}}}`).join(`{{${kind}}}`);
  }
  return out;
}

/**
 * Chains placeholder protection for document translation:
 * fenced code blocks → heading-id suffixes (peeled, not sent) → html tags/comments →
 * admonitions → doc anchors → MDX (comments/JSX/expressions) → markdown URLs →
 * **`inline`** (whole span) → remaining `` `code` `` → quarantine source-literal
 * emphasis tokens → emphasis (optional). Restore is the inverse order; fenced code
 * is restored last so a sample cannot absorb a heading-id suffix. Literal emphasis
 * tokens are mapped back right after emphasis restore, before HTML tags return.
 */
export class PlaceholderHandler {
  protectForTranslation(
    text: string,
    options?: { emphasis?: boolean; expressionProtection?: ExpressionProtectionOptions }
  ): {
    text: string;
    htmlTagMap: string[];
    openMap: string[];
    endMap: string[];
    titleCloseMap: string[];
    htmlAnchors: string[];
    docusaurusHeadingIds: string[];
    headingIdSuffixes: string[];
    mdxMap: string[];
    /** Optional: JSX attribute values extracted from MDX tags */
    jsxAttributeMap?: string[];
    /** Optional: appendix sent with the segment so JSX attribute strings are translated */
    jsxAttributeText?: string;
    urlMap: string[];
    boldCodeMap: string[];
    ilcMap: string[];
    codeFenceMap: string[];
    emphasisProtected: boolean;
  } {
    const emphasisOn = options?.emphasis !== false;
    const fences = protectFencedCodeBlocks(text);
    const headingIds = stripHeadingIdSuffixes(fences.protected);
    const htmlTags = protectHtmlTags(headingIds.text);
    const ad = protectAdmonitionSyntax(htmlTags.protected);
    const doc = protectDocAnchors(ad.protected);
    const mdx = protectMdx(doc.protected, options?.expressionProtection);
    const urls = protectMarkdownUrls(mdx.protected);
    const boldCode = protectBoldWrappedInlineCode(urls.protected);
    const ilc = protectInlineCodeSpans(boldCode.protected);
    const emphasisInput = emphasisOn
      ? quarantineLiteralEmphasisTokens(ilc.protected)
      : ilc.protected;
    const body = emphasisOn ? protectMarkdownEmphasis(emphasisInput).protected : emphasisInput;
    return {
      text: body,
      htmlTagMap: htmlTags.htmlTagMap,
      openMap: ad.openMap,
      endMap: ad.endMap,
      titleCloseMap: ad.titleCloseMap,
      htmlAnchors: doc.htmlAnchors,
      docusaurusHeadingIds: doc.docusaurusHeadingIds,
      headingIdSuffixes: headingIds.headingIdSuffixes,
      mdxMap: mdx.mdxMap,
      jsxAttributeMap: mdx.jsxAttributeMap ?? [],
      jsxAttributeText: mdx.jsxAttributeText,
      urlMap: urls.urlMap,
      boldCodeMap: boldCode.boldCodeMap,
      ilcMap: ilc.ilcMap,
      codeFenceMap: fences.codeFenceMap,
      emphasisProtected: emphasisOn,
    };
  }

  restoreAfterTranslation(
    text: string,
    state: {
      htmlTagMap: string[];
      openMap: string[];
      endMap: string[];
      /** Optional for backward compatibility with callers that protected before bracketed-title support shipped. */
      titleCloseMap?: string[];
      htmlAnchors: string[];
      docusaurusHeadingIds: string[];
      /**
       * Optional for backward compatibility with callers that protected before heading-id
       * suffixes were peeled out of the prompt.
       */
      headingIdSuffixes?: string[];
      /** Optional for backward compatibility with callers that protected before MDX support shipped. */
      mdxMap?: string[];
      /** Optional: JSX attribute values extracted from MDX tags */
      jsxAttributeMap?: string[];
      urlMap: string[];
      boldCodeMap: string[];
      ilcMap: string[];
      /** Optional for callers that protected before fenced-code masking shipped. */
      codeFenceMap?: string[];
      /** When false or omitted, `restoreMarkdownEmphasis` is skipped (must match {@link protectForTranslation}). */
      emphasisProtected?: boolean;
    }
  ): string {
    let s =
      state.emphasisProtected === false
        ? applyEmphasisCloserSpacing(text)
        : restoreLiteralEmphasisTokens(restoreMarkdownEmphasis(text));
    s = restoreInlineCodeSpans(s, state.ilcMap);
    s = restoreBoldWrappedInlineCode(s, state.boldCodeMap);
    s = restoreMarkdownUrls(s, state.urlMap);
    s = restoreMdx(s, state.mdxMap ?? [], state.jsxAttributeMap ?? []);
    s = restoreDocAnchors(s, state.htmlAnchors, state.docusaurusHeadingIds);
    s = restoreAdmonitionSyntax(s, state.openMap, state.endMap, state.titleCloseMap ?? []);
    s = restoreHtmlTags(s, state.htmlTagMap);
    s = reattachHeadingIdSuffixes(s, state.headingIdSuffixes ?? []);
    s = restoreFencedCodeBlocks(s, state.codeFenceMap ?? []);
    return s;
  }

  protectUrls(text: string): { text: string; urlMap: string[] } {
    const r = protectMarkdownUrls(text);
    return { text: r.protected, urlMap: r.urlMap };
  }

  restoreUrls(text: string, urlMap: string[]): string {
    return restoreMarkdownUrls(text, urlMap);
  }

  protectAdmonitions(text: string): {
    text: string;
    openMap: string[];
    endMap: string[];
    titleCloseMap: string[];
  } {
    const r = protectAdmonitionSyntax(text);
    return {
      text: r.protected,
      openMap: r.openMap,
      endMap: r.endMap,
      titleCloseMap: r.titleCloseMap,
    };
  }

  restoreAdmonitions(
    text: string,
    openMap: string[],
    endMap: string[],
    titleCloseMap: string[] = []
  ): string {
    return restoreAdmonitionSyntax(text, openMap, endMap, titleCloseMap);
  }
}
