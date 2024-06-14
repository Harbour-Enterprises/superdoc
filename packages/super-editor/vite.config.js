import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    nodePolyfills(),
    vue(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    target: 'es2020',
    lib: {
      entry: "src/index.js",
      formats: ['es', 'cjs'],
      name: "super-editor",
      fileName: (format) => `super-editor.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    },
    minify: false,
    sourcemap: true,
    esbuild: {
      drop: [],
    },
  },
  server: {
    port: 9096,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@classes': fileURLToPath(new URL('./src/classes', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@schemas': fileURLToPath(new URL('./src/schemas', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
