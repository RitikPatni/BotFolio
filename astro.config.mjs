import { defineConfig } from 'astro/config';
import nightOwl from '@shikijs/themes/night-owl';

export default defineConfig({
  site: 'https://ritikpatni.me',
  // Canonical URLs are slashless. Emitting /about.html (not /about/index.html)
  // lets Cloudflare Pages serve /about directly instead of redirecting it to /about/.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  markdown: {
    shikiConfig: {
      theme: nightOwl,
      wrap: true,
    },
  },
  vite: {
    resolve: {
      extensions: ['.tsx', '.ts', '.astro', '.mjs', '.js', '.json'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
});
