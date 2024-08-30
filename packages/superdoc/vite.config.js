import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

  const plugins = [vue()];
  if (mode !== 'test') plugins.push(nodePolyfills());

  return {
    plugins,
    build: {
      target: 'esnext',
      lib: {
        entry: "src/index.js",
        formats: ['es'],
        name: "SuperDoc",
        fileName: (format) => `superdoc.${format}.js`
      },
      rollupOptions: {
        external: ['vite-plugin-node-polyfills/shims/global']
      },
      minify: false,
      sourcemap: true,
      esbuild: {
        drop: [],
      },
      rollupOptions: {
        external: ['vue', 'yjs', 'tippy.js', 'y-prosemirror', 'y-protocols'],
        output: {
          globals: {
            vue: 'Vue'
          }
        }
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        'yjs': fileURLToPath(new URL('../../node_modules/yjs', import.meta.url))
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