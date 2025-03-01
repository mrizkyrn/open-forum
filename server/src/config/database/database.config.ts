import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './database-config.type';

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'forum_upnvj',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  }),
);
