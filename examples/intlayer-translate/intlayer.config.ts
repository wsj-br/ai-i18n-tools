import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [
      Locales.ENGLISH,
      Locales.PORTUGUESE_BRAZIL,
      Locales.SPANISH,
      Locales.CHINESE_SIMPLIFIED,
    ],
    defaultLocale: Locales.ENGLISH,
  },
  // Router-free SPA: resolve the locale from storage, not the URL path.
  routing: {
    mode: "no-prefix",
  },
};

export default config;
