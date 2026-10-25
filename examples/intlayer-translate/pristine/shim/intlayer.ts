export type Dictionary = {
  key: string;
  content: unknown;
};

/** Intlayer-style leaf factory: stores every locale string for the runtime shim. */
export function t(locales: Record<string, string>): { locales: Record<string, string> } {
  return { locales };
}
