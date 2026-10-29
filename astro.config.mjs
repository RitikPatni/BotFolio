import { defineConfig } from 'astro/config';
import nightOwl from '@shikijs/themes/night-owl';

// Night Owl token colours that fall below WCAG AA (4.5:1) on its #011627
// background, each lifted just past it with the same hue.
const AA_TOKEN_COLORS = {
  '#637777': '#6d8484', // comments: 3.87 -> 4.61
  '#5f7e97': '#64849e', // punctuation: 4.29 -> 4.66
  '#7e57c2': '#906fcb', // 3.52 -> 4.65
};
const codeTheme = JSON.parse(
  Object.entries(AA_TOKEN_COLORS).reduce(
    (json, [from, to]) => json.replaceAll(new RegExp(from, 'gi'), to),
    JSON.stringify(nightOwl),
  ),
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
