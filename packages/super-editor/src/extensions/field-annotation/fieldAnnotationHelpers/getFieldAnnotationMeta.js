import { findFirstFieldAnnotationByFieldId } from './findFirstFieldAnnotationByFieldId';

export function getFieldAnnotationMeta(fieldId, state) {
  let annotation = findFirstFieldAnnotationByFieldId(fieldId, state);
  return annotation?.node.attrs.meta ?? {};
}
