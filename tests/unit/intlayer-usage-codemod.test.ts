import { describe, expect, it } from "vitest";
import type { IntlayerLeaf } from "../../src/extractors/intlayer-content-extractor.js";
import { uiStringHash } from "../../src/extractors/ui-string-locations.js";
import {
  codemodIntlayerUsages,
  formatTCall,
  relativeTImport,
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
  });

  it("builds a relative specifier", () => {
    expect(relativeTImport("src/components/Header.tsx", "src/i18n.ts")).toBe("../i18n");
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
});
