// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://github.com/wsj-br/ai-i18n-tools',
  redirects: {
    '/': '/quick-start',
  },
  integrations: [
    starlight({
      title: 'ai-i18n-tools',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en-GB',
        },
        ar: {
          label: 'العربية',
          dir: 'rtl',
          lang: 'ar',
        },
        es: {
          label: 'Español',
          lang: 'es-ES',
        },
        fr: {
          label: 'Français',
          lang: 'fr-FR',
        },
        de: {
          label: 'Deutsch',
          lang: 'de-DE',
        },
        'pt-br': {
          label: 'Português (Brasil)',
          lang: 'pt-BR',
        },
      },
      sidebar: [
        { slug: 'feature-showcase' },
        { slug: 'quick-start' },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/wsj-br/ai-i18n-tools',
        },
      ],
    }),
  ],
  server: {
    port: 3050,
  },
});
