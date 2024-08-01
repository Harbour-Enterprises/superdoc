import { getNodeType } from '../helpers/getNodeType.js';
import { findParentNode } from '../helpers/findParentNode.js';
import { isList } from '../helpers/isList.js';
import { joinListBackwards } from '../helpers/joinListBackwards.js';
import { joinListForwards } from '../helpers/joinListForwards.js';

/**
 * Toggle between list types.
 * @param listTypeOrName The type/name of the list.
 * @param itemTypeOrName The type/name of the list item.
 * @param keepMarks Keep marks when toggling.
 * @param attributes Attrs for the new list.
 */
export const toggleList = (listTypeOrName, itemTypeOrName, keepMarks, attributes = {}) => (props) => {
  const { 
    editor, 
    tr, 
    state, 
    dispatch, 
    chain, 
    can,
    commands,
  } = props;

  const { extensions, splittableMarks } = editor.extensionService;
  const listType = getNodeType(listTypeOrName, state.schema);
  const itemType = getNodeType(itemTypeOrName, state.schema);
  const { selection, storedMarks } = state;
  const { $from, $to } = selection;
  const range = $from.blockRange($to);

  const marks = storedMarks || (selection.$to.parentOffset && selection.$from.marks());

  if (!range) return false;

  const parentList = findParentNode((node) => isList(node.type.name, extensions))(selection);

  // This is the case when we toggle an existing list.
  if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
    // If we toggle to the same list type, 
    // then execute `liftListItem` command.
    if (parentList.node.type === listType) {
      return commands.liftListItem(itemType);
    }

    // When we switch between different list types.
    if (
      isList(parentList.node.type.name, extensions)
      && listType.validContent(parentList.node.content)
      && dispatch
    ) {
      const result = chain()
        .command(() => {
          tr.setNodeMarkup(parentList.pos, listType);
          return true;
        })
        .command(() => joinListBackwards(tr, listType))
        .command(() => joinListForwards(tr, listType))
        .run();

      return result;
    }
  }

  const createTryConvertNodeToDefault = ({ ensureMarks = false }) => {
    return () => {
      const canWrapInList = can().wrapInList(listType, attributes);
      if (ensureMarks) {
        const filteredMarks = marks.filter((mark) => splittableMarks.includes(mark.type.name));
        tr.ensureMarks(filteredMarks);
      }
      if (canWrapInList) return true;
      return commands.clearNodes();
    };
  };

  // This is the case when there is no need to ensureMarks.
  if (!keepMarks || !marks || !dispatch) {
    const result = chain()
      // First check if it's possible to wrap node in a list 
      // and if not then try to convert it into a default node (paragraph).
      .command(createTryConvertNodeToDefault({ ensureMarks: false }))
      .wrapInList(listType, attributes)
      .command(() => joinListBackwards(tr, listType))
      .command(() => joinListForwards(tr, listType))
      .run();

    return result;
  }
  
  const result = chain()
    // First check if it's possible to wrap node in a list 
    // and if not then try to convert it into a default node (paragraph).
    .command(createTryConvertNodeToDefault({ ensureMarks: true }))
    .wrapInList(listType, attributes)
    .command(() => joinListBackwards(tr, listType))
    .command(() => joinListForwards(tr, listType))
    .run();

  return result;
};
