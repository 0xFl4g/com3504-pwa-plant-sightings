// Filepath: /public/javascripts/submitSighting.js

// Import necessary modules
import {checkLogin, getUserSession} from './auth.js';
import {submitSighting} from './api.js';
import {setFlashMessage} from './flashMessage.js';
import {clearMap, loadMapForSubmit, loadUserLocationOnMap} from './location.js';
import {fetchPlantNames, populateDatalist} from './DBpedia.js';

// Global variable to track if the map has been initialized
let mapInitialized = false;

/**
 * Initializes the application once the DOM content is loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  checkLogin();
  initializeForm();
  setupLocationButton();

  try {
    const plantNames = await fetchPlantNames();
    const plantNamesDatalist = document.getElementById('plantNames');
    populateDatalist(plantNamesDatalist, plantNames);
  } catch (error) {
    console.error('Error initializing datalist:', error);
  }
});

/**
 * Initializes the form with event listeners and user session data.
 */
function initializeForm() {
  setUserSessionInForm();
  setupPhotoInputMethod();
  setupLocationInputMethod();
  setupFormSubmit();
}

/**
 * Sets the username in the form based on the user session.
 */
function setUserSessionInForm() {
  const usernameInput = document.querySelector('#username');
  if (usernameInput) {
    usernameInput.value = getUserSession();
  }
}

/**
 * Sets up the event listener for the photo input method selection.
 */
function setupPhotoInputMethod() {
  const urlOption = document.getElementById('urlOption');
  const photoUrlDiv = document.getElementById('photo_url');
  const photoFileDiv = document.getElementById('photo_file');
  const photoUrlInput = document.getElementById('url');
  const photoFileInput = document.getElementById('file');

  document.querySelectorAll('input[name="photo_input_method"]').forEach((elem) => {
    elem.addEventListener('change', () => {
      const isUrlOption = urlOption.checked;
      photoUrlDiv.style.display = isUrlOption ? 'block' : 'none';
      photoFileDiv.style.display = isUrlOption ? 'none' : 'block';
      photoUrlInput.required = isUrlOption;
      photoFileInput.required = !isUrlOption;

      resetPhotoInputs(isUrlOption, photoUrlInput, photoFileInput);
    });
  });
}

/**
 * Resets the photo input fields when switching options.
 * @param {boolean} isUrlOption - Whether the URL option is selected.
 * @param {HTMLElement} photoUrlInput - The URL input element.
 * @param {HTMLElement} photoFileInput - The file input element.
 */
function resetPhotoInputs(isUrlOption, photoUrlInput, photoFileInput) {
  if (isUrlOption) {
    photoFileInput.value = '';
  } else {
    photoUrlInput.value = '';
  }
}

/**
 * Sets up the event listener for the location input method selection.
 */
function setupLocationInputMethod() {
  const mapOption = document.getElementById('mapOption');
  const mapDiv = document.getElementById('mapDiv');
  const manualLocationDiv = document.getElementById('manualLocationDiv');
  const manualLocationInput = document.getElementById('manualLocation');
  const mapCoordinatesDiv = document.getElementById('mapCoordinatesDiv');
  const mapCoordinatesInput = document.getElementById('mapCoordinates');
  const fetchLocationDiv = document.getElementById('fetch-location-div');

  document.querySelectorAll('input[name="location_input_method"]').forEach((elem) => {
    elem.addEventListener('change', () => {
      const isMapOption = mapOption.checked;
      toggleLocationInputMethod(isMapOption, mapDiv, fetchLocationDiv, mapCoordinatesDiv, manualLocationDiv, manualLocationInput);

      if (isMapOption) {
        initializeMapIfNeeded(mapCoordinatesInput, manualLocationInput);
      } else {
        resetLocationInputs(mapCoordinatesInput, manualLocationInput);
      }
    });
  });
}

/**
 * Toggles the visibility of location input methods.
 * @param {boolean} isMapOption - Whether the map option is selected.
 * @param {HTMLElement} mapDiv - The map container element.
 * @param {HTMLElement} fetchLocationDiv - The fetch location button container.
 * @param {HTMLElement} mapCoordinatesDiv - The map coordinates container.
 * @param {HTMLElement} manualLocationDiv - The manual location input container.
 * @param {HTMLElement} manualLocationInput - The manual location input element.
 */
function toggleLocationInputMethod(isMapOption, mapDiv, fetchLocationDiv, mapCoordinatesDiv, manualLocationDiv, manualLocationInput) {
  mapDiv.style.display = isMapOption ? 'block' : 'none';
  fetchLocationDiv.style.display = isMapOption ? 'block' : 'none';
  mapCoordinatesDiv.style.display = isMapOption ? 'block' : 'none';
  manualLocationDiv.style.display = isMapOption ? 'none' : 'block';
  manualLocationInput.required = !isMapOption;
}

/**
 * Initializes the map if needed.
 * @param {HTMLElement} mapCoordinatesInput - The map coordinates input element.
 * @param {HTMLElement} manualLocationInput - The manual location input element.
 */
function initializeMapIfNeeded(mapCoordinatesInput, manualLocationInput) {
  manualLocationInput.value = '';
  mapCoordinatesInput.value = '';
  clearMap();
  if (!mapInitialized) {
    loadMapForSubmit('mapDiv');
    mapInitialized = true;
  }
}

/**
 * Resets the location input fields when switching options.
 * @param {HTMLElement} mapCoordinatesInput - The map coordinates input element.
 * @param {HTMLElement} manualLocationInput - The manual location input element.
 */
function resetLocationInputs(mapCoordinatesInput, _manualLocationInput) {
  mapCoordinatesInput.value = '';
  clearMap();
}

/**
 * Sets up the fetch location button event listener.
 */
function setupLocationButton() {
  document.getElementById('fetch-location').addEventListener('click', loadUserLocationOnMap);
}

/**
 * Sets up the form submission event listener.
 */
function setupFormSubmit() {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await onSubmitForm(event.target);
    });
  }
}

/**
 * Handles the form submission.
 * @param {HTMLFormElement} form - The form element being submitted.
 */
async function onSubmitForm(form) {
  const username = getUserSession();
  const photo = await getPhotoInput();
  const locationCoordinate = document.getElementById('mapCoordinates').value;
  const locationName = document.getElementById('manualLocation').value;

  if (!locationCoordinate && !locationName) {
    alert('Please provide a location.');
    return;
  }

  const formData = getFormData(username, form, photo, locationCoordinate, locationName);

  try {
    await submitSighting(formData);
    setFlashMessage('Sighting submitted successfully!', 'success');
    window.location.href = '/';
  } catch (error) {
    console.error('Failed to submit sighting:', error);
    setFlashMessage('Failed to submit sighting. Please try again later.', 'danger');
  }
}

/**
 * Gets the photo input value based on the selected input method.
 * @returns {Promise<string>} - The photo data URL or URL string.
 */
async function getPhotoInput() {
  const photoFileInput = document.getElementById('file');
  const photoUrlInput = document.getElementById('url');
  const fileOption = document.getElementById('fileOption').checked;

  if (fileOption && photoFileInput.files.length > 0) {
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (photoFileInput.files[0].size > maxSize) {
      throw new Error('Photo must be under 3MB.');
    }
    return await getPhoto(photoFileInput);
  }

  return photoUrlInput.value;
}

/**
 * Gets the form data for submission.
 * @param {string} username - The username of the user.
 * @param {HTMLFormElement} form - The form element.
 * @param {string} photo - The photo data URL or URL string.
 * @param {string} locationCoordinate - The coordinates of the location.
 * @param {string} locationName - The name of the location.
 * @returns {Object} - The form data object.
 */
function getFormData(username, form, photo, locationCoordinate, locationName) {
  return {
    dateTime: new Date().toISOString(),
    username,
    locationCoordinate: locationCoordinate || '',
    locationName: locationName || '',
    identification: form.elements['identification'] ? form.elements['identification'].value : '',
    hasFlowers: form.elements['hasFlowers'] ? form.elements['hasFlowers'].value === 'true' : false,
    hasLeaves: form.elements['hasLeaves'] ? form.elements['hasLeaves'].value === 'true' : false,
    hasFruitsOrSeeds: form.elements['hasFruitsOrSeeds'] ? form.elements['hasFruitsOrSeeds'].value === 'true' : false,
    additionalInformation: form.elements['additionalInformation'] ? form.elements['additionalInformation'].value : '',
    photo,
  };
}

/**
 * Converts the uploaded photo file to a data URL.
 * @param {HTMLInputElement} photoFileInput - The file input element.
 * @returns {Promise<string>} - The photo data URL.
 */
async function getPhoto(photoFileInput) {
  return new Promise((resolve, reject) => {
    const file = photoFileInput.files[0];
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject('Error reading file');
    reader.readAsDataURL(file);
  });
}
