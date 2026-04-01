const mongoose = require('mongoose');
const PlantSighting = require('../models/PlantSighting');
const logger = require('../lib/logger');

exports.renderHomePage = async (req, res) => {
  res.render('home');
};

exports.renderSubmitPlantSighting = (req, res) => {
  res.render('submit');
};

exports.renderViewPlantingSighting = async (req, res) => {
  res.render('view');
};

/**
 * @swagger
 * /api/plant-sightings/submit:
 *   post:
 *     summary: Submit a new plant sighting
 *     tags: [Sightings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sighting'
 *     responses:
 *       201:
 *         description: Sighting created successfully
 *       400:
 *         description: Bad request
 */
exports.apiSubmitPlantSighting = async (req, res) => {
  const {
    dateTime,
    username,
    locationCoordinate,
    locationName,
    identification,
    hasFlowers,
    hasLeaves,
    hasFruitsOrSeeds,
    additionalInformation,
    photo,
  } = req.body;

  const parseBoolean = (value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  };

  const getLocationName = async (latitude, longitude) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {'User-Agent': 'PlantSightings/1.0'},
      });
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
      throw new Error('No location name found for the given coordinates.');
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    if (!username || !identification || !photo) {
      return res.status(400).json({
        message: 'Missing required fields: username, identification, and photo.',
      });
    }

    if (username.length > 100 || identification.length > 200) {
      return res.status(400).json({
        message: 'Field length exceeds maximum allowed.',
      });
    }

    if (additionalInformation && additionalInformation.length > 2000) {
      return res.status(400).json({
        message: 'Additional information is too long (max 2000 characters).',
      });
    }

    if (locationCoordinate) {
      const parts = locationCoordinate.split(',').map(Number);
      if (parts.length !== 2 || parts.some(isNaN)) {
        return res.status(400).json({
          message: 'Invalid location coordinate format. Expected "lat,lng".',
        });
      }
    }

    let locationNameFinal = locationName || '';
    if (locationCoordinate && !locationName) {
      try {
        const [latitude, longitude] = locationCoordinate.split(',').map(Number);
        locationNameFinal = await getLocationName(latitude, longitude);
      } catch (geoError) {
        logger.warn({err: geoError}, 'Geocoding failed, continuing without location name');
      }
    }

    const newSighting = new PlantSighting({
      dateTime,
      username: username.trim(),
      locationCoordinate,
      locationName: locationNameFinal,
      identification: identification.trim(),
      hasFlowers: parseBoolean(hasFlowers),
      hasLeaves: parseBoolean(hasLeaves),
      hasFruitsOrSeeds: parseBoolean(hasFruitsOrSeeds),
      additionalInformation: additionalInformation ? additionalInformation.trim() : '',
      photo,
    });

    const savedSighting = await newSighting.save();

    res.status(201).json({
      message: 'Sighting submitted successfully!',
      _id: savedSighting._id,
    });
  } catch (error) {
    logger.error({err: error}, 'Error processing plant sighting submission');
    res.status(500).json({
      message: 'Error processing the form. Please try again.',
    });
  }
};

/**
 * @swagger
 * /api/plant-sightings:
 *   get:
 *     summary: Returns the list of all plant sightings
 *     tags: [Sightings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: The list of sightings
 */
exports.apiGetAllSightings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const sightings = await PlantSighting.find({})
      .sort({dateTime: -1})
      .skip(skip)
      .limit(limit)
      .exec();
    res.json(sightings);
  } catch (err) {
    logger.error({err}, 'Error fetching sightings');
    res.status(500).json({message: 'Error fetching sightings'});
  }
};

/**
 * @swagger
 * /api/plant-sightings/{id}:
 *   get:
 *     summary: Get a plant sighting by ID
 *     tags: [Sightings]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: The plant sighting by ID
 *       404:
 *         description: Not found
 */
exports.apiGetSightingById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message: 'Invalid sighting ID format'});
    }

    const sighting = await PlantSighting.findById(id).exec();

    if (!sighting) {
      return res.status(404).json({message: 'Sighting not found'});
    }

    res.json(sighting);
  } catch (err) {
    logger.error({err}, 'Error fetching sighting');
    res.status(500).json({message: 'Error fetching sighting'});
  }
};

/**
 * @swagger
 * /api/plant-sightings/{id}/identification:
 *   put:
 *     summary: Update the identification of a plant sighting
 *     tags: [Sightings]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identification:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
exports.apiUpdatePlantSighting = async (req, res) => {
  const sightingId = req.params.id;
  const {identification} = req.body;

  if (!mongoose.Types.ObjectId.isValid(sightingId)) {
    return res.status(400).json({message: 'Invalid sighting ID format'});
  }

  if (!identification || typeof identification !== 'string' || identification.trim().length === 0) {
    return res.status(400).json({message: 'Identification is required and must be a non-empty string.'});
  }

  if (identification.length > 200) {
    return res.status(400).json({message: 'Identification is too long (max 200 characters).'});
  }

  try {
    const sighting = await PlantSighting.findById(sightingId).exec();

    if (!sighting) {
      return res.status(404).json({message: 'Sighting not found'});
    }

    sighting.identification = identification.trim();
    const updatedSighting = await sighting.save();

    res.json({
      message: 'Sighting identification updated successfully!',
      sighting: updatedSighting,
    });
  } catch (error) {
    logger.error({err: error}, 'Error updating identification');
    res.status(500).json({
      message: 'Error updating identification. Please try again.',
    });
  }
};
