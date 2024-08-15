import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import Toolbar from '../super-editor/src/components/toolbar/Toolbar.vue'
import { makeDefaultItems } from '../super-editor/src/components/toolbar/defaultItems';
import clickOutside from '@common/helpers/v-click-outside';


export class SuperToolbar extends EventEmitter {

  config = {
    element: null,
    onToolbarCommand: () => null,
  }

  constructor(config) {
    super();
    this.config = { ...this.config, ...config };

    this.#makeToolbarItems(this);

    const el = this.config.element;
    this.app = createApp(Toolbar);
    this.app.directive('click-outside', clickOutside);
    this.app.config.globalProperties.$toolbar = this;
    this.toolbar = this.app.mount(el);
  }

  #makeToolbarItems(superToolbar) {
    const defaultItems = makeDefaultItems(superToolbar);
    this.toolbarItems = defaultItems;
    console.debug('[super-toolbar] Toolbar items:', this.toolbarItems);
  }

  /**
   * Update the toolbar state. Expects a list of marks in the form: { name, attrs }
   * @param {Object} marks
   */
  updateToolbarState(marks) {
    this.toolbarItems.forEach((item) => {
      item.updateState(marks);
    });
  }

  emitCommand({ item, argument }) {
    console.debug('[super-toolbar] Command:', item.command, item, argument);
    this.config.onToolbarCommand({ item, argument });
  }
}