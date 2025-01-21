import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./packages/super-editor/vite.config.js",
  "./packages/superdoc/vite.config.js",
  // "./examples/react-example/vite.config.js",
  // "./examples/vue-example/vite.config.js",
  // "./examples/vanilla-example/vite.config.js"
])
