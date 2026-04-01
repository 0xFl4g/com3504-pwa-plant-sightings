// Filepath: /public/javascripts/navigation.js

// Import necessary modules
import {getUserSession} from './auth.js'; // Assuming auth.js is in the same directory

// Execute setup functions once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  setupLoginLogoutLinks();
  setupManualSyncButton();
  setupOnlineStatusListener();
});

/**
 * Sets up the display of login/logout links based on user session.
 */
const setupLoginLogoutLinks = () => {
  const loginLink = document.getElementById('login-link');
  const logoutLink = document.getElementById('logout-link');
  const user = getUserSession();

  if (user) {
    // Show the logout link with the username
    logoutLink.style.display = 'block';
    logoutLink.textContent = `Logout (${user})`;
    loginLink.style.display = 'none';
  } else {
    // Show the login link and hide the logout link
    loginLink.style.display = 'block';
    logoutLink.style.display = 'none';
  }
};

/**
 * Sets up the manual synchronization button.
 */
const setupManualSyncButton = () => {
  const manualSyncButton = document.getElementById('manual-sync-button');
  if (manualSyncButton) {
    manualSyncButton.addEventListener('click', () => {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Register a sync event named 'manual-sync'
          return registration.sync.register('manual-sync');
        })
        .then(() => {
          console.log('Manual sync registered successfully');
        })
        .catch((error) => {
          console.error('Failed to register manual sync:', error);
        });
    });
  }
};

/**
 * Sets up listener for online status changes and updates offline notification display.
 */
const setupOnlineStatusListener = () => {
  const offlineNotificationElement = document.getElementById('offline-message-container');

  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      // Hide offline message when online
      offlineNotificationElement.style.display = 'none';
    } else {
      // Show offline message when offline
      offlineNotificationElement.style.display = 'block';
    }
  };

  // Add event listeners for online and offline status changes
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Set the initial online status
  updateOnlineStatus();
};
