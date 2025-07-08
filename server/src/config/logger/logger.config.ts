import { registerAs } from '@nestjs/config';
import { LoggerConfig } from './logger-config.type';

export const loggerConfig = registerAs('logger', (): LoggerConfig => {
  const level = process.env.LOG_LEVEL;
  const console = process.env.LOG_CONSOLE === 'true';
  const file = process.env.LOG_FILE === 'true';
  const maxSize = process.env.LOG_MAX_SIZE;
  const maxFiles = process.env.LOG_MAX_FILES;
  const errorMaxFiles = process.env.LOG_ERROR_MAX_FILES;

  if (!level) {
    throw new Error('Logger configuration is incomplete. Required environment variables: LOG_LEVEL');
  }

  const validLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  if (!validLogLevels.includes(level)) {
    throw new Error(`Invalid LOG_LEVEL configuration. Must be one of: ${validLogLevels.join(', ')}`);
  }

  if (process.env.LOG_CONSOLE === undefined) {
    throw new Error('Logger configuration is incomplete. Required environment variables: LOG_CONSOLE');
  }

  if (process.env.LOG_FILE === undefined) {
    throw new Error('Logger configuration is incomplete. Required environment variables: LOG_FILE');
  }

  if (!maxSize) {
    throw new Error('Logger configuration is incomplete. Required environment variables: LOG_MAX_SIZE');
  }

  if (!maxFiles) {
    throw new Error('Logger configuration is incomplete. Required environment variables: LOG_MAX_FILES');
  }

  if (!errorMaxFiles) {
    throw new Error('Logger configuration is incomplete. Required environment variables: LOG_ERROR_MAX_FILES');
  }

  return {
    level,
    console,
    file,
    maxSize,
    maxFiles,
    errorMaxFiles,
  };
});
