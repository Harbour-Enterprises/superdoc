import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import vue from '@vitejs/plugin-vue'


// https://vitejs.dev/config/
export default defineConfig(({ mode, command}) => {
  const plugins = [vue()];
  if (mode === 'development') plugins.push(nodePolyfills());

  return {
    plugins,
    build: {
      target: 'es2020',
      lib: {
        entry: "src/index.js",
        formats: ['es', 'cjs', 'umd'],
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
        external: ['yjs'],
        output: {
          globals: {
            yjs: 'yjs'
          }
        }
      },
    },
    optimizeDeps: {
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