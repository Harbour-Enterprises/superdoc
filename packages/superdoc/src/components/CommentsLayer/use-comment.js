import { ref, reactive, toRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';

import { syncCommentsToClients } from '@core/collaboration/helpers.js';
import { comments_module_events } from '@harbour-enterprises/common';
import useSelection from '@/helpers/use-selection';

/**
 * Comment composable
 * 
 * @param {Object} params The initial values of the comment
 * @returns {Object} The comment composable
 */
export default function useComment(params) {
  const uid = ref(params.uid);
  const commentId = params.commentId || uuidv4();
  const parentCommentId = params.parentCommentId;
  const fileId = params.fileId;
  const fileType = params.fileType;
  const createdAtVersionNumber = params.createdAtVersionNumber;
  const isInternal = ref(params.isInternal !== undefined ? params.isInternal : true);
  const mentions = ref([]);

  const commentElement = ref(null);
  const isFocused = ref(params.isFocused || false);

  const creatorEmail = params.creatorEmail;
  const creatorName = params.creatorName;
  const createdTime = params.createdTime || Date.now();

  const commentText = ref(params.commentText || '');

  const selection = params.selection ? useSelection(params.selection) : null;
  const trackedChange = ref(params.trackedChange);

  const resolvedTime = ref(params.resolvedTime || null);
  const resolvedByEmail = ref(params.resolvedByEmail || null);
  const resolvedByName = ref(params.resolvedByName || null);

  /**
   * Mark this conversation as resolved with UTC date
   * 
   * @param {String} email The email of the user marking this conversation as done
   * @param {String} name The name of the user marking this conversation as done
   * @returns {void}
   */
  const resolveComment = ({ email, name, superdoc }) => {
    if (resolvedTime.value) return;
    resolvedTime.value = Date.now();
    resolvedByEmail.value = email;
    resolvedByName.value = name;

    const emitData = { type: comments_module_events.RESOLVED, comment: getValues() };
    propagateUpdate(superdoc, emitData);
  };

  /**
   * Update the isInternal value of this comment
   * 
   * @param {Object} param0 
   * @param {Boolean} param0.isInternal The new isInternal value
   * @param {Object} param0.superdoc The SuperDoc instance
   * @returns {void}
   */
  const setIsInternal = ({ isInternal: newIsInternal, superdoc }) => {
    const previousValue = isInternal.value;
    if (previousValue === newIsInternal) return;

    // Update the isInternal value
    isInternal.value = newIsInternal;

    const emitData = {
      type: comments_module_events.UPDATE,
      changes: [{ key: 'isInternal', value: newIsInternal, previousValue }],
      comment: getValues()
    };
    propagateUpdate(superdoc, emitData);
  };

  /**
   *  Update the text value of this comment
   * 
   * @param {Object} param0
   * @param {String} param0.text The new text value
   * @param {Object} param0.superdoc The SuperDoc instance
   * @returns {void}
   */
  const setText = ({ text, superdoc, suppressUpdate }) => {
    commentText.value = text;

    // Track mentions
    mentions.value = extractMentions(text);;
  
    if (suppressUpdate) return;

    const emitData = {
      type: comments_module_events.UPDATE,
      changes: [{ key: 'text', value: text }],
      comment: getValues()
    };
    propagateUpdate(superdoc, emitData);
  };

  const extractMentions = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const mentionElements = [...doc.querySelectorAll('span[data-type="mention"]')];

    const uniqueMentions = [];
    mentionElements.forEach((span) => {
      const alreadyExists = uniqueMentions.some((m) => {
        const hasEmail = m.email === span.getAttribute('email');
        const hasName = m.name === span.getAttribute('name');
        return hasEmail && hasName;
      });
      
      if (!alreadyExists) {
        uniqueMentions.push({
          name: span.getAttribute('name'),
          email: span.getAttribute('email'),
        });
      };
    });

    return uniqueMentions;
  };

  /**
   * Emit updates to the end client, and sync with collaboration if necessary
   * 
   * @param {Object} superdoc The SuperDoc instance
   * @param {Object} emitData The data to emit to the client
   * @returns {void}
   */
  const propagateUpdate = (superdoc, emitData) => {
    superdoc.emit('comments-update', emitData);
    syncCommentsToClients(superdoc);
  };

  /**
   * Get the raw values of this comment
   * 
   * @returns {Object} - The raw values of this comment
   */
  const getValues = () => {
    return {
      uid: uid.value,
      commentId,
      parentCommentId,
      fileId,
      fileType,
      mentions: mentions.value,
      createdAtVersionNumber,
      creatorEmail,
      creatorName,
      createdTime,
      isInternal: isInternal.value,
      commentText: commentText.value,
      selection: selection ? selection.getValues() : null,
      trackedChange: trackedChange.value,
      resolvedTime: resolvedTime.value,
      resolvedByEmail: resolvedByEmail.value,
      resolvedByName: resolvedByName.value,
    };
  };

  return reactive({
    uid,
    commentId,
    parentCommentId,
    fileId,
    fileType,
    mentions,
    commentElement,
    isFocused,
    creatorEmail,
    creatorName,
    createdTime,
    isInternal,
    commentText,
    selection,
    trackedChange,
    resolvedTime,
    resolvedByEmail,
    resolvedByName,

    // Actions
    setText,
    getValues,
    resolveComment,
    setIsInternal,
  });
};


export function useCommentDeprecated(params) {
  const id = ref(params.id || crypto.randomUUID());
  const documentId = ref(params.documentId);
  const comment = ref(params.comment);
  const trackedChange = ref(params.trackedChange);
  const user = reactive({
    name: params.user.name,
    email: params.user.email,
  });

  const timestamp = new Date(params.timestamp || Date.now());

  const getValues = () => {
    return {
      id: id.value,
      documentId: documentId.value,
      comment: comment.value,
      trackedChange: toRaw(trackedChange),
      user: toRaw(user),
      timestamp: new Date(timestamp).getTime(),
    };
  };

  return {
    id,
    documentId,
    comment,
    trackedChange,
    user,
    timestamp,
    getValues,
  };
};
