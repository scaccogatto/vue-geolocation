import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Demo app published on GitHub Pages. The library itself is built by
// vite.config.ts; here we only bundle demo/, aliasing the package name to the
// sources so the demo reads exactly like real consumer code.
export default defineConfig({
  root: resolve(import.meta.dirname, 'demo'),
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-geolocation': resolve(import.meta.dirname, 'src/index.ts'),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
})
