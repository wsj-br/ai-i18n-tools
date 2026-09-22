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
      // src/pages/404.astro is the 404 page. Leaving Starlight's route on
      // would also publish docs/404 through `[...slug]` and warn about the clash.
      disable404Route: true,
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
  vite: {
    build: {
      rolldownOptions: {
        // Astro still emits `"use astro:head-inject"` in MDX `?astroPropagatedAssets`
        // modules. Rolldown warns because it does not know that directive. Astro
        // identifies those modules by the query id, so the warning is noise.
        onLog(level, log, handler) {
          if (
            log.code === 'MODULE_LEVEL_DIRECTIVE' &&
            log.message.includes('astro:head-inject')
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
  },
});
