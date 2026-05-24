import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  i18n: {
    // Keep in sync with ai-i18n-tools.config.json targetLocales (+ sourceLocale); Astro uses lowercase.
    locales: ['en', 'de', 'fr', 'es', 'ar', 'ja', 'ko', 'zh-cn', 'zh-tw', 'pt-br'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});