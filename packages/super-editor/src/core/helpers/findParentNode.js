/**
 * Find the closest parent node to the current selection that matches a predicate.
 * @param predicate Predicate to match.
 * @param selection Selection.
 * @returns Closest parent node that matches the predicate.
 */
export const findParentNode = (predicate, selection) => {
  const { $from: $pos } = selection;

  for (let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i)

    if (predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node,
      };
    }
  }
};
