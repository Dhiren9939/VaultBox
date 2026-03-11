import env from '#src/config/env.js';
import mongo from '#src/config/mongo.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#src/modules/auth/auth.routes.js';
import vaultRoutes from '#src/modules/vault/vault.routes.js';
import notFound from '#src/middleware/notFoundHandler.js';
import centralErrorHandler from '#src/middleware/centralErrorHandler.js';
import logger from '#src/utils/logger.js';

const PORT = env.PORT;

const app = express();
app.use(cors());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json());

app.use(authRoutes);
app.use(vaultRoutes);

app.use(notFound);
app.use(centralErrorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
