const app = require('./app');
const connectDB = require('./database/db');
const config = require('./config/env');

let server;

// Handle uncaught exceptions (synchronous errors)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Bootstrapping function
const startServer = async () => {
  try {
    // 1. Establish database connection first
    await connectDB();

    // 2. Start the HTTP server listener
    server = app.listen(config.PORT, () => {
      console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('FATAL: Server startup failed due to connection error.');
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections (asynchronous errors)
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
