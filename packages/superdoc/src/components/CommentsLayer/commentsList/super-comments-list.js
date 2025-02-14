import EventEmitter from 'eventemitter3';
import { createApp } from 'vue';

import { vClickOutside } from '@harbour-enterprises/common';
import CommentsList from './commentsList.vue';

export class SuperComments extends EventEmitter {

  config = {
    comments: [],
    element: null,
    commentsStore: null,
  };

  constructor(options, superdoc) {
    super();
    this.config = { ...this.config, ...options };
    this.app = null;
    this.superdoc = superdoc;
    this.open();
  };

  createVueApp() {
    this.app = createApp(CommentsList);
    this.app.directive('click-outside', vClickOutside);
    this.app.config.globalProperties.$superdoc = this.superdoc;
    this.element = document.getElementById(this.config.selector);
    this.container = this.app.mount(this.element);
  }

  close() {
    if (this.app) {
      this.app.unmount();
      this.app = null;
      this.container = null;
      this.element = null;
      console.debug('SuperComments closed');
    }
  }

  open() {
    if (!this.app) {
      this.createVueApp();
      console.debug('SuperComments opened');
    }
  }
};
