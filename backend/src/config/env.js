import 'dotenv/config';
import process from 'process';
import { cleanEnv, str, port, url, num } from 'envalid';

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
  }),
  JWT_SECRET: str(),
  PORT: port(),
  MONGODB_URI: url(),
  COOKIE_SECRET: str(),
  JWT_EXPIRES_IN_SEC: num(),
});

export default env;
