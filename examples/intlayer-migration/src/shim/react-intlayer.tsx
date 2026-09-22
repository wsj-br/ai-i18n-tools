import { createContext, useContext, type ReactNode } from "react";

type Leaf = { locales: Record<string, string> };

const LocaleContext = createContext("en");

const modules = import.meta.glob("../content/**/*.content.ts", { eager: true });
const byKey = new Map<string, unknown>();
for (const mod of Object.values(modules)) {
  const d = (mod as { default?: { key?: string; content?: unknown } }).default;
  if (d?.key) {
    byKey.set(d.key, d.content);
  }
}

function isLeaf(node: unknown): node is Leaf {
  return Boolean(node && typeof node === "object" && "locales" in node);
}

function resolveNode(node: unknown, locale: string): unknown {
  if (isLeaf(node)) {
    return { value: node.locales[locale] ?? node.locales.en ?? "" };
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = resolveNode(v, locale);
    }
    return out;
  }
  return node;
}

export function IntlayerProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useIntlayer(key: string): any {
  const locale = useContext(LocaleContext);
  const content = byKey.get(key);
  return resolveNode(content, locale);
}

export function getIntlayer(key: string, locale = "en"): any {
  const content = byKey.get(key);
  return resolveNode(content, locale);
}
