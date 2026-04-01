// Filepath: /public/javascripts/home.js

// Import necessary modules
import {fetchSightings} from './api.js';
import {calculateDistance, fetchUserLocation} from './location.js';

let allSightings = [];
let userLocation = null;

/**
 * Get DOM elements used in the script.
 * @returns {Object} - Object containing DOM elements.
 */
const getElements = () => ({
  sightingsContainer: document.querySelector('#sightingsContainer'),
  searchInput: document.querySelector('#searchInput'),
  sortSelect: document.querySelector('#sortSelect'),
  myUploadsOnly: document.querySelector('#myUploadsOnly'),
  hasFlowers: document.querySelector('#hasFlowers'),
  hasLeaves: document.querySelector('#hasLeaves'),
  hasFruitsOrSeeds: document.querySelector('#hasFruitsOrSeeds'),
  searchForm: document.querySelector('#searchForm'),
});

/**
 * Create an HTML element with specified tag, class, and text content.
 * @param {string} tag - The HTML tag of the element.
 * @param {string} className - The class name(s) of the element.
 * @param {string} text - The text content of the element.
 * @returns {HTMLElement} - The created HTML element.
 */
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

/**
 * Create HTML representation of a plant sighting.
 * @param {Object} sighting - The plant sighting object.
 * @returns {HTMLElement} - The HTML element representing the plant sighting.
 */
const createSightingElement = (sighting) => {
  const colDiv = document.createElement('div');
  colDiv.className = 'col-md-4 mb-3';

  const cardDiv = document.createElement('div');
  cardDiv.className = 'card h-100';

  const imageWrapperDiv = document.createElement('div');
  imageWrapperDiv.className = 'image-wrapper';
  imageWrapperDiv.style.height = '300px';
  imageWrapperDiv.style.overflow = 'hidden';

  if (sighting.photo) {
    const img = document.createElement('img');
    img.src = sighting.photo;
    img.className = 'card-img-top';
    img.alt = 'Plant Photo';
    img.style.objectFit = 'cover';
    img.style.width = '100%';
    img.style.height = '100%';
    imageWrapperDiv.appendChild(img);
  }

  const cardBodyDiv = document.createElement('div');
  cardBodyDiv.className = 'card-body d-flex flex-column';

  cardBodyDiv.appendChild(createElement('h5', 'card-title', `Sighting by: ${sighting.username}`));
  cardBodyDiv.appendChild(createElement('p', 'card-text', `Date: ${new Date(sighting.dateTime).toLocaleString()}`));
  cardBodyDiv.appendChild(createElement('p', 'card-text', `Identification: ${sighting.identification}`));

  let locationText = 'N/A';
  if (sighting.locationName) {
    locationText = sighting.locationName;
    if (sighting.distance !== undefined && sighting.distance !== Number.POSITIVE_INFINITY) {
      locationText += ` (${sighting.distance.toFixed(2)} km)`;
    }
  }
  cardBodyDiv.appendChild(createElement('p', 'card-text', `Location: ${locationText}`));

  const detailsLink = document.createElement('a');
  detailsLink.className = 'btn btn-primary mt-auto';
  detailsLink.href = `/plant-sightings/${sighting._id}`;
  detailsLink.textContent = 'View Details';
  cardBodyDiv.appendChild(detailsLink);

  cardDiv.appendChild(imageWrapperDiv);
  cardDiv.appendChild(cardBodyDiv);
  colDiv.appendChild(cardDiv);

  return colDiv;
};

/**
 * Load sightings from the server, calculate distances if user location is available,
 * sort them, and display on the page.
 */
const loadSightings = async () => {
  const {sightingsContainer, sortSelect} = getElements();

  try {
    allSightings = await fetchSightings();

    // Calculate distance for each sighting
    if (userLocation) {
      allSightings.forEach(sighting => {
        if (sighting.locationCoordinate) {
          const [lat, lon] = sighting.locationCoordinate.split(',').map(Number);
          sighting.distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
        } else {
          sighting.distance = Number.POSITIVE_INFINITY;
        }
      });
    }

    sortSelect.value = 'newest'; // Set default sort to "newest"

    filterSightings();
  } catch (error) {
    console.error('Failed to fetch sightings:', error);
    sightingsContainer.innerHTML = '<div class="col-12"><p class="text-center text-danger">Failed to load plant sightings.</p></div>';
  }
};

/**
 * Display plant sightings on the page.
 * @param {Array} sightings - An array of plant sighting objects.
 */
const displaySightings = (sightings) => {
  const {sightingsContainer} = getElements();
  sightingsContainer.innerHTML = '';

  if (sightings.length === 0) {
    sightingsContainer.innerHTML = '<div class="col-12"><p class="text-center">No plant sightings available to display.</p></div>';
    return;
  }

  sightings.forEach(sighting => {
    sightingsContainer.appendChild(createSightingElement(sighting));
  });
};

/**
 * Filter and display plant sightings based on search input, sorting, and 'My Uploads Only' checkbox.
 */
const filterSightings = () => {
  const {
    searchInput,
    sortSelect,
    myUploadsOnly,
    hasFlowers,
    hasLeaves,
    hasFruitsOrSeeds,
  } = getElements();
  const searchInputValue = searchInput.value.toLowerCase();
  const sortValue = sortSelect.value;
  const isMyUploadOnly = myUploadsOnly.checked;
  const currentUser = localStorage.getItem('username');

  const filteredSightings = allSightings.filter(sighting => {
    const matchesSearch = sighting.identification.toLowerCase().includes(searchInputValue) || sighting.username.toLowerCase().includes(searchInputValue);
    const matchesMyUploadsOnly = !isMyUploadOnly || sighting.username === currentUser;
    const matchesFlowers = !hasFlowers.checked || sighting.hasFlowers;
    const matchesLeaves = !hasLeaves.checked || sighting.hasLeaves;
    const matchesFruitsOrSeeds = !hasFruitsOrSeeds.checked || sighting.hasFruitsOrSeeds;

    return matchesSearch && matchesMyUploadsOnly && matchesFlowers && matchesLeaves && matchesFruitsOrSeeds;
  });

  const sortingMethods = {
    newest: (a, b) => new Date(b.dateTime) - new Date(a.dateTime),
    oldest: (a, b) => new Date(a.dateTime) - new Date(b.dateTime),
    nearest: (a, b) => {
      if (a.distance === Number.POSITIVE_INFINITY) return 1;
      if (b.distance === Number.POSITIVE_INFINITY) return -1;
      return a.distance - b.distance;
    },
    farthest: (a, b) => {
      if (a.distance === Number.POSITIVE_INFINITY) return 1;
      if (b.distance === Number.POSITIVE_INFINITY) return -1;
      return b.distance - a.distance;
    },
  };

  filteredSightings.sort(sortingMethods[sortValue]);
  displaySightings(filteredSightings);
};

document.addEventListener('DOMContentLoaded', async () => {
  const {
    searchForm,
    myUploadsOnly,
    hasFlowers,
    hasLeaves,
    hasFruitsOrSeeds,
  } = getElements();

  userLocation = await fetchUserLocation();
  await loadSightings();

  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    filterSightings();
  });

  myUploadsOnly.addEventListener('change', filterSightings);
  hasFlowers.addEventListener('change', filterSightings);
  hasLeaves.addEventListener('change', filterSightings);
  hasFruitsOrSeeds.addEventListener('change', filterSightings);
});
