// Filepath: /public/javascripts/auth.js

// Import necessary modules
import {setFlashMessage} from './flashMessage.js';

/**
 * Function to check if a user is logged in.
 * Redirects to the login page with a flash message if not logged in.
 */
const checkLogin = () => {
  if (!getUserSession()) {
    setFlashMessage('You need to be logged in.', 'danger');
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/auth/login';
  }
};

/**
 * Function to save user session in local storage.
 * @param {string} username - The username of the logged-in user.
 */
const saveUserSession = (username) => {
  localStorage.setItem('username', username);
  setFlashMessage('You have successfully logged in.', 'success');
};

/**
 * Function to retrieve user session from local storage.
 * @returns {string|null} - The username of the logged-in user, or null if not logged in.
 */
const getUserSession = () => {
  return localStorage.getItem('username');
};

/**
 * Function to log out a user by removing session data from local storage.
 */
const logout = () => {
  localStorage.removeItem('username');
  setFlashMessage('You have successfully logged out.', 'info');
  window.location.href = '/';
};

export {checkLogin, saveUserSession, getUserSession, logout};
