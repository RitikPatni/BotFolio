import { defineConfig } from 'astro/config';
import nightOwl from '@shikijs/themes/night-owl';

export default defineConfig({
  site: 'https://ritikpatni.me',
  markdown: {
    shikiConfig: {
      theme: nightOwl,
      wrap: true,
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
