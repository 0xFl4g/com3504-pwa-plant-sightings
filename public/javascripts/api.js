// Filepath: /public/javascripts/api.js

// Import necessary modules
import {appendComment} from './socketio.js';
import {initializeDB, getData, updateData} from './indexedDB.js';

/**
 * Handles errors by logging the message and throwing an error.
 * @param {string} message - The error message.
 * @param {Error} error - The error object.
 */
const handleError = (message, error) => {
  console.error(`${message}:`, error);
  throw new Error(message);
};

/**
 * Validates a MongoDB ObjectId.
 * @param {string} id - The ID to validate.
 * @returns {boolean} - Indicates whether the ID is valid or not.
 */
export const isValidObjectId = (id) => /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(id);

/**
 * Merges primary and sync data arrays.
 * @param {Array} primaryData - The primary data array.
 * @param {Array} syncData - The sync data array.
 * @returns {Array} - Merged array of data.
 */
const mergePrimaryAndSyncData = (primaryData, syncData) => {
  const dataMap = new Map();

  primaryData.forEach(item => dataMap.set(item._id, item));

  syncData.forEach(item => {
    if (isValidObjectId(item._id)) {
      const existingItem = dataMap.get(item._id);
      if (existingItem) {
        existingItem.identification = item.identification;
      } else {
        dataMap.set(item._id, {
          _id: item._id,
          identification: item.identification,
        });
      }
    } else {
      dataMap.set(item._id, item);
    }
  });

  return Array.from(dataMap.values());
};

/**
 * Merges network and local sync data arrays.
 * @param {Array} networkData - The network data array.
 * @param {Array} localSyncData - The local sync data array.
 * @returns {Array} - Merged array of data.
 */
const mergeNetworkAndLocalData = (networkData, localSyncData) => {
  const dataMap = new Map();

  const localEntries = Array.isArray(localSyncData) ? localSyncData : localSyncData ? [localSyncData] : [];
  localEntries.forEach(item => dataMap.set(item._id, item));

  networkData.forEach(item => {
    dataMap.set(item._id, {...item, ...dataMap.get(item._id)});
  });

  return Array.from(dataMap.values());
};

/**
 * Fetches data from IndexedDB.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {string} storeName - The name of the store to fetch data from.
 * @param {string} key - The key to fetch data by.
 * @param {string} dataScope - The scope of data to fetch ('primary', 'sync', or 'both').
 * @returns {Array|Object|null} - The fetched data.
 */
const fetchDataFromIndexedDB = async (db, storeName, key = null, dataScope = 'both') => {
  const primaryStore = storeName;
  const syncStore = `sync-${storeName}`;
  const isCommentStore = storeName.includes('comments');
  let primaryData = [], syncData = [];

  try {
    if (['both', 'primary'].includes(dataScope)) {
      primaryData = await getData(db, primaryStore, isCommentStore ? undefined : key);
    }

    if (['both', 'sync'].includes(dataScope)) {
      syncData = await getData(db, syncStore, isCommentStore ? undefined : key);
    }

    if (isCommentStore && key !== null) {
      const filterCommentsById = (comments) => comments.filter(comment => comment._id.startsWith(`${key}-`) || comment.plantSighting === key);
      primaryData = filterCommentsById(primaryData);
      syncData = filterCommentsById(syncData);
    }

    primaryData = Array.isArray(primaryData) ? primaryData : [primaryData];
    syncData = Array.isArray(syncData) ? syncData : [syncData];

    if (key && !isCommentStore) {
      const combinedData = mergePrimaryAndSyncData(primaryData, syncData);
      return combinedData.length ? combinedData[0] : null;
    }

    return dataScope === 'both' ? mergePrimaryAndSyncData(primaryData, syncData) : dataScope === 'primary' ? primaryData : syncData;
  } catch (error) {
    handleError(`Failed to fetch data from IndexedDB due to ${dataScope} scope`, error);
  }
};

/**
 * Saves data to IndexedDB and registers sync.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {string} storeName - The name of the store to save data to.
 * @param {Object} data - The data to save.
 * @param {string} syncStoreName - The name of the sync store.
 */
const saveDataToIndexedDB = async (db, storeName, data, syncStoreName) => {
  try {
    await updateData(db, storeName, data);
    const registration = await navigator.serviceWorker.ready;
    registration.sync.register(syncStoreName);
  } catch (error) {
    handleError(`Failed to save or register sync for ${storeName}`, error);
  }
};

/**
 * Fetches sightings from the server.
 * @param {string} url - The URL to fetch sightings from.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {string} storeName - The name of the store to save sightings to.
 * @param {string} sightingId - The ID of the sighting to fetch.
 * @returns {Array|Object|null} - The fetched sightings data.
 */
const fetchSightingsFromServer = async (url, db, storeName, sightingId) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const networkData = await response.json() || [];
  const normalizedNetworkData = Array.isArray(networkData) ? networkData : [networkData];

  for (const sighting of normalizedNetworkData) {
    await updateData(db, storeName, sighting);
  }

  const localSyncData = await fetchDataFromIndexedDB(db, storeName, sightingId, 'sync');
  const mergedData = mergeNetworkAndLocalData(normalizedNetworkData, localSyncData);

  return sightingId ? (mergedData.length ? mergedData[0] : null) : mergedData;
};

/**
 * Fetches comments from the server.
 * @param {string} url - The URL to fetch comments from.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {string} storeName - The name of the store to save comments to.
 * @param {string} sightingId - The ID of the sighting related to the comments.
 * @returns {Array} - The fetched comments.
 */
const fetchCommentsFromServer = async (url, db, storeName, sightingId) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const networkData = await response.json() || [];

  for (const comment of networkData) {
    await updateData(db, storeName, comment);
  }

  const localSyncData = await fetchDataFromIndexedDB(db, storeName, sightingId, 'sync');
  return mergeNetworkAndLocalData(networkData, localSyncData);
};

/**
 * Fetches sightings.
 * @param {string} [sightingId=null] - The ID of the sighting to fetch.
 * @returns {Array|Object|null} - The fetched sightings data.
 */
const fetchSightings = async (sightingId = null) => {
  let db;
  try {
    db = await initializeDB();
  } catch (error) {
    console.warn('IndexedDB not available:', error);
  }

  const storeName = 'plantSightings';

  if (sightingId && !isValidObjectId(sightingId)) {
    console.log('Invalid or local sighting ID, fetching sightings from IndexedDB only.');
    if (db) {
      return await fetchDataFromIndexedDB(db, storeName, sightingId);
    }
    return null;
  }

  const fetchOffline = async () => {
    if (db) {
      return await fetchDataFromIndexedDB(db, storeName, sightingId);
    }
    return null;
  };

  if (navigator.onLine) {
    try {
      const url = sightingId ? `/api/plant-sightings/${sightingId}` : '/api/plant-sightings';
      console.log('Online mode: fetching sightings from server...');
      return await fetchSightingsFromServer(url, db, storeName, sightingId);
    } catch (error) {
      console.error('Network error, trying local data:', error);
      return await fetchOffline();
    }
  } else {
    console.log('Offline mode: fetching sightings from IndexedDB...');
    return await fetchOffline();
  }
};

/**
 * Submits a new plant sighting to the server when online, or saves it to IndexedDB when offline.
 * @param {Object} sighting - The sighting object to submit.
 * @returns {Promise<Object>} - A promise that resolves to the submitted sighting object.
 */
const submitSighting = async (sighting) => {
  let db;
  try {
    db = await initializeDB();
  } catch (error) {
    console.warn('IndexedDB not available:', error);
  }

  const submitOnline = async () => {
    const response = await fetch('/api/plant-sightings/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(sighting),
    });

    if (response.ok) {
      const result = await response.json();
      await fetchSightings(result._id);
      return result;
    } else {
      throw new Error(`Failed to submit sighting: ${response.status}`);
    }
  };

  const submitOffline = async () => {
    sighting._id = Date.now().toString();
    if (db) {
      await saveDataToIndexedDB(db, 'sync-plantSightings', sighting, 'sync-plantSightings');
    }
    return sighting;
  };

  if (navigator.onLine) {
    try {
      console.log('Online mode: submitting sighting to server...');
      return await submitOnline();
    } catch (error) {
      console.error('Error while submitting sighting, saving offline:', error);
      return await submitOffline();
    }
  } else {
    console.log('Offline mode: saving sighting to IndexedDB...');
    return await submitOffline();
  }
};

/**
 * Updates the identification of a plant sighting on the server.
 * @param {string} sightingId - The ID of the plant sighting to update.
 * @param {string} newIdentification - The new identification to assign to the sighting.
 * @throws {Error} - Throws an error if the network is offline or if the sighting ID is invalid.
 * @returns {Promise<Object>} - A promise that resolves to the updated plant sighting object.
 */
const updateSightingIdentification = async (sightingId, newIdentification) => {
  if (!navigator.onLine) {
    throw new Error('Network is offline. Identification updates can only be done online.');
  }

  if (!isValidObjectId(sightingId)) {
    throw new Error('Invalid sighting ID. Identification updates require a valid MongoDB ObjectId.');
  }

  const updateOnline = async () => {
    const response = await fetch(`/api/plant-sightings/${sightingId}/identification`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({identification: newIdentification}),
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to update identification: ${response.status}`);
    }
  };

  try {
    console.log('Online mode: updating identification on the server...');
    return await updateOnline();
  } catch (error) {
    console.error('Error while updating identification:', error);
    throw new Error('Failed to update identification. Please try again later.');
  }
};

/**
 * Fetches comments associated with a plant sighting either from the server or from IndexedDB.
 * @param {string} [sightingId=null] - The ID of the plant sighting for which comments are to be fetched.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of comment objects.
 */
const fetchComments = async (sightingId = null) => {
  let db;
  try {
    db = await initializeDB();
  } catch (error) {
    console.warn('IndexedDB not available:', error);
  }

  const storeName = 'comments';

  if (sightingId && !isValidObjectId(sightingId)) {
    console.log('Local sighting ID, fetching comments from IndexedDB only.');
    if (db) {
      return await fetchDataFromIndexedDB(db, storeName, sightingId);
    }
    return [];
  }

  const fetchOffline = async () => {
    if (db) {
      return await fetchDataFromIndexedDB(db, storeName, sightingId);
    }
    return [];
  };

  if (navigator.onLine) {
    try {
      const url = sightingId ? `/api/comments/${sightingId}` : '/api/comments';
      console.log('Online mode: fetching comments from server...');
      return await fetchCommentsFromServer(url, db, storeName, sightingId);
    } catch (error) {
      console.error('Network error, fetching data from local store:', error);
      return await fetchOffline();
    }
  } else {
    console.log('Offline mode: fetching comments from IndexedDB...');
    return await fetchOffline();
  }
};

/**
 * Submits a comment to the server when online, or saves it to IndexedDB when offline.
 * @param {Object} comment - The comment object to submit.
 * @param {SocketIOClient.Socket} socket - The socket.io client instance for real-time updates.
 * @returns {Promise<Object>} - A promise that resolves to the submitted comment object.
 */
const submitComment = async (socket, comment) => {
  let db;
  try {
    db = await initializeDB();
  } catch (error) {
    console.warn('IndexedDB not available:', error);
  }

  const submitOnline = async () => {
    const response = await fetch('/api/comments/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(comment),
    });

    if (!response.ok) throw new Error(`Failed to submit comment: ${response.status}`);

    socket.emit('addComment', comment);
  };

  const submitOffline = async () => {
    comment._id = `${comment.plantSighting}-${Date.now().toString()}`;
    if (db) {
      await saveDataToIndexedDB(db, 'sync-comments', comment, 'sync-comments');
    }
    appendComment(comment.username, comment.text, comment.dateTime, comment._id);
    return comment;
  };

  if (navigator.onLine) {
    try {
      console.log('Online mode: submitting comment to server...');
      return await submitOnline();
    } catch (error) {
      console.error('Error while submitting comment, saving offline:', error);
      return await submitOffline();
    }
  } else {
    console.log('Offline mode: saving comment to IndexedDB...');
    return await submitOffline();
  }
};

// Export functions
export {
  fetchSightings,
  submitSighting,
  updateSightingIdentification,
  fetchComments,
  submitComment,
};
