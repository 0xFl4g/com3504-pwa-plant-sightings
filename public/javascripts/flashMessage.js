// Filepath: /public/javascripts/flashMessage.js

/**
 * Save a flash message to local storage.
 * @param {string} message - The message content.
 * @param {string} type - The type of the message (e.g., 'success', 'warning', 'error').
 */
function setFlashMessage(message, type) {
  localStorage.setItem('flashMessage', JSON.stringify({message, type}));
}

/**
 * Display the flash message stored in local storage.
 */
function showFlashMessage() {
  const flashMessageData = localStorage.getItem('flashMessage');
  if (flashMessageData) {
    const {message, type} = JSON.parse(flashMessageData);
    const messageContainer = document.getElementById('flash-message-container') || document.body;

    const div = document.createElement('div');
    div.className = `alert alert-${type} alert-dismissible fade show`;
    div.setAttribute('role', 'alert');
    div.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    messageContainer.appendChild(div);
  }
}

/**
 * Initialize flash message handling on DOM content loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  showFlashMessage();
  localStorage.removeItem('flashMessage'); // Ensure the flash message is cleared after showing
});

// Export the functions for use in modules (uncomment if applicable)
export {setFlashMessage, showFlashMessage};
