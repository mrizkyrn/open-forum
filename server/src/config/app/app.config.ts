import { registerAs } from '@nestjs/config';
import { AppConfig } from './app-config.type';

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  }),
);
