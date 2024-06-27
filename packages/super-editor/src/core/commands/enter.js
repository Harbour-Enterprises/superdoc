// TODO
export const enter = () => ({ state, dispatch }) => {
  const { $from, $to } = state.selection;

  // Check if selection is empty and within the same parent node
  if (!state.selection.empty || !$from.sameParent($to)) return false;

  const parentType = $from.parent.type.name;

  // Helper function to split the node
  const splitNode = (pos) => {
    if (dispatch) {
      const tr = state.tr.split(pos);
      tr.scrollIntoView()
    }
  };

  // Logic for splitting different parent types
  if (parentType === "paragraph") {
    splitNode($from.pos);
    return true;
  } else if (parentType === "run") {
    const parentPos = $from.before($from.depth - 1);
    splitNode(parentPos);
    return true;
  }

  return false;
};
