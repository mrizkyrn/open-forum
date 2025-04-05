import { registerAs } from '@nestjs/config';
import { ExternalApiConfig } from './external-api-config.type';

export const externalApiConfig = registerAs(
  'externalApi',
  (): ExternalApiConfig => ({
    baseUrl: process.env.EXTERNAL_API_BASE_URL || 'https://api.example.com',
    username: process.env.EXTERNAL_API_USERNAME || '',
    password: process.env.EXTERNAL_API_PASSWORD || '',
    keyName: process.env.EXTERNAL_API_KEY_NAME || '',
    keySecret: process.env.EXTERNAL_API_KEY_SECRET || '',
  }),
);
