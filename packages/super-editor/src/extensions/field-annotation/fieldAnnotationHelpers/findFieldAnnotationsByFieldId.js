import { helpers } from '@core/index.js';

const { findChildren } = helpers;

export function findFieldAnnotationsByFieldId(fieldId, state) {
  let fieldAnnotations = findChildren(state.doc, (node) => {
    return (
      node.type.name === 'fieldAnnotation'
      && node.attrs.fieldId === fieldId
    );
  });

  return fieldAnnotations;
}
