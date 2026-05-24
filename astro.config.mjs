import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ritikpatni.me',
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
