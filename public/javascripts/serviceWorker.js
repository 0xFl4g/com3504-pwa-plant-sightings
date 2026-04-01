// Filepath: /public/javascripts/serviceWorker.js

// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  /**
   * Registers the service worker once the window has fully loaded.
   */
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {scope: '/', type: 'module'})
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else {
  console.warn('Service Workers are not supported in this browser.');
}
