const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const logger = require('../lib/logger');

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Returns the list of all comments
 *     tags: [Comments]
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
 *         description: The list of comments
 */
exports.apiGetAllComments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const comments = await Comment.find({})
      .sort({dateTime: -1})
      .skip(skip)
      .limit(limit)
      .exec();
    res.json(comments);
  } catch (err) {
    logger.error({err}, 'Error fetching comments');
    res.status(500).json({message: 'Error fetching comments'});
  }
};

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
 *     responses:
 *       200:
 *         description: The comments for the sighting
 */
exports.apiGetCommentBySightingId = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message: 'Invalid sighting ID format'});
    }

    const comments = await Comment.find({plantSighting: id}).exec();
    res.json(comments);
  } catch (err) {
    logger.error({err}, 'Error fetching comments');
    res.status(500).json({message: 'Error fetching comments'});
  }
};

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
exports.apiSubmitComment = async (req, res) => {
  const {plantSighting, username, text, dateTime} = req.body;

  if (!plantSighting || !username || !text || !dateTime) {
    return res.status(400).json({
      message: 'Missing required fields: plantSighting, username, text, dateTime.',
    });
  }

  if (username.length > 100) {
    return res.status(400).json({message: 'Username is too long (max 100 characters).'});
  }

  if (text.length > 2000) {
    return res.status(400).json({message: 'Comment text is too long (max 2000 characters).'});
  }

  try {
    const newComment = new Comment({
      plantSighting,
      dateTime,
      username: username.trim(),
      text: text.trim(),
    });

    const savedComment = await newComment.save();

    res.status(201).json({
      message: 'Comment submitted successfully!',
      _id: savedComment._id,
    });
  } catch (error) {
    logger.error({err: error}, 'Error processing comment submission');
    res.status(500).json({
      message: 'Error processing the submission. Please try again.',
    });
  }
};
