/**
 * FIREADER — IndexedDB Storage Layer
 * Stores: books, reading history, settings
 */
const DB = (() => {
  const DB_NAME = 'fireader_db';
  const DB_VERSION = 1;
  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('books')) {
          const books = db.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
          books.createIndex('title', 'title', { unique: false });
        }

        if (!db.objectStoreNames.contains('history')) {
          const history = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          history.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('annotations')) {
          const ann = db.createObjectStore('annotations', { keyPath: ['bookId', 'lineNum'] });
          ann.createIndex('bookId', 'bookId', { unique: false });
        }
      };

      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function tx(storeName, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const req = fn(store);
      if (req && req.onsuccess !== undefined) {
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      } else {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e.target.error);
      }
    });
  }

  async function getAll(storeName) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ── Books ─────────────────────────────────────────────────
  const saveBook = (book) => tx('books', 'readwrite', (s) => s.add(book));
  const getBooks = () => getAll('books');
  const deleteBook = (id) => tx('books', 'readwrite', (s) => s.delete(id));
  const updateBook = (book) => tx('books', 'readwrite', (s) => s.put(book));

  // ── History ───────────────────────────────────────────────
  async function addHistory(entry) {
    const db = await open();
    return new Promise((resolve) => {
      const transaction = db.transaction('history', 'readwrite');
      const store = transaction.objectStore('history');
      store.add({
        title: entry.title,
        description: entry.description || '',
        lang: entry.lang || 'en',
        source: entry.source || 'Wikipedia',
        timestamp: Date.now()
      });
      transaction.oncomplete = resolve;
      transaction.onerror = resolve; // don't fail on history write
    });
  }

  async function getHistory(limit = 50) {
    const all = await getAll('history');
    return all.slice(-limit).reverse();
  }

  // ── Settings ──────────────────────────────────────────────
  async function getSetting(key) {
    try {
      const result = await tx('settings', 'readonly', (s) => s.get(key));
      return result ? result.value : null;
    } catch {
      return null;
    }
  }

  async function setSetting(key, value) {
    return tx('settings', 'readwrite', (s) => s.put({ key, value }));
  }

  // ── Annotations ───────────────────────────────────────────
  const saveAnnotation = (bookId, lineNum, text) => tx('annotations', 'readwrite', (s) => s.put({ bookId, lineNum, text, timestamp: Date.now() }));
  
  async function getAnnotations(bookId) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('annotations', 'readonly');
      const store = transaction.objectStore('annotations');
      const index = store.index('bookId');
      const req = index.getAll(IDBKeyRange.only(bookId));
      req.onsuccess = (e) => {
        const result = {};
        e.target.result.forEach(r => { result[r.lineNum] = r.text; });
        resolve(result);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getAllAnnotationsDump() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('annotations', 'readonly');
      const store = transaction.objectStore('annotations');
      const req = store.getAll();
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  return { saveBook, getBooks, deleteBook, updateBook, addHistory, getHistory, getSetting, setSetting, saveAnnotation, getAnnotations, getAllAnnotationsDump };
})();
