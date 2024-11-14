// vite.config.js
import { defineConfig } from "file:///Users/nickbernal/dev/superdoc/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
import { nodePolyfills } from "file:///Users/nickbernal/dev/superdoc/node_modules/vite-plugin-node-polyfills/dist/index.js";
import vue from "file:///Users/nickbernal/dev/superdoc/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/nickbernal/dev/superdoc/packages/super-editor/vite.config.js";
var vite_config_default = defineConfig(({ mode }) => {
  const plugins = [vue()];
  if (mode !== "test") plugins.push(nodePolyfills());
  return {
    plugins,
    test: {
      globals: true,
      environment: "jsdom"
    },
    optimizeDeps: {
      exclude: ["yjs", "tippy.js"]
    },
    build: {
      target: "es2020",
      lib: {
        entry: "src/index.js",
        formats: ["es"],
        name: "super-editor"
      },
      rollupOptions: {
        external: [
          "vue",
          "yjs",
          "tippy.js",
          "y-protocols",
          "@fortawesome/fontawesome-free",
          "@fortawesome/free-solid-svg-icons",
          "@fortawesome/vue-fontawesome"
        ],
        input: {
          "super-editor": "src/index.js",
          "editor": "@core/Editor",
          "super-converter": "@core/super-converter/SuperConverter",
          "docx-zipper": "@core/DocxZipper",
          "toolbar": "@components/toolbar/Toolbar.vue",
          "super-input": "@components/SuperInput.vue"
        },
        output: {
          globals: {
            "vue": "Vue",
            "tippy.js": "tippy"
          },
          manualChunks: {
            "super-converter": ["@core/super-converter/SuperConverter"],
            "editor": ["@core/Editor"],
            "docx-zipper": ["@core/DocxZipper"],
            "toolbar": ["@components/toolbar/Toolbar.vue"],
            "super-input": ["@components/SuperInput.vue"]
          },
          entryFileNames: "[name].es.js",
          chunkFileNames: "chunks/[name]-[hash].js"
        }
      },
      minify: false,
      sourcemap: true,
      esbuild: {
        drop: []
      }
    },
    server: {
      port: 9096
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
        "@core": fileURLToPath(new URL("./src/core", __vite_injected_original_import_meta_url)),
        "@extensions": fileURLToPath(new URL("./src/extensions", __vite_injected_original_import_meta_url)),
        "@features": fileURLToPath(new URL("./src/features", __vite_injected_original_import_meta_url)),
        "@components": fileURLToPath(new URL("./src/components", __vite_injected_original_import_meta_url)),
        "@helpers": fileURLToPath(new URL("./src/core/helpers", __vite_injected_original_import_meta_url)),
        "@packages": fileURLToPath(new URL("../", __vite_injected_original_import_meta_url)),
        "@vue-3": fileURLToPath(new URL("./src/vue-3", __vite_injected_original_import_meta_url))
      },
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"]
    },
    css: {
      postcss: "./postcss.config.cjs"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbmlja2Jlcm5hbC9kZXYvc3VwZXJkb2MvcGFja2FnZXMvc3VwZXItZWRpdG9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbmlja2Jlcm5hbC9kZXYvc3VwZXJkb2MvcGFja2FnZXMvc3VwZXItZWRpdG9yL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9uaWNrYmVybmFsL2Rldi9zdXBlcmRvYy9wYWNrYWdlcy9zdXBlci1lZGl0b3Ivdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBwbHVnaW5zID0gW3Z1ZSgpXTtcblxuICBpZiAobW9kZSAhPT0gJ3Rlc3QnKSBwbHVnaW5zLnB1c2gobm9kZVBvbHlmaWxscygpKTtcblxuICBcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zLFxuICAgIHRlc3Q6IHtcbiAgICAgIGdsb2JhbHM6IHRydWUsXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgZXhjbHVkZTogWyd5anMnLCAndGlwcHkuanMnXVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgICBsaWI6IHtcbiAgICAgICAgZW50cnk6IFwic3JjL2luZGV4LmpzXCIsXG4gICAgICAgIGZvcm1hdHM6IFsnZXMnXSxcbiAgICAgICAgbmFtZTogXCJzdXBlci1lZGl0b3JcIixcbiAgICAgIH0sXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICAgJ3Z1ZScsXG4gICAgICAgICAgJ3lqcycsXG4gICAgICAgICAgJ3RpcHB5LmpzJyxcbiAgICAgICAgICAneS1wcm90b2NvbHMnLFxuICAgICAgICAgICdAZm9ydGF3ZXNvbWUvZm9udGF3ZXNvbWUtZnJlZScsXG4gICAgICAgICAgJ0Bmb3J0YXdlc29tZS9mcmVlLXNvbGlkLXN2Zy1pY29ucycsXG4gICAgICAgICAgJ0Bmb3J0YXdlc29tZS92dWUtZm9udGF3ZXNvbWUnLFxuICAgICAgICBdLFxuICAgICAgICBpbnB1dDoge1xuICAgICAgICAgICdzdXBlci1lZGl0b3InOiAnc3JjL2luZGV4LmpzJyxcbiAgICAgICAgICAnZWRpdG9yJzogJ0Bjb3JlL0VkaXRvcicsXG4gICAgICAgICAgJ3N1cGVyLWNvbnZlcnRlcic6ICdAY29yZS9zdXBlci1jb252ZXJ0ZXIvU3VwZXJDb252ZXJ0ZXInLFxuICAgICAgICAgICdkb2N4LXppcHBlcic6ICdAY29yZS9Eb2N4WmlwcGVyJyxcbiAgICAgICAgICAndG9vbGJhcic6ICdAY29tcG9uZW50cy90b29sYmFyL1Rvb2xiYXIudnVlJyxcbiAgICAgICAgICAnc3VwZXItaW5wdXQnOiAnQGNvbXBvbmVudHMvU3VwZXJJbnB1dC52dWUnLFxuICAgICAgICB9LFxuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgICAndnVlJzogJ1Z1ZScsXG4gICAgICAgICAgICAndGlwcHkuanMnOiAndGlwcHknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICAnc3VwZXItY29udmVydGVyJzogWydAY29yZS9zdXBlci1jb252ZXJ0ZXIvU3VwZXJDb252ZXJ0ZXInXSxcbiAgICAgICAgICAgICdlZGl0b3InOiBbJ0Bjb3JlL0VkaXRvciddLFxuICAgICAgICAgICAgJ2RvY3gtemlwcGVyJzogWydAY29yZS9Eb2N4WmlwcGVyJ10sXG4gICAgICAgICAgICAndG9vbGJhcic6IFsnQGNvbXBvbmVudHMvdG9vbGJhci9Ub29sYmFyLnZ1ZSddLFxuICAgICAgICAgICAgJ3N1cGVyLWlucHV0JzogWydAY29tcG9uZW50cy9TdXBlcklucHV0LnZ1ZSddLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdbbmFtZV0uZXMuanMnLFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnY2h1bmtzL1tuYW1lXS1baGFzaF0uanMnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtaW5pZnk6IGZhbHNlLFxuICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgZXNidWlsZDoge1xuICAgICAgICBkcm9wOiBbXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDkwOTYsXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0Bjb3JlJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9jb3JlJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAZXh0ZW5zaW9ucyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvZXh0ZW5zaW9ucycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQGZlYXR1cmVzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9mZWF0dXJlcycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAnQGNvbXBvbmVudHMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL2NvbXBvbmVudHMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BoZWxwZXJzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYy9jb3JlL2hlbHBlcnMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgICAgJ0BwYWNrYWdlcyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi4vJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICdAdnVlLTMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3Z1ZS0zJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB9LFxuICAgICAgZXh0ZW5zaW9uczogWycubWpzJywgJy5qcycsICcubXRzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nXSxcbiAgICB9LFxuICAgIGNzczoge1xuICAgICAgcG9zdGNzczogJy4vcG9zdGNzcy5jb25maWcuY2pzJyxcbiAgICB9LFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VSxTQUFTLG9CQUFvQjtBQUMzVyxTQUFTLGVBQWUsV0FBVztBQUNuQyxTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFNBQVM7QUFIZ00sSUFBTSwyQ0FBMkM7QUFLalEsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDO0FBRXRCLE1BQUksU0FBUyxPQUFRLFNBQVEsS0FBSyxjQUFjLENBQUM7QUFHakQsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULGFBQWE7QUFBQSxJQUNmO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsT0FBTyxVQUFVO0FBQUEsSUFDN0I7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLEtBQUs7QUFBQSxRQUNILE9BQU87QUFBQSxRQUNQLFNBQVMsQ0FBQyxJQUFJO0FBQUEsUUFDZCxNQUFNO0FBQUEsTUFDUjtBQUFBLE1BQ0EsZUFBZTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsUUFDQSxPQUFPO0FBQUEsVUFDTCxnQkFBZ0I7QUFBQSxVQUNoQixVQUFVO0FBQUEsVUFDVixtQkFBbUI7QUFBQSxVQUNuQixlQUFlO0FBQUEsVUFDZixXQUFXO0FBQUEsVUFDWCxlQUFlO0FBQUEsUUFDakI7QUFBQSxRQUNBLFFBQVE7QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQLE9BQU87QUFBQSxZQUNQLFlBQVk7QUFBQSxVQUNkO0FBQUEsVUFDQSxjQUFjO0FBQUEsWUFDWixtQkFBbUIsQ0FBQyxzQ0FBc0M7QUFBQSxZQUMxRCxVQUFVLENBQUMsY0FBYztBQUFBLFlBQ3pCLGVBQWUsQ0FBQyxrQkFBa0I7QUFBQSxZQUNsQyxXQUFXLENBQUMsaUNBQWlDO0FBQUEsWUFDN0MsZUFBZSxDQUFDLDRCQUE0QjtBQUFBLFVBQzlDO0FBQUEsVUFDQSxnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxNQUNYLFNBQVM7QUFBQSxRQUNQLE1BQU0sQ0FBQztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxRQUNwRCxTQUFTLGNBQWMsSUFBSSxJQUFJLGNBQWMsd0NBQWUsQ0FBQztBQUFBLFFBQzdELGVBQWUsY0FBYyxJQUFJLElBQUksb0JBQW9CLHdDQUFlLENBQUM7QUFBQSxRQUN6RSxhQUFhLGNBQWMsSUFBSSxJQUFJLGtCQUFrQix3Q0FBZSxDQUFDO0FBQUEsUUFDckUsZUFBZSxjQUFjLElBQUksSUFBSSxvQkFBb0Isd0NBQWUsQ0FBQztBQUFBLFFBQ3pFLFlBQVksY0FBYyxJQUFJLElBQUksc0JBQXNCLHdDQUFlLENBQUM7QUFBQSxRQUN4RSxhQUFhLGNBQWMsSUFBSSxJQUFJLE9BQU8sd0NBQWUsQ0FBQztBQUFBLFFBQzFELFVBQVUsY0FBYyxJQUFJLElBQUksZUFBZSx3Q0FBZSxDQUFDO0FBQUEsTUFDakU7QUFBQSxNQUNBLFlBQVksQ0FBQyxRQUFRLE9BQU8sUUFBUSxPQUFPLFFBQVEsUUFBUSxPQUFPO0FBQUEsSUFDcEU7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
