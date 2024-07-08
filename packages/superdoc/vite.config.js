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
      target: 'es2022',
      lib: {
        entry: "src/index.js",
        formats: ['es', 'cjs'],
        name: "SuperDoc",
        fileName: (format) => `superdoc.${format}.js`
      },
      minify: false,
      sourcemap: true,
      esbuild: {
        drop: [],
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
    rollupOptions: {
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@common': fileURLToPath(new URL('../../common', import.meta.url)),
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