// Filepath: /public/javascripts/viewSighting.js

// Import necessary modules
import {getUserSession} from './auth.js';
import {joinRoom, leaveRoom, loadComments, getSocket} from './socketio.js';
import {fetchSightings, submitComment} from './api.js';
import {initializeDB, getData} from './indexedDB.js';
import {loadMapForView, setDistanceForView} from './location.js';
import {
  setDBpediaSectionForView,
  setupIdentificationEditorForView,
} from './DBpedia.js';
import {setFlashMessage} from './flashMessage.js';

// Global variables
let sightingId = window.location.pathname.split('/').pop();
let sighting = null;

/**
 * Initializes the application once the DOM content is loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    sighting = await fetchSightings(sightingId);
    if (!sighting) {
      throw new Error('Sighting not found.');
    }

    await displaySighting(sighting);

    joinRoom(sightingId);
    updateCommentButton();
    restorePendingComment();
  } catch (error) {
    console.error('Error during initialization:', error);
    setFlashMessage(error.message, 'danger');
    window.location.href = '/';
  }
});

/**
 * Leaves the current room before the window is unloaded.
 */
window.addEventListener('beforeunload', () => leaveRoom(sightingId));

/**
 * Displays the sighting details and sets up the view.
 * @param {Object} sighting - The sighting object.
 */
async function displaySighting(sighting) {
  document.title = `View Sighting: ${sightingId}`;
  document.querySelector('#sighting-title').innerText = `View Sighting: ${sightingId}`;

  setBasicDetails(sighting);
  setEditButtonState();
  await setDBpediaSectionForView(sighting);

  await Promise.all([
    loadMapForView(sighting),
    setDistanceForView(sighting),
  ]);

  await checkAndDisplaySyncTag();

  await Promise.all([
    setupIdentificationEditorForView(sighting),
    loadComments(sightingId),
  ]);
}

/**
 * Sets the basic details of the sighting in the DOM.
 * @param {Object} sighting - The sighting object.
 */
function setBasicDetails(sighting) {
  document.querySelector('#photo').src = sighting.photo;
  document.querySelector('#username').innerText = sighting.username;
  document.querySelector('#date').innerText = new Date(sighting.dateTime).toLocaleString();
  document.querySelector('#location').innerText = sighting.locationCoordinate || 'N/A';
  document.querySelector('#address').innerText = sighting.locationName || 'N/A';
  document.querySelector('#identification').innerText = sighting.identification;
  document.querySelector('#has_flowers').innerText = sighting.hasFlowers ? 'Yes' : 'No';
  document.querySelector('#has_leaves').innerText = sighting.hasLeaves ? 'Yes' : 'No';
  document.querySelector('#has_fruits_or_seeds').innerText = sighting.hasFruitsOrSeeds ? 'Yes' : 'No';
  document.querySelector('#additional_information').innerText = sighting.additionalInformation || 'N/A';
}

/**
 * Sets the state of the edit button based on ownership and online status.
 */
function setEditButtonState() {
  const isOwner = getUserSession() === sighting.username;
  const isOnline = navigator.onLine;

  const editButton = document.getElementById('editIdentificationButton');
  const identificationItem = document.getElementById('identificationItem');
  if (editButton && identificationItem) {
    const offlineEditWarning = document.createElement('p');
    offlineEditWarning.className = 'text-muted';
    offlineEditWarning.innerText = 'You cannot edit the identification while offline.';

    if (isOwner && isOnline) {
      editButton.classList.remove('d-none');
      if (offlineEditWarning.parentElement === identificationItem) {
        identificationItem.removeChild(offlineEditWarning);
      }
    } else {
      editButton.classList.add('d-none');
      if (!isOnline && isOwner && offlineEditWarning.parentElement !== identificationItem) {
        identificationItem.appendChild(offlineEditWarning);
      }
    }
  }
}

/**
 * Checks if the sighting is in the sync store and displays the sync tag if needed.
 */
async function checkAndDisplaySyncTag() {
  const db = await initializeDB();
  const syncSighting = await getData(db, 'sync-plantSightings', sightingId);
  const syncTag = document.createElement('span');
  if (!Array.isArray(syncSighting)) {
    syncTag.className = 'badge bg-warning text-dark';
    syncTag.innerText = 'Waiting to be synced';
  } else {
    syncTag.className = 'badge bg-success';
    syncTag.innerText = 'Synced';
  }
  document.querySelector('#sighting-label').appendChild(syncTag);
}

/**
 * Updates the comment button based on user session.
 */
function updateCommentButton() {
  const userSession = getUserSession();
  const commentButton = document.getElementById('comment_button');
  const loginButton = document.getElementById('login_button');
  const commentForm = document.getElementById('comment-form');

  if (userSession !== null) {
    commentButton.classList.remove('d-none');
    loginButton.classList.add('d-none');
    commentForm.onsubmit = handleCommentFormSubmit;
  } else {
    commentButton.classList.add('d-none');
    loginButton.classList.remove('d-none');
    loginButton.onclick = function() {
      localStorage.setItem('pendingComment', document.getElementById('comment').value);
      localStorage.setItem('redirectAfterLogin', window.location.href);
      window.location.href = '/auth/login';
    };
  }
}

/**
 * Restores a pending comment from local storage after login redirect.
 */
function restorePendingComment() {
  const pendingComment = localStorage.getItem('pendingComment');
  if (pendingComment) {
    document.getElementById('comment').value = pendingComment;
    localStorage.removeItem('pendingComment');
  }
}

/**
 * Handles the comment form submission.
 * @param {Event} event - The form submit event.
 */
async function handleCommentFormSubmit(event) {
  event.preventDefault();

  const commentInput = document.getElementById('comment');
  const commentText = commentInput.value.trim();

  if (commentText === '') {
    console.log('Comment is empty thus not submitting.');
    return;
  }

  const newComment = {
    plantSighting: sightingId,
    dateTime: new Date().toISOString(),
    username: getUserSession(),
    text: commentText,
  };

  try {
    await submitComment(getSocket(), newComment);
    commentInput.value = '';
  } catch (error) {
    console.error('Error while submitting comment:', error);
  }
}
