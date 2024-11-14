import { objectIncludes } from '../utilities/objectIncludes.js';

export const normalizeDocument = (jsonDoc) => {
  let normalized = mergeSiblingTextNodes(jsonDoc);
  return normalized;
};

function mergeSiblingTextNodes(jsonNode) {
  if (!jsonNode || !jsonNode.content) {
    return jsonNode;
  }

  let mergedContent = [];
  let prevTextNode = null;

  for (let currentNode of jsonNode.content) {
    if (currentNode.type === 'text') {
      if (prevTextNode && canMergeTextNodes(prevTextNode, currentNode)) {
        prevTextNode = {
          ...prevTextNode,
          text: prevTextNode.text += currentNode.text,
        }
      } else {
        if (prevTextNode) mergedContent.push(prevTextNode);
        prevTextNode = { ...currentNode };
      }
    } else {
      if (prevTextNode) {
        mergedContent.push(prevTextNode);
        prevTextNode = null;
      }
      mergedContent.push(mergeSiblingTextNodes(currentNode));
    }
  }

  if (prevTextNode) {
    mergedContent.push(prevTextNode);
  }

  return { 
    ...jsonNode,
    content: mergedContent,
  };
}

function canMergeTextNodes(nodeA, nodeB) {
  if (!nodeA || !nodeB) return false;

  let marksA = nodeA.marks ?? [];
  let marksB = nodeB.marks ?? [];

  if (marksA.length !== marksB.length) {
    return false;
  }

  for (let i = 0; i < marksA.length; i++) {
    if (
      marksA[i].type !== marksB[i].type ||
      !areAttrsEqual(marksA[i].attrs, marksB[i].attrs)
    ) {
      return false;
    }
  }

  return true;
}

function areAttrsEqual(attrsA = {}, attrsB = {}) {
  return objectIncludes(attrsA, attrsB, { strict: true });
}
