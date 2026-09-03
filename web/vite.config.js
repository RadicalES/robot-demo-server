import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Built into web/dist, which the server serves when it is there. Not into
  // public/, which was the hand-written page this replaces.
  build: { outDir: 'dist', emptyOutDir: true },
  // npm run web:dev talks to the server running on its own port.
  server: { proxy: { '/api': 'http://localhost:8086' } },
})
