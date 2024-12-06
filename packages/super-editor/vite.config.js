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
    optimizeDeps: {
      exclude: ['yjs', 'tippy.js']
    },
    build: {
      target: 'es2020',
      lib: {
        entry: "src/index.js",
        formats: ['es'],
        name: "super-editor",
      },
      rollupOptions: {
        external: [
          'vue',
          'yjs',
          'tippy.js',
          'y-protocols',
          '@fortawesome/fontawesome-free',
          '@fortawesome/free-solid-svg-icons',
          '@fortawesome/vue-fontawesome',
        ],
        input: {
          'super-editor': 'src/index.js',
          'editor': '@core/Editor',
          'super-converter': '@core/super-converter/SuperConverter',
          'docx-zipper': '@core/DocxZipper',
          'toolbar': '@components/toolbar/Toolbar.vue',
          'super-input': '@components/SuperInput.vue',
          'zipper': '@core/super-converter/zipper.js',
        },
        output: {
          globals: {
            'vue': 'Vue',
            'tippy.js': 'tippy',
          },
          manualChunks: {
            'super-converter': ['@core/super-converter/SuperConverter'],
            'editor': ['@core/Editor'],
            'docx-zipper': ['@core/DocxZipper'],
            'toolbar': ['@components/toolbar/Toolbar.vue'],
            'super-input': ['@components/SuperInput.vue'],
          },
          entryFileNames: '[name].es.js',
          chunkFileNames: 'chunks/[name]-[hash].js'
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
    css: {
      postcss: './postcss.config.cjs',
    },
  }
})
