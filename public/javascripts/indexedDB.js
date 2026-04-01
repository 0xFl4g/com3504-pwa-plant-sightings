// Filepath: /public/javascripts/indexedDB.js

let dbInstance = null;

const createObjectStore = (db, storeName, options) => {
  if (!db.objectStoreNames.contains(storeName)) {
    db.createObjectStore(storeName, options);
  }
};

const initializeDB = async () => {
  if (!('indexedDB' in self)) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  const dbVersion = 9;
  const dbName = 'MyDatabase-COM3504';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      createObjectStore(db, 'plantSightings', {keyPath: '_id'});
      createObjectStore(db, 'comments', {keyPath: '_id'});
      createObjectStore(db, 'sync-plantSightings', {keyPath: '_id'});
      createObjectStore(db, 'sync-comments', {keyPath: '_id'});
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const getObjectStore = (db, storeName, mode) => db.transaction(storeName, mode).objectStore(storeName);

const addData = async (db, storeName, data) => {
  return new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readwrite');
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getData = async (db, storeName, key = null) => {
  return new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readonly');
    const request = key ? store.get(key) : store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const updateData = async (db, storeName, data) => {
  return new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readwrite');
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteData = async (db, storeName, key) => {
  return new Promise((resolve, reject) => {
    const store = getObjectStore(db, storeName, 'readwrite');
    const request = store.delete(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export {initializeDB, addData, getData, updateData, deleteData};
