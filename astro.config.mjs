import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://iqtest.yourdomain.com', // Thay đổi domain thực của bạn
  output: 'static', // Change to static for now to avoid adapter issues
  devToolbar: {
    enabled: false // Disable dev toolbar to prevent it from appearing in screenshots
  },
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
      },
      filter: (page) => !page.includes('/admin/'),
      serialize: (item) => {
        if (item.url.includes('/admin/')) return undefined;
        
        if (item.url === 'https://iqtest.yourdomain.com/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (item.url.includes('/test')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        } else if (item.url.includes('/blog')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        
        return item;
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
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['framer-motion', '@toast-ui/react-editor']
          }
        }
      }
    }
  }
});