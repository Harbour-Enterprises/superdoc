import { initializeApp } from 'firebase/app';

import { FirestoreProvider } from '@gmcfall/yjs-firestore-provider'
import { WebsocketProvider } from 'y-websocket';

function createAwarenessHandler(context) {
  return (data) => {
    context.emit('copresence-update', data);
  }
}

function createProvider(config, ydoc, user) {
  if (config.providerType === 'firestore') {
    return createFirestoreProvider(config, ydoc, user);
  } else if (config.providerType === 'socket') {
    return createWebsocketProvider(config, ydoc, user);
  } else {
    throw new Error(`[superdoc] Unsupported provider type: ${config.providerType}`);
  }
}

function createFirestoreProvider(config, ydoc) {
  const firebaseApp = initializeApp(config.firebaseConfig);
  const documentPath = config.path.split('/');
  const provider = new FirestoreProvider(firebaseApp, ydoc, documentPath);
  provider.awareness.setLocalStateField('user', config.user);
  return provider;
}

function createWebsocketProvider(config, ydoc) {
  // Test locally with HOST=localhost PORT=8080 npx y-websocket
  const provider = new WebsocketProvider(config.url, config.path, ydoc);
  provider.awareness.setLocalStateField('user', config.user);
  return provider;
}

function getUsers(provider, colors) {
  return Array.from(provider.awareness.states.entries()).map(([clientId, value]) => {
    return {
      clientId,
      ...value.user,
      color: colors[clientId],
    };
  });
}

export { createAwarenessHandler, createProvider };