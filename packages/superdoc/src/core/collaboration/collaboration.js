import { HocuspocusProvider } from "@hocuspocus/provider";
import { awarenessStatesToArray } from '@harbour-enterprises/common/collaboration/awareness.js';
import { Doc as YDoc } from 'yjs';

/**
 * Translate awareness states to an array of users. This will cause superdoc (context) to 
 * emit an awareness-update event with the list of users.
 * 
 * @param {Object} context The superdoc instance
 * @param {*} states The awareness states
 * @returns {void}
 */
function createAwarenessHandler(context, states) {
  // Context is the superdoc instance
  // Since co-presence is handled outside of superdoc,
  // we need to emit an awareness-update event
  context.emit('awareness-update', awarenessStatesToArray(states));
}

/**
 * Main function to create a provider for collaboration.
 * Currently only hocuspocus is actually supported.
 * 
 * @param {Object} param The config object
 * @param {Object} param.config The configuration object
 * @param {Object} param.ydoc The Yjs document
 * @param {Object} param.user The user object
 * @param {string} param.documentId The document ID
 * @returns {Object} The provider and socket
 */
function createProvider({ config, user, documentId }) {
  const providers = {
    hocuspocus: () => createHocuspocusProvider({ config, user, documentId }),
  };
  return providers[config.providerType]();
};

/**
 * 
 * @param {Object} param The config object
 * @param {Object} param.config The configuration object
 * @param {Object} param.ydoc The Yjs document
 * @param {Object} param.user The user object
 * @param {string} param.documentId The document ID
 * @returns {Object} The provider and socket
 */
function createHocuspocusProvider({ config, user, documentId }) {
  const ydoc = new YDoc({ gc: false });
  const provider = new HocuspocusProvider({
    websocketProvider: config.socket,
    name: documentId,
    document: ydoc,
    token: config.token || 'token',
    preserveConnection: false,
    onAuthenticationFailed,
    onDisconnect,
  });

  provider.setAwarenessField('user', user);
  return { provider, ydoc };
};

const onAuthenticationFailed = (data) => {
  console.warn('🔒 [superdoc] Authentication failed', data);
}

const onDisconnect = (data) => {
  console.warn('🔌 [superdoc] Disconnected', data);
}

export { createAwarenessHandler, createProvider };