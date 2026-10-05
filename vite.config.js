import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
