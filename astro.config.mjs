import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://your-domain.com', // Thay đổi domain của bạn
  integrations: [
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: 'vi',
        locales: {
          vi: 'vi',
          en: 'en', 
          es: 'es'
        }
      }
    }),
    react()
  ],
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en', 'es'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      cssCodeSplit: false
    }
  }
});