import env from '#src/config/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#src/modules/auth/auth.routes.js';
import notFound from '#src/middleware/notFoundHandler.js';
import centralErrorHandler from '#src/middleware/centralErrorHandler.js';
import logger from '#src/utils/logger.js';
import mongo from '#src/config/mongo.js';

const PORT = env.PORT;

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(authRoutes);

app.use(notFound);
app.use(centralErrorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
