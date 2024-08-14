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

    this.#makeToolbarItems();

    const el = this.config.element;
    this.app = createApp(Toolbar);
    this.app.directive('click-outside', clickOutside);
    this.app.config.globalProperties.$toolbar = this;
    this.toolbar = this.app.mount(el);
  }

  #makeToolbarItems() {
    const defaultItems = makeDefaultItems();
    this.toolbarItems = defaultItems;
    console.debug('[super-toolbar] Toolbar items:', this.toolbarItems);
  }

  /**
   * Update the toolbar state. Expects a list of marks in the form: { name, attrs }
   * @param {Object} marks
   */
  updateState(marks) {
    console.debug('[super-toolbar] Updating state:', marks);

    const textStyles = ['fontFamily', 'fontSize', 'color'];
    
    this.toolbarItems.forEach((item) => {
      let markName = item.name.value;
      console.debug('--- item name', item.name)
      if (textStyles.includes(item.name)) markName = 'textStyle';

      const activeMark = marks.find(mark => mark.name === markName);
      const { attrs } = activeMark || {};

      // let value;
      // if (attrs) {
      //   console.debug('[super-toolbar] Active mark:', attrs[item.name]);
      //   value = attrs[item.name];
      // }

      item.updateState(marks);
      // if (activeMark) {
      //   console.debug('[super-toolbar] Active mark:', activeMark);
      //   item.active.value = true;
      //   item
      //   // if (value) item.label = value;

      //   // if (!!item.activate && typeof item.activate === 'function') {
      //   //   item.activate();
      //   // }
      // } else {
      //   item.active.value = false;
      //   // item.label = item.defaultLabel;
      // }
    });

    console.debug('[super-toolbar] Updated state:', this.toolbarItems);
  }

  emitCommand(params) {
    // this.emit('command', params);
    console.debug('[super-toolbar] Command:', params, this.config.onToolbarCommand);
    this.config.onToolbarCommand(params);
  }
}