import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.infenix.dev',
  output: 'static',
  build: { format: 'preserve' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
