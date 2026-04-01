// Filepath: /public/javascripts/login.js

// Import necessary modules
import {getUserSession, saveUserSession} from './auth.js';
import {setFlashMessage} from './flashMessage.js';

// Event listener for when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  if (getUserSession() != null) {
    // If a user session already exists, display a flash message and redirect to home
    setFlashMessage('You are already logged in.', 'info');
    window.location.href = '/'; // Redirect to the home page
  }
});

// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the default form submission behaviour

  const username = document.getElementById('username').value; // Get the username from the form input

  if (!username) {
    // If the username is empty, display an error message
    setFlashMessage('Please enter a username.', 'danger');
    return; // Exit the function to prevent further execution
  }

  // Save the user session using the provided username
  saveUserSession(username);

  // Get the URL to redirect to after login from localStorage, or default to home page
  const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
  localStorage.removeItem('redirectAfterLogin'); // Clean up the localStorage

  // Redirect the user to the specified URL after successful login
  window.location.href = redirectUrl;
});
