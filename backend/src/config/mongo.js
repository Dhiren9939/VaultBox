import mongoose from 'mongoose';
import logger from '#src/utils/logger.js';
import process from 'process';

const MONGODB_URI = process.env.MONGODB_URI;

const mongo = mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

export default mongo;
