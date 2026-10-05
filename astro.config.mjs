import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://www.infenix.dev',
  output: 'static',
  build: { format: 'preserve' },
  markdown: { processor: unified({ smartypants: false, gfm: false }) },
});
