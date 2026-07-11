const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const { xss } = require('express-xss-sanitizer');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const routes = require('./routes');
const limiter = require('./middlewares/rateLimiter.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Apply Rate Limiting
app.use('/api', limiter);

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize user input (XSS prevention)
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Parse cookie headers (needed for Refresh Token HttpOnly Cookie)
app.use(cookieParser());

// Compress response bodies
app.use(compression());

// Serve uploads folder statically so profile images can be retrieved
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register main API routes
app.use('/api', routes);

// Handle Not Found (404) routes
app.use(notFound);

// Centralized Global Error Handler
app.use(errorMiddleware);

module.exports = app;
