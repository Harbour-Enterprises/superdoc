import { Plugin, PluginKey } from 'prosemirror-state';
import { baseOrderedListDef, baseBulletList } from './base-list-definitions.js';

export const listPluginKey = new PluginKey('listPlugin');
export function listPlugin({ editor }) {
  return new Plugin({
    key: listPluginKey,
    state: {
      init() {
        // Get the imported docx list definitions
        if (!editor.converter?.numbering) return {};
        const { definitions, abstracts } = editor.converter.numbering;

        const lists = Object.entries(definitions).map(([listId, list]) => ({
          listId: parseInt(listId, 10),
          listType: 'imported',
          definition: list,
        }));

        return {
          lists,
          definitions: {
            nextAbstractNumId: getNextKeyForList(abstracts),
            orderedList: baseOrderedListDef,
            bulletList: baseBulletList,
          }
        };
      },
      apply(tr, oldState, prevEditorState, newEditorState) {
        if (!tr.docChanged) return oldState;

        const meta = tr.getMeta(listPluginKey);
        if (!meta) return oldState;

        const { newId, type: typeNode } = meta;
        const { name: listType } = typeNode;
        const { lists, definitions } = oldState;
        lists.push({
          listId: newId,
          source: 'generated',
          listType,
          abstractId: definitions.nextAbstractNumId,
        });

        return {
          ...oldState,
          definitions: {
            ...oldState.definitions,
            nextAbstractNumId: definitions.nextAbstractNumId + 1,
          }
        };
      },
    }
  });
};

/**
 * Return the next integer key for list definitions/
 * @param {Object} definitions Object where keys are integers
 * @returns {Number} The next highest integer not in the object
 */
export const getNextKeyForList = (definitions) => {
  const highestKey = Math.max(...Object.keys(definitions).map(Number));
  return highestKey + 1;
};
