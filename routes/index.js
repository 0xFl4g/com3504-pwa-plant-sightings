const express = require('express');
const router = express.Router();
const sightingController = require('../controllers/sightingController');

/**
 * @swagger
 * tags:
 *   name: Pages
 *   description: Website pages
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Renders the home page
 *     tags: [Pages]
 *     responses:
 *       200:
 *         description: Home page rendered
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<html>...</html>'
 */
router.get('/', sightingController.renderHomePage);

/**
 * @swagger
 * /plant-sightings/submit:
 *   get:
 *     summary: Renders the submit plant sighting page
 *     tags: [Pages]
 *     responses:
 *       200:
 *         description: Submit plant sighting page rendered
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<html>...</html>'
 */
router.get('/plant-sightings/submit', sightingController.renderSubmitPlantSighting);

/**
 * @swagger
 * /plant-sightings/{id}:
 *   get:
 *     summary: Renders the view plant sighting page
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sighting ID
 *     responses:
 *       200:
 *         description: View plant sighting page rendered
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<html>...</html>'
 */
router.get('/plant-sightings/:id', sightingController.renderViewPlantingSighting);

module.exports = router;
