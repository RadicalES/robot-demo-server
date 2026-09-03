import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // A terminal serves this from /<slug>/, not from the root, so every asset
  // reference has to be relative or the page loads nothing.
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
})
