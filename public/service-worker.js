// public/service-worker.js

/**
 * The service worker script responsible for caching static assets and handling background synchronization of data with the server.
 */
import {initializeDB, getData, deleteData} from '/javascripts/indexedDB.js';

const CACHE_NAME = 'cache-v1';
const assetsToCache = [
  '/',
  '/auth/login',
  '/auth/logout',
  '/plant-sightings/submit',
  '/plant-sightings/cache',
  '/api/dbpedia-plants',
  '/stylesheets/style.css',
  '/favicon.ico',
  '/images/logo.png',
  '/offline.html',
  '/javascripts/serviceWorker.js',
  '/javascripts/indexedDB.js',
  '/javascripts/api.js',
  '/javascripts/navigation.js',
  '/javascripts/auth.js',
  '/javascripts/flashMessage.js',
  '/javascripts/socketio.js',
  '/javascripts/location.js',
  '/javascripts/DBpedia.js',
  '/javascripts/home.js',
  '/javascripts/submitSighting.js',
  '/javascripts/viewSighting.js',
  '/javascripts/login.js',
  '/javascripts/logout.js',
  '/manifest.json',
];

/**
 * Event listener for the 'install' event of the service worker.
 * Pre-caches the application shell and initializes the database.
 * @param {Event} event - The install event.
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Pre-caching App Shell');
        return cache.addAll(assetsToCache);
      }),
      initializeDB(),
    ]),
  );
});

/**
 * Event listener for the 'activate' event of the service worker.
 * Clears old caches and takes control of uncontrolled clients.
 * @param {Event} event - The activate event.
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', cache);
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
  self.clients.claim().then(() => console.log('Service Worker: Claimed clients'));
});

/**
 * Event listener for the 'fetch' event of the service worker.
 * Intercepts network requests and serves cached responses when available.
 * @param {Event} event - The fetch event.
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Exclude non-GET requests and non-HTTP/HTTPS URLs
  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin) ||
    request.url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // Define patterns for API, plant sightings URLs, and socket.io URLs
  const apiPattern = /\/api\/dbpedia-plants\/?$/;
  const plantSightingsUrlPattern = /\/plant-sightings\/\w+/;
  const socketIoPattern = /\/socket.io\//;

  // Bypass caching for all API requests except for specific endpoints and for socket.io requests
  if ((request.url.includes('/api/') && !apiPattern.test(request.url)) || socketIoPattern.test(request.url)) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response to store it in the cache
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Cache the response for future requests
            cache.put(request, clonedResponse);
          });
        return response;
      })
      .catch(() => {
        // Attempt to return the cached response when the network request fails
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            } else if (plantSightingsUrlPattern.test(request.url)) {
              // Return the cached plant sightings page if the request matches the pattern
              return caches.match('/plant-sightings/cache');
            }
            // Return the offline.html page for all other requests
            return caches.match('/offline.html');
          });
      }),
  );
});

/**
 * Event listener for the 'sync' event of the service worker.
 * Handles background synchronization of data with the server.
 * @param {SyncEvent} event - The sync event.
 */
self.addEventListener('sync', async (event) => {
  console.log('Service Worker: Syncing...', event);

  try {
    if (event.tag === 'sync-sightings' || event.tag === 'manual-sync') {
      console.log('Service Worker: Syncing sightings...');
      const updatedMappings = await syncSightings();
      await syncComments(updatedMappings); // Pass mappings to comment sync
    }

    if (event.tag === 'sync-comments' && event.tag !== 'manual-sync') { // Avoid double execution
      console.log('Service Worker: Syncing comments...');
      await syncComments();
    }

  } catch (error) {
    console.error('Error during sync:', error);
  }
});

/**
 * Function to sync sightings with the server.
 * @return {Promise<Map>} A promise that resolves to a mapping of old and new IDs.
 */
async function syncSightings() {
  const db = await initializeDB();
  const allUnsynced = await getData(db, 'sync-plantSightings');
  const idMapping = new Map();

  if (allUnsynced.length === 0) {
    console.log('No unsynced sightings to process.');
    return idMapping;
  }

  const syncPromises = allUnsynced.map(async (sighting) => {
    const syncResult = await syncSighting(sighting);
    if (syncResult.success) {
      idMapping.set(sighting._id, syncResult.newId); // Store new ID mapping
      await deleteData(db, 'sync-plantSightings', sighting._id);
    }
    return syncResult;
  });

  await Promise.all(syncPromises);
  return idMapping;
}

/**
 * Function to sync a single sighting with the server.
 * @param {Object} sighting - The sighting object to sync.
 * @return {Promise<Object>} A promise that resolves to an object containing the sync status and new ID if successful.
 */
async function syncSighting(sighting) {
  const response = await fetch('/api/plant-sightings/submit', {
    method: 'POST',
    body: JSON.stringify(sighting),
    headers: {'Content-Type': 'application/json'},
  });
  if (response.ok) {
    const result = await response.json();
    console.log(`Sighting ${sighting._id} synced successfully.`);
    return {success: true, newId: result._id};
  } else {
    console.error(`Failed to sync sighting ${sighting._id}`);
    return {success: false};
  }
}

/**
 * Function to sync comments with the server.
 * @param {Map} idMapping - A mapping of old and new IDs for sightings.
 * @return {Promise<void>} A promise that resolves when all comments are synced.
 */
async function syncComments(idMapping = new Map()) {
  const db = await initializeDB();
  const allUnsynced = await getData(db, 'sync-comments');

  if (allUnsynced.length === 0) {
    console.log('No unsynced comments to process.');
    return;
  }

  // Update comment sighting IDs based on synced sightings
  const updatedComments = allUnsynced.map((comment) => {
    if (idMapping.has(comment.plantSighting)) {
      comment.plantSighting = idMapping.get(comment.plantSighting);
    }
    return comment;
  });

  const syncPromises = updatedComments.map(async (comment) => {
    const syncResult = await syncComment(comment);
    if (syncResult.success) {
      await deleteData(db, 'sync-comments', comment._id);
    }
    return syncResult;
  });

  await Promise.all(syncPromises);
}

/**
 * Function to sync a single comment with the server.
 * @param {Object} comment - The comment object to sync.
 * @return {Promise<Object>} A promise that resolves to an object containing the sync status.
 */
async function syncComment(comment) {
  try {
    const response = await fetch('/api/comments/submit', {
      method: 'POST',
      body: JSON.stringify(comment),
      headers: {'Content-Type': 'application/json'},
    });
    if (response.ok) {
      console.log(`Comment ${comment._id} synced successfully.`);
      return {success: true, id: comment._id};
    } else {
      console.error(`Failed to sync comment ${comment._id}`);
    }
  } catch (error) {
    console.error(`Network or server error while syncing comment ${comment._id}:`, error);
  }
  return {success: false};
}
