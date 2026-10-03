import { describe, expect, it } from "vitest";
import type { IntlayerLeaf } from "../../src/extractors/intlayer-content-extractor.js";
import { uiStringHash } from "../../src/extractors/ui-string-locations.js";
import {
  codemodIntlayerUsages,
  findIntlayerLeftovers,
  formatTCall,
  refreshReviewAfterLeafConversion,
  relativeTImport,
  type ManualReviewSite,
} from "../../src/extractors/intlayer-usage-codemod.js";

function leaf(dictKey: string, dotPath: string, sourceText: string): IntlayerLeaf {
  return {
    dictKey,
    dotPath,
    file: `${dictKey}.content.ts`,
    line: 1,
    locales: { en: sourceText },
    sourceText,
    hash: uiStringHash(sourceText.trim()),
  };
}

const leaves: IntlayerLeaf[] = [
  leaf("app-header", "title", "Return to Dashboard"),
  leaf("app-header", "helpFor", "Help for {pageName}"),
  leaf("dynamic-key", "ok", "OK"),
  leaf("dynamic-key", "fail", "Failed"),
  leaf("spread-props", "ok", "Healthy"),
  leaf("spread-props", "fail", "Failed"),
  leaf("multi-placeholder", "greeting", "Hello {name}, you have {count} items"),
];

describe("formatTCall / relativeTImport", () => {
  it("formats a simple t() call", () => {
    expect(formatTCall("Save")).toBe("t('Save')");
  });

  it("formats a replace interpolation call", () => {
    expect(formatTCall("Help for {{pageName}}", { token: "pageName", expr: "page.name" })).toBe(
      "t('Help for {{pageName}}', { pageName: page.name })"
    );
    expect(
      formatTCall("Hi", [
        { token: "name", expr: "name" },
        { token: "count", expr: "count" },
      ])
    ).toBe("t('Hi', { name: name, count: count })");
  });

  it("builds a relative specifier", () => {
    expect(relativeTImport("src/components/Header.tsx", "src/i18n.ts")).toBe("../i18n");
    expect(relativeTImport("src\\components\\Header.tsx", "src\\i18n.ts")).toBe("../i18n");
  });
});

describe("codemodIntlayerUsages", () => {
  it("rewrites a simple .value access and removes the unused binding", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function Header() {
  const content = useIntlayer('app-header');
  return <h1>{content.title.value}</h1>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites).toHaveLength(1);
    expect(result.rewrites[0]?.replacement).toBe("t('Return to Dashboard')");
    expect(result.output).toContain("t('Return to Dashboard')");
    expect(result.output).toContain("import { t } from '../i18n'");
    expect(result.output).not.toContain("useIntlayer");
    expect(result.removedBindings).toContain("content");
  });

  it("rewrites a single .replace() interpolation", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function Header({ pageName }: { pageName: string }) {
  const content = useIntlayer('app-header');
  return <p>{content.helpFor.value.replace('{pageName}', pageName)}</p>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites).toHaveLength(1);
    expect(result.rewrites[0]?.kind).toBe("replace");
    expect(result.rewrites[0]?.replacement).toBe(
      "t('Help for {{pageName}}', { pageName: pageName })"
    );
    expect(result.output).not.toContain("useIntlayer");
  });

  it("flags dynamic member access as manual review", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function DynamicLabel({ statusKey }: { statusKey: 'ok' | 'fail' }) {
  const content = useIntlayer('dynamic-key');
  return <span>{content[statusKey].value}</span>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/DynamicLabel.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites).toHaveLength(0);
    expect(result.reviews[0]?.reason).toBe("dynamic-member");
    expect(result.output).toContain("useIntlayer");
  });

  it("flags a whole-dictionary JSX spread as manual review", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function SpreadWidget() {
  const content = useIntlayer('spread-props');
  return <StatusBadge {...content} />;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/SpreadWidget.tsx",
      source,
      leaves,
    });
    expect(result.reviews[0]?.reason).toBe("spread");
    expect(result.rewrites).toHaveLength(0);
  });

  it("flags chained .replace().replace() as manual review", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function Banner({ name, count }: { name: string; count: number }) {
  const content = useIntlayer('multi-placeholder');
  return <p>{content.greeting.value.replace('{name}', name).replace('{count}', String(count))}</p>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/Banner.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.reviews[0]?.reason).toBe("chained-transform");
    expect(result.rewrites).toHaveLength(0);
    expect(result.reviews[0]?.snippet).toContain(".replace('{count}', String(count))");
    expect(result.reviews[0]?.writeAs).toBe(
      "t('Hello {{name}}, you have {{count}} items', { name: name, count: String(count) })"
    );
    expect(result.reviews[0]?.tImportSpecifier).toBe("../i18n");
  });

  it("keeps every replace in a multiline chain", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function Banner({ name, count }: { name: string; count: number }) {
  const content = useIntlayer('multi-placeholder');
  const text = content.greeting.value
    .replace("{name}", name)
    .replace("{count}", String(count));
  return <p>{text}</p>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/Banner.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    const review = result.reviews[0];
    expect(review?.snippet).toBe(`content.greeting.value
    .replace("{name}", name)
    .replace("{count}", String(count))`);
    expect(review?.writeAs).toBe(
      "t('Hello {{name}}, you have {{count}} items', { name: name, count: String(count) })"
    );
  });

  it("lists each sibling leaf for a computed key", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

export function DynamicLabel({ statusKey }: { statusKey: 'ok' | 'fail' }) {
  const content = useIntlayer('dynamic-key');
  return <span>{content[statusKey].value}</span>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/DynamicLabel.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    const review = result.reviews[0];
    expect(review?.requiresDirectLiteral).toBe(true);
    expect(review?.snippet).toBe("content[statusKey].value");
    expect(review?.suggestions.map((suggestion) => suggestion.replacement)).toEqual([
      "t('OK')",
      "t('Failed')",
    ]);
  });

  it("names the JSX element and the props the child reads", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

function StatusBadge(props: { ok: { value: string }; fail: { value: string } }) {
  return (
    <p>
      <span>{props.ok.value}</span>
      <span>{props.fail.value}</span>
    </p>
  );
}

export function SpreadWidget() {
  const content = useIntlayer('spread-props');
  return <StatusBadge {...content} />;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/components/SpreadWidget.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    const review = result.reviews[0];
    expect(review?.jsxElement).toBe("StatusBadge");
    expect(review?.spreadProps).toEqual([
      { prop: "ok", access: "value" },
      { prop: "fail", access: "value" },
    ]);
    expect(review?.writeAs).toBe("<StatusBadge ok={t('Healthy')} fail={t('Failed')} />");
    expect(review?.snippet).toContain("<StatusBadge {...content} />");
  });

  it("flags destructuring of the hook binding", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Row() {
  const content = useIntlayer('app-header');
  const { title } = content;
  return <span>{title.value}</span>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/Row.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.reviews[0]?.reason).toBe("destructuring");
  });

  it("flags passing the binding as a bare value", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
function log(x: unknown) { return x; }
export function Row() {
  const content = useIntlayer('app-header');
  return log(content);
}
`;
    const result = codemodIntlayerUsages({
      file: "src/Row.tsx",
      source,
      leaves,
    });
    expect(result.reviews[0]?.reason).toBe("passed-as-value");
  });

  it("flags member access without .value", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Row() {
  const content = useIntlayer('app-header');
  return <span>{content.title}</span>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/Row.tsx",
      source,
      leaves,
    });
    expect(result.reviews[0]?.reason).toBe("no-value");
  });

  it("flags an unresolved leaf path", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Row() {
  const content = useIntlayer('app-header');
  return <span>{content.missing.value}</span>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/Row.tsx",
      source,
      leaves,
    });
    expect(result.reviews[0]?.reason).toBe("unresolved-path");
  });
});

describe("refreshReviewAfterLeafConversion", () => {
  it("updates writeAs for a single non-JSX suggestion", () => {
    const review: ManualReviewSite = {
      file: "x.tsx",
      line: 1,
      dictKey: "k",
      reason: "chained-transform",
      snippet: "x",
      writeAs: "t('Old')",
      suggestions: [
        {
          dotPath: "ok",
          sourceText: "Old",
          replacement: "t('Old')",
          vars: [{ token: "n", expr: "n" }],
        },
      ],
    };
    refreshReviewAfterLeafConversion(review, "ok", "Old", "New {{n}}");
    expect(review.writeAs).toBe("t('New {{n}}', { n: n })");
  });

  it("updates suggestions and writeAs for spread JSX", () => {
    const review: ManualReviewSite = {
      file: "x.tsx",
      line: 1,
      dictKey: "k",
      reason: "spread",
      snippet: "<Badge {...content} />",
      jsxElement: "Badge",
      writeAs: "<Badge ok={t('Old')} />",
      suggestions: [
        {
          dotPath: "ok",
          label: "ok",
          sourceText: "Old",
          replacement: "t('Old')",
        },
      ],
    };
    refreshReviewAfterLeafConversion(review, "ok", "Old", "New");
    expect(review.suggestions[0]?.replacement).toBe("t('New')");
    expect(review.writeAs).toBe("<Badge ok={t('New')} />");
  });
});

describe("findIntlayerLeftovers", () => {
  it("lists hook imports, provider imports, and JSX wrappers", () => {
    const source = `
import { useIntlayer, IntlayerProvider } from 'react-intlayer';
export function App() {
  return <IntlayerProvider><div /></IntlayerProvider>;
}
`;
    const leftovers = findIntlayerLeftovers("App.tsx", source);
    expect(leftovers.map((l) => l.kind).sort()).toEqual(["hook-import", "provider", "provider"]);
  });

  it("returns empty for unparseable source", () => {
    expect(findIntlayerLeftovers("bad.ts", "export {{{")).toEqual([]);
  });

  it("lists getIntlayer imports", () => {
    const leftovers = findIntlayerLeftovers(
      "x.ts",
      `import { getIntlayer } from 'react-intlayer';\nexport const x = 1;`
    );
    expect(leftovers[0]?.name).toBe("getIntlayer");
  });

  it("accepts string-literal import names", () => {
    const leftovers = findIntlayerLeftovers(
      "x.ts",
      `import { "useIntlayer" as useIntlayer } from 'react-intlayer';`
    );
    expect(leftovers[0]?.name).toBe("useIntlayer");
  });
});

describe("codemod edge cases", () => {
  it("rewrites getIntlayer bindings", () => {
    const source = `
import { getIntlayer } from 'react-intlayer';
export function Header() {
  const content = getIntlayer('app-header');
  return <h1>{content.title.value}</h1>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites[0]?.replacement).toBe("t('Return to Dashboard')");
  });

  it("returns unchanged output when the file does not parse", () => {
    const broken = "export const x = ";
    const result = codemodIntlayerUsages({
      file: "bad.ts",
      source: broken,
      leaves,
    });
    expect(result.output).toBe(broken);
    expect(result.rewrites).toHaveLength(0);
  });

  it("flags object spread of the dictionary binding", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Box() {
  const content = useIntlayer('spread-props');
  return <div {...content} />;
}
`;
    const result = codemodIntlayerUsages({ file: "Box.tsx", source, leaves });
    expect(result.reviews[0]?.reason).toBe("spread");
  });

  it("skips adding t import when t is already imported", () => {
    const source = `
import { t } from '../i18n';
import { useIntlayer } from 'react-intlayer';
export function Header() {
  const content = useIntlayer('app-header');
  return <h1>{content.title.value}</h1>;
}
`;
    const result = codemodIntlayerUsages({
      file: "src/Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.addedTImport).toBe(false);
    expect(result.output).not.toMatch(/import \{ t \}.*import \{ t \}/);
  });

  it("rewrites replace when the catalog already uses double braces", () => {
    const leafWithBraces: IntlayerLeaf[] = [
      {
        ...leaf("app-header", "helpFor", "Help for {{pageName}}"),
        sourceText: "Help for {{pageName}}",
      },
    ];
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Header({ pageName }: { pageName: string }) {
  const content = useIntlayer('app-header');
  return <p>{content.helpFor.value.replace('{pageName}', pageName)}</p>;
}
`;
    const result = codemodIntlayerUsages({
      file: "Header.tsx",
      source,
      leaves: leafWithBraces,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites[0]?.replacement).toContain("Help for {{pageName}}");
  });

  it("supports template-literal dictionary keys and namespace hook calls", () => {
    const source = `
import * as R from 'react-intlayer';
export function Header() {
  const content = R.useIntlayer(\`app-header\`);
  return <h1>{content.title.value}</h1>;
}
`;
    const result = codemodIntlayerUsages({
      file: "Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites[0]?.replacement).toBe("t('Return to Dashboard')");
  });

  it("flags spread into a JSX element with children", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Panel() {
  const content = useIntlayer('spread-props');
  return <section {...content}><p>child</p></section>;
}
`;
    const result = codemodIntlayerUsages({ file: "Panel.tsx", source, leaves });
    expect(result.reviews[0]?.reason).toBe("spread");
    expect(result.reviews[0]?.snippet).toContain("<section");
  });

  it("removes only the hook binding when another declarator shares the statement", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Header() {
  const unused = 1, content = useIntlayer('app-header');
  return <h1>{content.title.value}</h1>;
}
`;
    const result = codemodIntlayerUsages({
      file: "Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.removedBindings).toContain("content");
    expect(result.rewrites[0]?.replacement).toBe("t('Return to Dashboard')");
  });

  it("flags array destructuring of the dictionary binding", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Row() {
  const content = useIntlayer('app-header');
  const [title] = content;
  return <span>{title}</span>;
}
`;
    const result = codemodIntlayerUsages({ file: "Row.tsx", source, leaves });
    expect(result.reviews[0]?.reason).toBe("destructuring");
  });

  it("infers spread props from a typed props parameter", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

type Props = { ok: { value: string }; fail: { value: string } };
function StatusBadge(props: Props) {
  return <p>{props.ok.value}</p>;
}

export function SpreadWidget() {
  const content = useIntlayer('spread-props');
  return <StatusBadge {...content} />;
}
`;
    const result = codemodIntlayerUsages({
      file: "SpreadWidget.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.reviews[0]?.spreadProps).toEqual([{ prop: "ok", access: "value" }]);
  });

  it("flags object-literal spread of the dictionary binding", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Box() {
  const content = useIntlayer('spread-props');
  return <div data-x={JSON.stringify({ ...content })} />;
}
`;
    const result = codemodIntlayerUsages({ file: "Box.tsx", source, leaves });
    expect(result.reviews.some((r) => r.reason === "spread")).toBe(true);
  });

  it("still rewrites when t is imported as default alongside a named import path", () => {
    const source = `
import t from '../i18n';
import { useIntlayer } from 'react-intlayer';
export function Header() {
  const content = useIntlayer('app-header');
  return <h1>{content.title.value}</h1>;
}
`;
    const result = codemodIntlayerUsages({
      file: "Header.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.rewrites[0]?.replacement).toBe("t('Return to Dashboard')");
    expect(result.output).toContain("import t from '../i18n'");
  });

  it("reviews nested dictionary access without a .value segment", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';
export function Row() {
  const content = useIntlayer('app-header');
  return <span>{content.navigation.helpFor}</span>;
}
`;
    const result = codemodIntlayerUsages({ file: "Row.tsx", source, leaves });
    expect(result.reviews[0]?.reason).toBe("no-value");
    expect(result.reviews[0]?.dotPath).toBe("navigation.helpFor");
  });

  it("reads spread props from destructured component parameters", () => {
    const source = `
import { useIntlayer } from 'react-intlayer';

function StatusBadge({ ok, fail }: { ok: { value: string }; fail: { value: string } }) {
  return <p>{ok.value}{fail.value}</p>;
}

export function SpreadWidget() {
  const content = useIntlayer('spread-props');
  return <StatusBadge {...content} />;
}
`;
    const result = codemodIntlayerUsages({
      file: "SpreadWidget.tsx",
      source,
      leaves,
      tImportSpecifier: "../i18n",
    });
    expect(result.reviews[0]?.spreadProps?.map((p) => p.prop).sort()).toEqual(["fail", "ok"]);
  });

  it("returns unchanged output when no intlayer bindings exist", () => {
    const source = `export function Plain() { return <p>hi</p>; }`;
    const result = codemodIntlayerUsages({ file: "Plain.tsx", source, leaves });
    expect(result.changed).toBe(false);
  });
});
