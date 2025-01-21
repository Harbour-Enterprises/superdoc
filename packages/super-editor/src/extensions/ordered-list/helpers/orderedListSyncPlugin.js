import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * Synchronizes order attribute if lists have the same syncId.
 */
export function orderedListSync(options = {}) {
  return new Plugin({
    key: new PluginKey('orderedListSync'),

    appendTransaction: (transactions, oldState, newState) => {
      let docChanges = transactions.some((tr) => tr.docChanged) && !oldState.doc.eq(newState.doc);

      if (!docChanges) {
        return;
      }
    
      let { doc, tr } = newState;

      let listsBySyncId = {};
      const listsByIdentifier = new Map();

      doc.descendants((node, pos) => {
        if (node.type.name === 'orderedList' && !!node.attrs.listId) {
          let syncId = node.attrs.listId;
          const lvl = node.attrs.level;
          listsByIdentifier.set([syncId, lvl], node);
          if (!listsBySyncId[syncId]) listsBySyncId[syncId] = [];
          listsBySyncId[syncId].push({ node, pos });
        }
      });

      console.debug('Lists by syncId', listsByIdentifier);

      let hasListsToSync = !!Object.keys(listsBySyncId).length;

      if (!hasListsToSync) {
        return;
      }

      let changed = false;
      listsByIdentifier.forEach((list, key) => {
      // Object.entries(listsByIdentifier).forEach(([key, lists]) => {
  
        // If there are less than 2 lists, then we have nothing to sync.
        // if (lists.length < 2) {
        //   let [firstList] = lists;
        //   tr.setNodeMarkup(firstList.pos, undefined, {
        //     ...firstList.node.attrs,
        //     syncId: null,
        //   });

        //   changed = true;
        //   return;
        // }

        console.debug('SyncId', list, key);
        return;
        let [firstList] = lists;
        let currentOrder = firstList.node.attrs.order;

        lists.forEach((list, index) => {
          console.debug('index', index);
          // Skip the first list.
          if (index === 0) return;

          let { node, pos } = list;
          let prevList = lists[index - 1];
          let newOrder = currentOrder + prevList.node.childCount;
          console.debug('Order', node.attrs.order, newOrder);

          if (node.attrs.order !== newOrder) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              order: newOrder,
            });
            changed = true;

            let currentPos = list.pos + 1;
            list.node.content.forEach((el) => {
              tr.setNodeMarkup(currentPos, undefined, {
                ...el.attrs,
                index: newOrder,
              });
              currentPos++;
            })
          }

          currentOrder = newOrder;
        });
      });

      console.debug('\n\n\n ')
      return changed ? tr : null;
    },
  });
};
