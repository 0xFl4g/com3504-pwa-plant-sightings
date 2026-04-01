const logger = require('../lib/logger');

/**
 * Initializes the socket.io server.
 * @param {Object} io - The socket.io instance.
 */
exports.init = function(io) {
  io.sockets.on('connection', function(socket) {
    logger.debug({socketId: socket.id}, 'User connected');

    socket.on('joinRoom', function(room) {
      if (typeof room !== 'string' || room.length > 50) return;
      socket.join(room);
    });

    socket.on('leaveRoom', function(room) {
      if (typeof room !== 'string' || room.length > 50) return;
      socket.leave(room);
    });

    socket.on('addComment', function(comment) {
      if (!comment || typeof comment !== 'object') return;
      if (typeof comment.plantSighting !== 'string') return;
      if (typeof comment.username !== 'string' || comment.username.length > 100) return;
      if (typeof comment.text !== 'string' || comment.text.length > 2000) return;

      const sanitized = {
        plantSighting: comment.plantSighting,
        username: comment.username,
        text: comment.text,
        dateTime: comment.dateTime || new Date().toISOString(),
      };

      io.to(sanitized.plantSighting).emit('commentAdded', sanitized);
    });

    socket.on('disconnect', function() {
      logger.debug({socketId: socket.id}, 'User disconnected');
    });
  });
};
