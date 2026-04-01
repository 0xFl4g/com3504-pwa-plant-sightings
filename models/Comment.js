const mongoose = require('mongoose');
const {Schema} = mongoose;

/**
 * @typedef {Object} CommentSchema
 * @property {mongoose.Types.ObjectId} plantSighting - The ID of the associated plant sighting.
 * @property {Date} dateTime - Date and time of the comment.
 * @property {string} username - Username of the user who submitted the comment.
 * @property {string} text - Text content of the comment.
 */

/**
 * Schema definition for comments on plant sightings.
 */
const commentSchema = new Schema({
  plantSighting: {
    type: Schema.Types.ObjectId,
    ref: 'PlantSighting',
    required: true,
  },
  dateTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

commentSchema.index({plantSighting: 1});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
