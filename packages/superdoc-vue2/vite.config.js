import vue from '@vitejs/plugin-vue2';
import path from 'path';
import { defineConfig } from 'vite';

// Define plugins array
const plugins = [
  vue({
    template: {
      compilerOptions: {}
    }
  }
)];

export default defineConfig(({ mode, command }) => {
  return {
    plugins,
    appType: 'mpa',
    build: {
      target: 'modules',
      assetsDir: '',
      manifest: true,
      sourcemap: true,
      publicDir: false,
      emptyOutDir: true,
      lib: {
        entry: 'src/index.js',
        formats: ['es', 'cjs'],
        name: 'superdoc-vue2-wrapper',
        fileName: (format) => `superdoc-vue2.${format}.js`,
      },
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/main.js'),
        },
      }
    },
    server: {
      host: '0.0.0.0',
      port: 9095,
      strictPort: false,
      fs: {
        allow: ['../', '../../'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // Fixed alias path
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
  };
});
