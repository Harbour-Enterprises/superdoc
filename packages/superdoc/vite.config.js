import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig((data) => {
  return {
    plugins: [
      vue(),
    ],
    build: {
      target: 'es2020',
      lib: {
        entry: "src/index.js",
        formats: ['es'],
        name: "SuperDoc",
        fileName: (format) => `superdoc.${format}.js`
      },
      minify: true,
      sourcemap: false,
      rollupOptions: {
        external: [
          'vite-plugin-node-polyfills/shims/global',
          'yjs',
          '@hocuspocus/provider',
          'pdfjs-dist',
          'vite-plugin-node-polyfills'
        ],
        output: {
          manualChunks: {
            vue: ['vue'],
            BlankDOCX: ['@harbour-enterprises/common/data/blank.docx?url'],
            SuperEditor: ['@harbour-enterprises/super-editor'],
          }
        }
      }
    },
    optimizeDeps: {
      include: ['pdfjs-dist', 'yjs', '@hocuspocus/provider'],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
    css: {
      postcss: './postcss.config.cjs',
    },
    server: {
      port: 9094,
      fs: {
        allow: ['../', '../../'],
      },
    },
  }
});