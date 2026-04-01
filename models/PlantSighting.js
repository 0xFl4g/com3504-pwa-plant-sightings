const mongoose = require('mongoose');
const {Schema} = mongoose;

/**
 * @typedef {Object} PlantSightingSchema
 * @property {Date} dateTime - Date and time of the sighting.
 * @property {string} username - Username of the user who submitted the sighting.
 * @property {string} [locationCoordinate] - Coordinates of the sighting location.
 * @property {string} [locationName] - Name of the sighting location.
 * @property {boolean} hasFlowers - Indicates whether the plant has flowers.
 * @property {boolean} hasLeaves - Indicates whether the plant has leaves.
 * @property {boolean} hasFruitsOrSeeds - Indicates whether the plant has fruits or seeds.
 * @property {string} [additionalInformation] - Additional information about the sighting.
 * @property {string} identification - Identification of the plant.
 * @property {string} photo - URL of the photo of the plant.
 */

/**
 * Schema definition for plant sightings.
 */
const plantSightingSchema = new Schema({
  dateTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  username: {
    type: String,
    required: true,
  },
  locationCoordinate: {
    type: String,
    required: false,
  },
  locationName: {
    type: String,
    required: false,
  },
  hasFlowers: {
    type: Boolean,
    required: true,
  },
  hasLeaves: {
    type: Boolean,
    required: true,
  },
  hasFruitsOrSeeds: {
    type: Boolean,
    required: true,
  },
  additionalInformation: {
    type: String,
    required: false,
  },
  identification: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
});

plantSightingSchema.index({dateTime: -1});
plantSightingSchema.index({username: 1});

const PlantSighting = mongoose.model('PlantSighting', plantSightingSchema);

module.exports = PlantSighting;
