import { findRemovedFieldAnnotations } from './findRemovedFieldAnnotations.js';

export function trackFieldAnnotationsDeletion(editor, tr) {
  let removedAnnotations = findRemovedFieldAnnotations(tr);

  if (removedAnnotations.length > 0) {
    setTimeout(() => {
      editor.emit('fieldAnnotationDeleted', {
        editor,
        removedNodes: removedAnnotations,
      });
    }, 0);
  }
}
