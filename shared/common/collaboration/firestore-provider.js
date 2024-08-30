import { FirestoreProvider as BaseFirestoreProvider } from '@gmcfall/yjs-firestore-provider'
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

class FirestoreProvider extends BaseFirestoreProvider {
  constructor(firebaseApp, ydoc, path) {
    super(firebaseApp, ydoc, path);

    this.isConnected = false;
    this.pendingUpdates = 0;
    const db = getFirestore(firebaseApp);
    const docRef = doc(db, path.join('/'));

    ydoc.on('update', this.handleUpdate.bind(this));
    ydoc.on('beforeTransaction', this.handleYdocTransactionStart.bind(this));

    onSnapshot(docRef, (docSnapshot) => {
      this.handleConnected(docSnapshot);
    });
  }

  handleYdocTransactionStart(transaction) {
    const { origin } = transaction;
    if (origin) this.pendingUpdates += 1;
  }

  handleConnected(docSnapshot) {
    const isFromCache = docSnapshot.metadata.fromCache;
    const hasPendingWrites = docSnapshot.metadata.hasPendingWrites;
    this.isConnected = !isFromCache && !hasPendingWrites;
  }
  
  handleUpdate(update) {
    this.pendingUpdates -= 1;
    this.checkIfAllUpdatesFinished();
  }

  checkIfAllUpdatesFinished() {
    if (this.pendingUpdates === 0) {
      this.isSynced = true;
      this.emit('synced', [true]);
    }
  }
}

export {
  FirestoreProvider
}