import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './database-config.type';

export const databaseConfig = registerAs('database', (): DatabaseConfig => {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const username = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const synchronize = false;
  const logging = false;

  if (!host) {
    throw new Error('Database configuration is incomplete. Required environment variables: DB_HOST');
  }

  if (!port) {
    throw new Error('Database configuration is incomplete. Required environment variables: DB_PORT');
  }

  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
    throw new Error('Invalid DB_PORT configuration. Must be a valid port number (1-65535).');
  }

  if (!username) {
    throw new Error('Database configuration is incomplete. Required environment variables: DB_USER');
  }

  if (!password) {
    throw new Error('Database configuration is incomplete. Required environment variables: DB_PASSWORD');
  }

  if (!database) {
    throw new Error('Database configuration is incomplete. Required environment variables: DB_NAME');
  }

  return {
    host,
    port: portNumber,
    username,
    password,
    database,
    synchronize,
    logging,
  };
});
