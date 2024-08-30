import { initializeApp } from 'firebase/app';
import { FirestoreProvider } from '@harbour-enterprises/common/collaboration/firestore-provider';
import { WebsocketProvider } from 'y-websocket';

function createAwarenessHandler(context) {
  return (data) => {
    context.emit('copresence-update', data);
  }
}

function createProvider({ config, ydoc, user, userDocument }) {
  const path = `${config.path}/${user.email}/${userDocument.id}`;
  console.debug('[superdoc] Creating provider:', config.providerType, path);
  if (config.providerType === 'firestore') {
    return createFirestoreProvider(config, ydoc, path);
  } else if (config.providerType === 'socket') {
    return createWebsocketProvider(config, ydoc, path);
  } else {
    throw new Error(`[superdoc] Unsupported provider type: ${config.providerType}`);
  }
}

function createFirestoreProvider(config, ydoc, path) {
  const firebaseApp = initializeApp(config.firebaseConfig);
  const documentPath = path.split('/');
  const provider = new FirestoreProvider(firebaseApp, ydoc, documentPath);
  provider.awareness.setLocalStateField('user', config.user);
  return provider;
}

function createWebsocketProvider(config, ydoc, path) {
  // Test locally with HOST=localhost PORT=8080 npx y-websocket
  const provider = new WebsocketProvider(config.url, path, ydoc);
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