// Filepath: /public/javascripts/dbpedia.js

// Import necessary modules
import {fetchSightings, updateSightingIdentification} from './api.js';

/**
 * Helper function to set the DBpedia view.
 * @param {string} photoSrc - The source URL for the DBpedia photo.
 * @param {string} abstract - The abstract to display in the DBpedia section.
 * @param {string} message - The message to display in the DBpedia section.
 * @param {string} wikiLink - The Wikipedia link for the plant.
 */
const setView = (photoSrc, abstract, message, wikiLink) => {
  const dbpediaMessage = document.getElementById('dbpedia-message');
  const dbpediaPhoto = document.getElementById('dbpedia-photo');
  const dbpediaAbstract = document.getElementById('dbpedia-abstract');

  dbpediaMessage.innerText = message;
  dbpediaPhoto.src = photoSrc;
  dbpediaAbstract.textContent = abstract;

  if (wikiLink) {
    const br = document.createElement('br');
    const linkParagraph = document.createElement('p');
    const textBefore = document.createTextNode('For more information, visit the ');
    const link = document.createElement('a');
    link.href = wikiLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Wikipedia page';
    const textAfter = document.createTextNode('.');
    linkParagraph.appendChild(br);
    linkParagraph.appendChild(textBefore);
    linkParagraph.appendChild(link);
    linkParagraph.appendChild(textAfter);
    dbpediaAbstract.appendChild(linkParagraph);
  }

  dbpediaMessage.classList.toggle('d-none', !message);
  dbpediaPhoto.classList.toggle('d-none', !photoSrc);
  dbpediaAbstract.classList.toggle('d-none', !abstract);
};

/**
 * Sets the DBpedia section for a given sighting.
 * @param {Object} sighting - The sighting object containing information about the sighting.
 */
const setDBpediaSectionForView = async (sighting) => {
  if (!navigator.onLine) {
    setView('', '', 'Information cannot be fetched when offline.', '');
    return;
  }

  const identificationValue = sighting.identification;

  if (identificationValue === 'unknown' || identificationValue === 'uncertain') {
    setView('', '', 'The identification has not been set.', '');
  } else {
    const plantDetails = await fetchPlantDetailsByIdentification(identificationValue);
    if (plantDetails.length > 0) {
      const detail = plantDetails[0];
      setView(detail.imageLink, detail.abstract, '', detail.wikiLink);
    } else {
      setView('', '', 'No details available for the identified plant.', '');
    }
  }
};

/**
 * Sets up the identification editor, handles form submission, and updates the DBpedia section for a given sighting.
 * @param {Object} sighting - The sighting object containing information about the sighting.
 */
const setupIdentificationEditorForView = async (sighting) => {
  const identificationForm = document.getElementById('identificationForm');
  const newIdentificationInput = document.getElementById('newIdentification');
  const plantNamesDatalist = document.getElementById('plantNames');

  if (!newIdentificationInput || !plantNamesDatalist) {
    console.error('Error: newIdentificationInput or plantNamesDatalist element not found');
    return;
  }

  try {
    const plantNames = await fetchPlantNames();
    populateDatalist(plantNamesDatalist, plantNames);

    identificationForm.onsubmit = async (event) => {
      event.preventDefault();
      await handleIdentificationFormSubmit(sighting._id, newIdentificationInput);
    };

  } catch (error) {
    console.error('Error setting up identification editor and DBpedia section:', error);
  }
};

/**
 * Handle identification form submission and update UI.
 * @param {string} sightingId - The ID of the plant sighting.
 * @param {HTMLElement} newIdentificationInput - The new identification input element.
 */
const handleIdentificationFormSubmit = async (sightingId, newIdentificationInput) => {
  const newIdentification = newIdentificationInput.value.trim();
  if (newIdentification === '') {
    alert('Identification cannot be empty.');
    return;
  }

  try {
    await updateSightingIdentification(sightingId, newIdentification);
    document.getElementById('identification').textContent = newIdentification;
    const identificationModal = bootstrap.Modal.getInstance(document.getElementById('identificationModal'));
    identificationModal.hide();

    // Update DBpedia section for the view
    const sighting = {id: sightingId, identification: newIdentification};
    await setDBpediaSectionForView(sighting);
    await fetchSightings(sightingId);

  } catch (error) {
    console.error('Failed to save identification:', error);
    alert('Failed to save identification. Please try again later.');
  }
};

/**
 * Populate datalist with plant names.
 * @param {HTMLElement} datalist - The datalist element to populate.
 * @param {Array} plantNames - The plant names to populate.
 */
const populateDatalist = (datalist, plantNames) => {
  const specialOptions = ['unknown', 'uncertain'];
  const sortedPlantNames = [...specialOptions, ...plantNames.sort((a, b) => a.localeCompare(b))];

  sortedPlantNames.forEach((plantName) => {
    const optionElement = document.createElement('option');
    optionElement.value = plantName;
    datalist.appendChild(optionElement);
  });
};

/**
 * Fetch plant names from the API.
 * @returns {Array} - An array containing plant names.
 */
const fetchPlantNames = async () => {
  try {
    const response = await fetch('/api/dbpedia-plants');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching plant names:', error);
    return [];
  }
};

/**
 * Fetch plant details from the API based on plant identification.
 * @param {string} identification - The binomial name of the plant.
 * @returns {Array} - An array containing details of the plant.
 */
const fetchPlantDetailsByIdentification = async (identification) => {
  try {
    const response = await fetch(`/api/dbpedia-plants/${identification}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching plant details:', error);
    return [];
  }
};

export {
  setupIdentificationEditorForView,
  setDBpediaSectionForView,
  fetchPlantNames,
  populateDatalist,
};

