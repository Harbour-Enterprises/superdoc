
import { keymap } from 'prosemirror-keymap';
import { Schema } from './Schema.js';
import { Attribute } from './Attribute.js';
import { getExtensionConfigField } from './helpers/getExtensionConfigField.js';
import { getSchemaTypeByName } from './helpers/getSchemaTypeByName.js'
import { callOrGet } from './utilities/callOrGet.js';

import { CommentsPlugin } from '@/plugins/comments/comments-plugin.js';
import { DecorationClick } from '@/plugins/decorationClick/decoration-click.js';

/**
 * ExtensionService is the main class to work with extensions.
 */
export class ExtensionService {
  editor;

  schema;

  extensions;

  splittableMarks = [];

  constructor(extensions, editor) {
    this.editor = editor;
    this.extensions = ExtensionService.getResolvedExtensions(extensions);
    this.schema = Schema.createSchemaByExtensions(this.extensions, editor);
    this.#setupExtensions();
  }

  /**
   * Static method for creating ExtensionService.
   * @param args Arguments for the constructor.
   */
  static create(...args) {
    return new ExtensionService(...args);
  }

  /**
   * Get an array of resolved extensions (e.g. sorted by priority).
   * @param extensions Array of extensions.
   * @returns Array of resolved extensions.
   */
  static getResolvedExtensions(extensions) {
    const resolvedExtensions = ExtensionService.sortByPriority(extensions);
    return resolvedExtensions;
  }

  /**
   * Sort extensions by priority.
   * @param extensions Array of extensions.
   * @returns Array of sorted extensions by priority.
   */
  static sortByPriority(extensions) {
    const defaultValue = 100;
    return extensions.sort((a, b) => {
      const priorityA = getExtensionConfigField(a, 'priority') || defaultValue;
      const priorityB = getExtensionConfigField(b, 'priority') || defaultValue;
      if (priorityA > priorityB) return - 1;
      if (priorityA < priorityB) return 1;
      return 0;
    });
  }

  /**
   * Get all commands defined in the extensions.
   * @returns Object with commands (key - command name, value - function).
   */
  get commands() {
    let container = {};

    for (const extension of this.extensions) {
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor: this.editor,
        type: getSchemaTypeByName(extension.name, this.schema),
      };

      const addCommands = getExtensionConfigField(extension, 'addCommands', context);
      if (addCommands) {
        container = { 
          ...container, 
          ...addCommands() 
        };
      }
    }

    return container;
  }

  /**
   * TODO:Artem Add input and paste rules.
   * 
   * Get all PM plugins defined in the extensions.
   * And also keyboard shortcuts.
   * @returns Array of PM plugins.
   */
  get plugins() {
    const editor = this.editor;
    const extensions = ExtensionService.sortByPriority([...this.extensions].reverse());

    const allPlugins = extensions.map((extension) => {
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor,
        type: getSchemaTypeByName(extension.name, this.schema),
      };

      const plugins = [];

      const addShortcuts = getExtensionConfigField(extension, 'addShortcuts', context);

      let bindingsContainer = {};
      if (addShortcuts) {
        const entries = Object.entries(addShortcuts()).map(([shortcut, method]) => {
          return [shortcut, (...args) => method({ editor, keymapArgs: args })];
        });
        const bindings = Object.fromEntries(entries);

        bindingsContainer = { ...bindings };
      }

      const keymapPlugin = keymap(bindingsContainer);
      plugins.push(keymapPlugin);

      const addPmPlugins = getExtensionConfigField(extension, 'addPmPlugins', context);
      if (addPmPlugins) {
        const pmPlugins = addPmPlugins();
        plugins.push(...pmPlugins);
      }

      return plugins;
    }).flat();

    return [
      ...allPlugins,
    ];
  }

/**
   * Get all attributes defined in the extensions.
   * @returns Array of attributes.
   */
  get attributes() {
    return Attribute.getAttributesFromExtensions(this.extensions);
  }

  /**
   * Install all extensions.
   * Create extension storage in the editor, attach editor events.
   */
  #setupExtensions() {
    for (const extension of this.extensions) {
      this.editor.extensionStorage[extension.name] = extension.storage;

      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor: this.editor,
        type: getSchemaTypeByName(extension.name, this.schema),
      };

      if (extension.type === 'mark') {
        const keepOnSplit = callOrGet(getExtensionConfigField(extension, 'keepOnSplit', context)) ?? true;
        if (keepOnSplit) {
          this.splittableMarks.push(extension.name);
        }
      }
      
      this.#attachEditorEvents(extension);
    }
  }

  /**
   * Attach editor events to extension 
   * if callbacks are defined in the extension config.
   * @param extension Extension.
   */
  #attachEditorEvents(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
      editor: this.editor,
      type: getSchemaTypeByName(extension.name, this.schema),
    };

    const onBeforeCreate = getExtensionConfigField(extension, 'onBeforeCreate', context);
    const onCreate = getExtensionConfigField(extension, 'onCreate', context);
    const onUpdate = getExtensionConfigField(extension, 'onUpdate', context);
    const onSelectionUpdate = getExtensionConfigField(extension, 'onSelectionUpdate', context);
    const onTransaction = getExtensionConfigField(extension, 'onTransaction', context);
    const onFocus = getExtensionConfigField(extension, 'onFocus', context);
    const onBlur = getExtensionConfigField(extension, 'onBlur', context);
    const onDestroy = getExtensionConfigField(extension, 'onDestroy', context);

    if (onBeforeCreate) this.editor.on('beforeCreate', onBeforeCreate);
    if (onCreate) this.editor.on('create', onCreate);
    if (onUpdate) this.editor.on('update', onUpdate);
    if (onSelectionUpdate) this.editor.on('selectionUpdate', onSelectionUpdate);
    if (onTransaction) this.editor.on('transaction', onTransaction);
    if (onFocus) this.editor.on('focus', onFocus);
    if (onBlur) this.editor.on('blur', onBlur);
    if (onDestroy) this.editor.on('destroy', onDestroy);
  }
};
