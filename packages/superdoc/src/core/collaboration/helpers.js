import { createAwarenessHandler, createProvider } from '../collaboration/collaboration';
import useConversation from '../../components/CommentsLayer/use-conversation';
import useComment from '../../components/CommentsLayer/use-comment';

/**
 * Initialize sync for comments if the module is enabled
 * 
 * @param {Object} superdoc The SuperDoc instance
 * @returns {void}
 */
export const initCollaborationComments = (superdoc) => {
  if (!superdoc.config.modules.comments) return;

  // Get the comments map from the Y.Doc
  const commentsMap = superdoc.ydoc.getMap('comments');

  // Observe changes to the comments map
  commentsMap.observe((event) => {
    const currentUser = superdoc.config.user;
    const { user = {} } = event.transaction.origin;
    // if (currentUser.name === user.name && currentUser.email === user.email) return;

    // Update conversations
    const conversations = commentsMap.get('conversations');
    superdoc.superdocStore.documents.forEach((doc) => {
      const allConvos = conversations.filter((c) => c.documentId === doc.id);
      doc.conversations = allConvos.map((c) => {
        console.debug('convers', c, '\n\n');
        return useConversation(c)
      });
    });

  });
};

/**
 * Initialize SuperDoc general Y.Doc for high level collaboration
 * Assigns superdoc.ydoc and superdoc.provider in place
 * 
 * @param {Object} superdoc The SuperDoc instance
 * @returns {void}
 */
export const initSuperdocYdoc = (superdoc) => {
  const superdocCollaborationOptions = {
    config: superdoc.config.modules.collaboration,
    user: superdoc.config.user,
    documentId: `${superdoc.config.superdocId}-superdoc`,
    socket: superdoc.socket,
    superdocInstance: superdoc,
  };
  const { provider: superdocProvider, ydoc: superdocYdoc } = createProvider(superdocCollaborationOptions);
  superdoc.ydoc = superdocYdoc;
  superdoc.provider = superdocProvider;
};

/**
 * Process SuperDoc's documents to make them collaborative by 
 * adding provider, ydoc, awareness handler, and socket to each document.
 * 
 * @param {Object} superdoc The SuperDoc instance
 * @returns {Array[Object]} The processed documents
 */
export const makeDocumentsCollaborative = (superdoc) => {
  const processedDocuments = [];
  superdoc.config.documents.forEach((doc) => {
    superdoc.config.user.color = superdoc.colors[0];
    const options = {
      config: superdoc.config.modules.collaboration,
      user: superdoc.config.user,
      documentId: doc.id,
      socket: superdoc.socket,
      superdocInstance: superdoc,
    };

    const { provider, ydoc } = createProvider(options);
    doc.provider = provider;
    doc.socket = superdoc.socket;
    doc.ydoc = ydoc;
    doc.role = superdoc.config.role;
    provider.on('awarenessUpdate', ({ states }) => createAwarenessHandler(superdoc, states));
    processedDocuments.push(doc);
  });
  return processedDocuments;
};

export const syncCommentsToClients = (superdoc) => {
  if (superdoc.isCollaborative) {
    superdoc.conversations = superdoc.superdocStore.documents
      .map((doc) => {
        const conversations = doc.conversations.map((convo) => {
          const comments = convo.comments.map((comment) => comment.getValues());
          return {
            ...convo.getValues(),
            comments,
          };
        });
        return conversations;
      })
      .flat();

    const yComments = superdoc.ydoc.getMap('comments');
    superdoc.ydoc.transact(() => {
      yComments.set('conversations', superdoc.conversations);
    }, { user: superdoc.user });
  };
}