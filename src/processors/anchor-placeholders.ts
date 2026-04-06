const HTML_ANCHOR_PREFIX = "{{HTML_ANCHOR_";
const HEADING_ID_PREFIX = "{{DOC_HEADING_ID_";
const PLACEHOLDER_SUFFIX = "}}";

const HTML_ID_ANCHOR_RE = /<a\s+id\s*=\s*(["'])([^"']*)\1[^>]*>\s*<\/a>/gi;

const DOCUS_HEADING_ID_RE = /\{#[^}]+\}/g;

export interface DocAnchorProtectedResult {
  protected: string;
  htmlAnchors: string[];
  docusaurusHeadingIds: string[];
}

export function protectDocAnchors(text: string): DocAnchorProtectedResult {
  const htmlAnchors: string[] = [];
  let s = text.replace(HTML_ID_ANCHOR_RE, (full) => {
    const ph = `${HTML_ANCHOR_PREFIX}${htmlAnchors.length}${PLACEHOLDER_SUFFIX}`;
    htmlAnchors.push(full);
    return ph;
  });

  const docusaurusHeadingIds: string[] = [];
  s = s.replace(DOCUS_HEADING_ID_RE, (full) => {
    const ph = `${HEADING_ID_PREFIX}${docusaurusHeadingIds.length}${PLACEHOLDER_SUFFIX}`;
    docusaurusHeadingIds.push(full);
    return ph;
  });

  return {
    protected: s,
    htmlAnchors,
    docusaurusHeadingIds,
  };
}

export function restoreDocAnchors(
  text: string,
  htmlAnchors: string[],
  docusaurusHeadingIds: string[]
): string {
  let restored = text;

  for (let i = 0; i < docusaurusHeadingIds.length; i++) {
    const flexible = new RegExp(`\\{\\{\\s*DOC_HEADING_ID_${i}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, docusaurusHeadingIds[i]);
  }

  for (let i = 0; i < htmlAnchors.length; i++) {
    const flexible = new RegExp(`\\{\\{\\s*HTML_ANCHOR_${i}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, htmlAnchors[i]);
  }

  return restored;
}
