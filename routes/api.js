const express = require('express');
const router = express.Router();
const sightingController = require('../controllers/sightingController');
const commentController = require('../controllers/commentController');
const dbpediaController = require('../controllers/dbpediaController');

/**
 * @swagger
 * tags:
 *   name: Sightings
 *   description: Plant sightings management
 */

/**
 * @swagger
 * /api/plant-sightings:
 *   get:
 *     summary: Returns the list of all plant sightings
 *     tags: [Sightings]
 *     responses:
 *       200:
 *         description: The list of sightings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sighting'
 */
router.get('/plant-sightings', sightingController.apiGetAllSightings);

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
 *         description: The sighting ID
 *     responses:
 *       200:
 *         description: The plant sighting description by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sighting'
 *       404:
 *         description: The sighting was not found
 */
router.get('/plant-sightings/:id', sightingController.apiGetSightingById);

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
router.post('/plant-sightings/submit', sightingController.apiSubmitPlantSighting);

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
 *         description: The sighting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identification:
 *                 type: string
 *                 example: 'Rosa rubiginosa'
 *     responses:
 *       200:
 *         description: Identification updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Sighting not found
 */
router.put('/plant-sightings/:id/identification', sightingController.apiUpdatePlantSighting);

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments management
 */

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Returns the list of all comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: The list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/comments', commentController.apiGetAllComments);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get comments for a specific sighting by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sighting ID
 *     responses:
 *       200:
 *         description: The comments for the sighting
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: No comments found for this sighting
 */
router.get('/comments/:id', commentController.apiGetCommentBySightingId);

/**
 * @swagger
 * /api/comments/submit:
 *   post:
 *     summary: Submit a new comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Bad request
 */
router.post('/comments/submit', commentController.apiSubmitComment);

/**
 * @swagger
 * tags:
 *   name: DBpedia
 *   description: DBpedia plant data
 */

/**
 * @swagger
 * /api/dbpedia-plants:
 *   get:
 *     summary: Returns the list of all DBpedia plant names
 *     tags: [DBpedia]
 *     responses:
 *       200:
 *         description: The list of DBpedia plant names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: 'Rosa rubiginosa'
 */
router.get('/dbpedia-plants', dbpediaController.apiGetAllDbpediaPlantNames);

/**
 * @swagger
 * /api/dbpedia-plants/{id}:
 *   get:
 *     summary: Get DBpedia details for a specific plant by ID
 *     tags: [DBpedia]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The plant ID
 *     responses:
 *       200:
 *         description: The DBpedia details for the plant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBpediaPlant'
 *       404:
 *         description: No details found for this plant
 */
router.get('/dbpedia-plants/:id', dbpediaController.apiGetDbpediaPlantDetails);

module.exports = router;
