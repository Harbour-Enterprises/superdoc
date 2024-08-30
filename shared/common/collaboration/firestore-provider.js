import { FirestoreProvider as BaseFirestoreProvider } from '@gmcfall/yjs-firestore-provider'
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

class FirestoreProvider extends BaseFirestoreProvider {
  constructor(firebaseApp, ydoc, path, debug = true) {
    super(firebaseApp, ydoc, path);

    this.isConnected = false;
    this.pendingUpdates = 0;
    const db = getFirestore(firebaseApp);
    const docRef = doc(db, path.join('/'));

    this.debug = debug;

    ydoc.on('update', this.handleUpdate.bind(this));
    ydoc.on('beforeTransaction', this.handleYdocTransactionStart.bind(this));

    onSnapshot(docRef, (docSnapshot) => {
      this.handleConnected(docSnapshot);
    });
  }

  #log(...args) {
    if (!this.debug) return;
    console.debug('🔥 [FirestoreProvider]', ...args);
  }

  handleYdocTransactionStart(transaction) {
    const { origin } = transaction;
    if (origin) this.pendingUpdates += 1;
  }

  handleConnected(docSnapshot) {
    this.#log('[🔥 provider] handleConnected', docSnapshot.metadata, this.pendingUpdates);
    const isFromCache = docSnapshot.metadata.fromCache;
    const hasPendingWrites = docSnapshot.metadata.hasPendingWrites;
    this.isConnected = !isFromCache && !hasPendingWrites;
    this.pendingUpdates === 0 && this.emit('synced', [true]);
  }
  
  handleUpdate(update) {
    this.#log('[🔥 provider] handleUpdate');
    this.pendingUpdates -= 1;
    this.checkIfAllUpdatesFinished();
  }

  checkIfAllUpdatesFinished() {
    this.#log('[🔥 provider] checkIfAllUpdatesFinished', this.pendingUpdates);
    if (this.pendingUpdates === 0) {
      this.isSynced = true;
      this.emit('synced', [true]);
    }
  }
}

export {
  FirestoreProvider
}