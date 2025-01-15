import { createApp } from 'vue';
import { createPinia } from 'pinia';

import { vClickOutside } from '@harbour-enterprises/common';
import { useSuperdocStore } from '../stores/superdoc-store';
import App from '../Superdoc.vue';

/**
 * Generate the superdoc vue app
 * @returns {Object} An object containing the vue app, the pinia reference, and the superdoc store
 */
export const createSuperdocVueApp = () => {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.directive('click-outside', vClickOutside);

  const superdocStore = useSuperdocStore();
  return { app, pinia, superdocStore };
};
