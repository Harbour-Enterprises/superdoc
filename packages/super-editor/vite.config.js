import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const plugins = [vue()];

  if (mode !== 'test') plugins.push(nodePolyfills());

  return {
    plugins,
    test: {
      globals: true,
      environment: 'jsdom',
    },
    build: {
      target: 'es2020',
      lib: {
        entry: "src/index.js",
        formats: ['es'],
        name: "super-editor",
        fileName: (format) => `super-editor.${format}.js`
      },
      rollupOptions: {
        external: ['vue', 'tippy.js'],
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
        '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
        '@extensions': fileURLToPath(new URL('./src/extensions', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@helpers': fileURLToPath(new URL('./src/core/helpers', import.meta.url)),
        '@packages': fileURLToPath(new URL('../', import.meta.url)),
        '@vue-3': fileURLToPath(new URL('./src/vue-3', import.meta.url)),
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
  }
})
