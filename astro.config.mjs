import { defineConfig } from 'astro/config';
import nightOwl from '@shikijs/themes/night-owl';

// Night Owl's comment grey (#637777) is 3.87:1 on its #011627 background.
// Same hue, lifted just past WCAG AA (4.61:1).
const codeTheme = JSON.parse(
  JSON.stringify(nightOwl).replaceAll('#637777', '#6d8484'),
);

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
      theme: codeTheme,
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
