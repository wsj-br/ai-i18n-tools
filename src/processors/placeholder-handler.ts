import { protectAdmonitionSyntax, restoreAdmonitionSyntax } from "./admonition-placeholders.js";
import { protectDocAnchors, restoreDocAnchors } from "./anchor-placeholders.js";
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
import { protectHtmlTags, restoreHtmlTags } from "./html-tag-placeholders.js";
import { protectMarkdownUrls, restoreMarkdownUrls } from "./url-placeholders.js";

/**
 * Chains placeholder protection for document translation:
 * html tags/comments → admonitions → doc anchors → markdown URLs → **`inline`** (whole span)
 * → remaining `` `code` `` → emphasis (optional).
 * Restore is the inverse order.
 */
export class PlaceholderHandler {
  protectForTranslation(
    text: string,
    options?: { emphasis?: boolean }
  ): {
    text: string;
    htmlTagMap: string[];
    openMap: string[];
    endMap: string[];
    htmlAnchors: string[];
    docusaurusHeadingIds: string[];
    urlMap: string[];
    boldCodeMap: string[];
    ilcMap: string[];
    emphasisProtected: boolean;
  } {
    const emphasisOn = options?.emphasis !== false;
    const htmlTags = protectHtmlTags(text);
    const ad = protectAdmonitionSyntax(htmlTags.protected);
    const doc = protectDocAnchors(ad.protected);
    const urls = protectMarkdownUrls(doc.protected);
    const boldCode = protectBoldWrappedInlineCode(urls.protected);
    const ilc = protectInlineCodeSpans(boldCode.protected);
    const body = emphasisOn ? protectMarkdownEmphasis(ilc.protected).protected : ilc.protected;
    return {
      text: body,
      htmlTagMap: htmlTags.htmlTagMap,
      openMap: ad.openMap,
      endMap: ad.endMap,
      htmlAnchors: doc.htmlAnchors,
      docusaurusHeadingIds: doc.docusaurusHeadingIds,
      urlMap: urls.urlMap,
      boldCodeMap: boldCode.boldCodeMap,
      ilcMap: ilc.ilcMap,
      emphasisProtected: emphasisOn,
    };
  }

  restoreAfterTranslation(
    text: string,
    state: {
      htmlTagMap: string[];
      openMap: string[];
      endMap: string[];
      htmlAnchors: string[];
      docusaurusHeadingIds: string[];
      urlMap: string[];
      boldCodeMap: string[];
      ilcMap: string[];
      /** When false or omitted, `restoreMarkdownEmphasis` is skipped (must match {@link protectForTranslation}). */
      emphasisProtected?: boolean;
    }
  ): string {
    let s =
      state.emphasisProtected === false
        ? applyEmphasisCloserSpacing(text)
        : restoreMarkdownEmphasis(text);
    s = restoreInlineCodeSpans(s, state.ilcMap);
    s = restoreBoldWrappedInlineCode(s, state.boldCodeMap);
    s = restoreMarkdownUrls(s, state.urlMap);
    s = restoreDocAnchors(s, state.htmlAnchors, state.docusaurusHeadingIds);
    s = restoreAdmonitionSyntax(s, state.openMap, state.endMap);
    s = restoreHtmlTags(s, state.htmlTagMap);
    return s;
  }

  protectUrls(text: string): { text: string; urlMap: string[] } {
    const r = protectMarkdownUrls(text);
    return { text: r.protected, urlMap: r.urlMap };
  }

  restoreUrls(text: string, urlMap: string[]): string {
    return restoreMarkdownUrls(text, urlMap);
  }

  protectAdmonitions(text: string): { text: string; openMap: string[]; endMap: string[] } {
    const r = protectAdmonitionSyntax(text);
    return { text: r.protected, openMap: r.openMap, endMap: r.endMap };
  }

  restoreAdmonitions(text: string, openMap: string[], endMap: string[]): string {
    return restoreAdmonitionSyntax(text, openMap, endMap);
  }
}
