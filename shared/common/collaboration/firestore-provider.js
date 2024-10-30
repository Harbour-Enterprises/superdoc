import { FirestoreProvider as BaseFirestoreProvider } from 'firestore-provider'
import { getFirestore, doc, onSnapshot, collection, getDocs } from 'firebase/firestore';

class FirestoreProvider extends BaseFirestoreProvider {
  constructor(firebaseApp, ydoc, path, debug = true) {
    super(firebaseApp, ydoc, path);

    this.isConnected = false;
    this.pendingUpdates = 0;
    this.ydoc = ydoc;
    this.path = path;
    this.init()
  }

  async init() {
    const db = getFirestore('harbour-collaboration');
    console.debug('[FirestoreProvider] Firestore initialized:', db.app.name);
    const docRef = doc(db, this.path.join('/'));
    // const coll = collection(db, 'superdoc/test-site/nick@harbourshare.com/blank_document.docx/yjs');
    // const query = await getDocs(coll); 
      
      this.ydoc.on('update', this.handleUpdate.bind(this));
      this.ydoc.on('beforeTransaction', this.handleYdocTransactionStart.bind(this));
  
      // onSnapshot(docRef, (docSnapshot) => {
      //   this.handleConnected(docSnapshot);
      // });
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
    this.#log('handleConnected', docSnapshot.metadata, this.pendingUpdates);
    const isFromCache = docSnapshot.metadata.fromCache;
    const hasPendingWrites = docSnapshot.metadata.hasPendingWrites;
    this.isConnected = !isFromCache && !hasPendingWrites;
    this.pendingUpdates === 0 && this.emit('synced', [true]);
  }
  
  handleUpdate(update) {
    this.#log('handleUpdate');
    this.pendingUpdates -= 1;
    this.checkIfAllUpdatesFinished();
  }

  checkIfAllUpdatesFinished() {
    this.#log('checkIfAllUpdatesFinished', this.pendingUpdates);
    if (this.pendingUpdates === 0) {
      this.isSynced = true;
      this.emit('synced', [true]);
    }
  }
}

export {
  FirestoreProvider
}