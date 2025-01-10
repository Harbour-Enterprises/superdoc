/**
 * Pagination helper to ensure that breaks are always aligned to the editor container
 * @param {HTMLElement} editorElem The editor container element
 * @returns {MutationObserver} The observer instance
 */
export const observeDomChanges = (editorElem, editor) => {
  if (!editorElem.value || !editor) return;

  const observer = new MutationObserver((mutationsList) => {
    const zoom = editor.value?.options?.scale;
    if (!zoom) return;

    const bounds = editorElem.value.getBoundingClientRect();
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {

          // Only if the node is a pagination break do we need to do anything
          if (node.classList?.contains('pagination-break-wrapper')) {
            // Adjust the position taking zoom into account
            const nodeBounds = node.getBoundingClientRect();
            const left = ((nodeBounds.left - bounds.left) / zoom) * -1 + 1 + 'px';
            node.style.transform = `translateX(${left})`;
          }
        });
      }
    }
  });

  observer.observe(editorElem.value, {
    childList: true,
    subtree: true,
  });

  return observer;
};
