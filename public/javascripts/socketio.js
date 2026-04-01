// Filepath: /public/javascripts/socketio.js

// Import necessary modules
import {fetchComments, isValidObjectId} from './api.js';

// Global variable for the socket connection
let socket = null;

/**
 * Initializes the socket connection if not already initialized.
 */
function initializeSocket() {
  if (!socket) {
    socket = io();
  }
}

/**
 * Returns the current socket instance, initializing if needed.
 * @return {Object} The socket.io client instance.
 */
function getSocket() {
  initializeSocket();
  return socket;
}

/**
 * Joins a room using the socket connection.
 * @param {string} roomName - The name of the room to join.
 */
function joinRoom(roomName) {
  initializeSocket();
  socket.emit('joinRoom', roomName);
}

/**
 * Leaves a room using the socket connection.
 * @param {string} roomName - The name of the room to leave.
 */
function leaveRoom(roomName) {
  initializeSocket();
  socket.emit('leaveRoom', roomName);
}

/**
 * Creates a sync status badge element.
 * @param {string} commentId - The comment ID to check sync status.
 * @return {HTMLElement} The badge span element.
 */
function createSyncBadge(commentId) {
  const badge = document.createElement('span');
  if (isValidObjectId(commentId)) {
    badge.className = 'badge bg-success';
    badge.textContent = 'Synced';
  } else {
    badge.className = 'badge bg-warning text-dark';
    badge.textContent = 'Waiting to be synced';
  }
  return badge;
}

/**
 * Appends a comment to the comments section.
 * @param {string} username - The username of the commenter.
 * @param {string} text - The text content of the comment.
 * @param {Date} dateTime - The date and time of the comment.
 * @param {string} commentId - The ID of the comment to check sync status.
 */
async function appendComment(username, text, dateTime, commentId) {
  const commentsList = document.querySelector('.comments-section');
  const noCommentsMsg = document.querySelector('.no-comments');

  if (noCommentsMsg) {
    noCommentsMsg.remove();
  }

  const commentElement = document.createElement('div');
  commentElement.classList.add('comment');

  const header = document.createElement('div');
  header.className = 'comment-header';

  const strong = document.createElement('strong');
  strong.textContent = username;
  header.appendChild(strong);

  const timestamp = document.createElement('span');
  timestamp.className = 'comment-timestamp';
  timestamp.textContent = new Date(dateTime).toLocaleString();
  header.appendChild(timestamp);

  if (commentId) {
    header.appendChild(createSyncBadge(commentId));
  }

  const body = document.createElement('div');
  body.className = 'comment-body';
  const p = document.createElement('p');
  p.textContent = text;
  body.appendChild(p);

  commentElement.appendChild(header);
  commentElement.appendChild(body);
  commentsList.appendChild(commentElement);
}

/**
 * Listens for new comments from the server and calls the provided callback function.
 * @param {Function} callback - The callback function to handle new comments.
 */
function listenForNewComments(callback) {
  initializeSocket();
  socket.on('commentAdded', (comment) => {
    const {username, text, dateTime} = comment;
    callback(username, text, dateTime);
  });
}

/**
 * Loads comments for a given sighting ID.
 * @param {string} sightingId - The ID of the sighting to load comments for.
 */
async function loadComments(sightingId) {
  try {
    const noCommentsMsg = document.querySelector('.no-comments');

    listenForNewComments(appendComment);

    const comments = await fetchComments(sightingId);

    if (comments && comments.length > 0) {
      if (noCommentsMsg) {
        noCommentsMsg.remove();
      }

      comments.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

      comments.forEach(({username, text, dateTime, _id}) => {
        appendComment(username, text, dateTime, _id);
      });
    }
  } catch (error) {
    console.error('Failed to load comments:', error);
  }
}

// Export functions
export {
  appendComment,
  getSocket,
  joinRoom,
  leaveRoom,
  listenForNewComments,
  loadComments,
};
