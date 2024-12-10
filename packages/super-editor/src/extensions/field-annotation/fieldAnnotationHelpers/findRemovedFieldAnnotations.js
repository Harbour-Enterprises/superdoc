import { ReplaceStep } from 'prosemirror-transform';

export function findRemovedFieldAnnotations(tr) {
  let removedNodes = [];

  if (
    !tr.steps.length ||
    (tr.meta && !Object.keys(tr.meta).every((meta) => ['inputType', 'uiEvent', 'paste'].includes(meta))) ||
    ['historyUndo', 'historyRedo'].includes(tr.getMeta('inputType')) ||
    ['drop'].includes(tr.getMeta('uiEvent')) ||
    tr.getMeta('fieldAnnotationUpdate') === true
  ) {
    return removedNodes;
  }

  tr.steps.forEach((step, stepIndex) => {
    if (step instanceof ReplaceStep && step.from !== step.to) {
      let mapping = tr.mapping.maps[stepIndex];
      let originalDoc = tr.before;

      originalDoc.nodesBetween(step.from, step.to, (node, pos) => {
        if (node.type.name === 'fieldAnnotation') {
          let mappedPos = mapping.mapResult(pos);
          
          if (mappedPos.deleted) {
            removedNodes.push({ node, pos });
          }
        }
      });
    }
  });

  return removedNodes;
}
