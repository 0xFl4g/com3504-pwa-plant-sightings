const createError = require('http-errors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');
const {swaggerUi, specs} = require('./swagger/swagger');
const logger = require('./lib/logger');

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/myDatabase', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => {
    logger.fatal({err}, 'MongoDB connection error');
    process.exit(1);
  });

// Express app setup
const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', 'https://cdn.jsdelivr.net', 'https://cdn.socket.io', 'https://unpkg.com'],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net', 'https://unpkg.com', 'https://fonts.googleapis.com'],
      imgSrc: ['\'self\'', 'data:', 'https://*.tile.openstreetmap.org', 'https://upload.wikimedia.org', 'https://commons.wikimedia.org', 'https://*.dbpedia.org', 'https://unpkg.com', 'blob:'],
      connectSrc: ['\'self\'', 'ws:', 'wss:', 'https://cdn.jsdelivr.net', 'https://unpkg.com', 'https://cdn.socket.io'],
      fontSrc: ['\'self\'', 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com', 'data:'],
    },
  },
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {message: 'Too many requests, please try again later.'},
});

// Middleware setup
app.use(pinoHttp({logger}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes setup
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/api', apiLimiter, apiRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404, 'Page not found'));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
