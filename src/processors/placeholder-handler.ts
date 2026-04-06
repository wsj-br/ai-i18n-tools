import { protectAdmonitionSyntax, restoreAdmonitionSyntax } from "./admonition-placeholders.js";
import { protectDocAnchors, restoreDocAnchors } from "./anchor-placeholders.js";
import { protectMarkdownUrls, restoreMarkdownUrls } from "./url-placeholders.js";

/**
 * Chains placeholder protection in the same order as Transrewrt doc translate:
 * admonitions → doc anchors → markdown URLs. Restore is the inverse order.
 */
export class PlaceholderHandler {
  protectForTranslation(text: string): {
    text: string;
    openMap: string[];
    endMap: string[];
    htmlAnchors: string[];
    docusaurusHeadingIds: string[];
    urlMap: string[];
  } {
    const ad = protectAdmonitionSyntax(text);
    const doc = protectDocAnchors(ad.protected);
    const urls = protectMarkdownUrls(doc.protected);
    return {
      text: urls.protected,
      openMap: ad.openMap,
      endMap: ad.endMap,
      htmlAnchors: doc.htmlAnchors,
      docusaurusHeadingIds: doc.docusaurusHeadingIds,
      urlMap: urls.urlMap,
    };
  }

  restoreAfterTranslation(
    text: string,
    state: {
      openMap: string[];
      endMap: string[];
      htmlAnchors: string[];
      docusaurusHeadingIds: string[];
      urlMap: string[];
    }
  ): string {
    let s = restoreMarkdownUrls(text, state.urlMap);
    s = restoreDocAnchors(s, state.htmlAnchors, state.docusaurusHeadingIds);
    s = restoreAdmonitionSyntax(s, state.openMap, state.endMap);
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
