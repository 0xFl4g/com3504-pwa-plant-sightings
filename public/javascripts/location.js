// Filepath: /public/javascripts/location.js

let map;
let marker = null;
let userLocation = null;

/**
 * Initializes the map for submitting a sighting with the specified parameters.
 * @param {string} mapId - The ID of the element where the map will be displayed.
 * @param {number[]} [initialCoords=[53.3811, -1.4701]] - Initial coordinates for the map center.
 * @param {number} [initialZoom=13] - Initial zoom level.
 */
const loadMapForSubmit = (mapId, initialCoords = [53.3811, -1.4701], initialZoom = 13) => {
  if (map) return; // Avoid reinitializing the map
  map = L.map(mapId).setView(initialCoords, initialZoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  map.on('click', (e) => {
    updateMarker(e.latlng);
    document.getElementById('mapCoordinates').value = `${e.latlng.lat},${e.latlng.lng}`;
  });
};

/**
 * Updates the marker position on the map.
 * @param {L.LatLng} latlng - The latitude and longitude where the marker should be placed.
 */
const updateMarker = (latlng) => {
  if (marker) {
    map.removeLayer(marker);
  }
  marker = L.marker(latlng, {
    draggable: true,
  }).addTo(map);

  marker.on('dragend', (e) => {
    const latlng = e.target.getLatLng();
    document.getElementById('mapCoordinates').value = `${latlng.lat},${latlng.lng}`;
  });
};

/**
 * Clears the map markers and coordinates input.
 */
const clearMap = () => {
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }
  document.getElementById('mapCoordinates').value = '';
};

/**
 * Fetches the user's current location.
 * @returns {Promise<GeolocationCoordinates>} - A promise that resolves to the user's current location coordinates.
 */
const fetchUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        userLocation = position.coords;
        resolve(userLocation);
      }, () => {
        console.warn('Failed to retrieve user location.');
        resolve(); // Proceed even if geolocation fails
      });
    } else {
      console.warn('Geolocation is not supported by this browser.');
      resolve(); // Proceed if geolocation is not supported
    }
  });
};

/**
 * Loads the user's location on the map.
 */
const loadUserLocationOnMap = () => {
  return fetchUserLocation().then((coords) => {
    if (coords && map) {
      const latLng = new L.LatLng(coords.latitude, coords.longitude);
      map.setView(latLng, 13);
      updateMarker(latLng);
      document.getElementById('mapCoordinates').value = `${coords.latitude},${coords.longitude}`;
    }
    return coords;
  });
};

/**
 * Loads the map for viewing a sighting and sets the map message.
 * @param {Object} sighting - The sighting object containing location data.
 */
const loadMapForView = async (sighting) => {
  const mapContainer = document.getElementById('map');
  const mapMessage = document.getElementById('map-message');

  if (!sighting.locationCoordinate) {
    console.warn('No location available for this sighting.');
    mapContainer.style.display = 'none';
    mapMessage.innerText = 'Location coordinates not provided by the user';
    return;
  }

  const [latitude, longitude] = sighting.locationCoordinate.split(',').map(Number);

  if (isNaN(latitude) || isNaN(longitude)) {
    console.warn('Invalid location coordinates.');
    mapContainer.style.display = 'none';
    mapMessage.innerText = 'Invalid location coordinates';
    return;
  }

  if (!navigator.onLine) {
    mapMessage.innerText = 'The map might not fully function in offline mode.';
    mapMessage.className = 'text-muted';
  } else {
    mapMessage.innerText = '';
    mapMessage.className = 'text-center text-muted';
  }

  mapContainer.style.display = 'block';

  const map = L.map('map').setView([latitude, longitude], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  L.marker([latitude, longitude]).addTo(map)
    .bindPopup(`<b>Plant Sighting Location</b><br>${sighting.identification}<br>${sighting.locationCoordinate}`)
    .openPopup();
};

/**
 * Calculates the distance between two geographic coordinates.
 * @param {number} lat1 - Latitude of the first location.
 * @param {number} lon1 - Longitude of the first location.
 * @param {number} lat2 - Latitude of the second location.
 * @param {number} lon2 - Longitude of the second location.
 * @returns {number} - The distance in kilometers.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Sets the distance from the user's location to the sighting location.
 * @param {Object} sighting - The sighting object containing location data.
 */
async function setDistanceForView(sighting) {
  if (!sighting.locationCoordinate) {
    document.querySelector('#distance').innerText = 'N/A';
    return;
  }

  try {
    const [latitude, longitude] = sighting.locationCoordinate.split(',').map(Number);

    const userLocation = await fetchUserLocation();
    if (userLocation) {
      const distance = calculateDistance(latitude, longitude, userLocation.latitude, userLocation.longitude);
      document.querySelector('#distance').innerText = `${distance.toFixed(2)} km`;
    } else {
      document.querySelector('#distance').innerText = 'Unknown distance';
    }
  } catch (error) {
    console.error('Error updating location details:', error);
    document.querySelector('#distance').innerText = 'Unknown distance';
  }
}

export {
  loadMapForSubmit,
  updateMarker,
  clearMap,
  fetchUserLocation,
  loadUserLocationOnMap,
  loadMapForView,
  setDistanceForView,
  calculateDistance,
};
