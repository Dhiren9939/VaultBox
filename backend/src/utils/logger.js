import winston from 'winston';
import process from 'process';

const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd ? winston.format.json() : winston.format.colorize({ all: true }),
    isProd ? winston.format.json() : winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    ...(isProd && !isVercel
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

export default logger;
