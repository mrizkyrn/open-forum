import { registerAs } from '@nestjs/config';
import { LoggerConfig } from './logger-config.type';

export default registerAs(
  'logger',
  (): LoggerConfig => ({
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.LOG_CONSOLE === 'true' || process.env.NODE_ENV === 'development',
    file: process.env.LOG_FILE !== 'false',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    errorMaxFiles: process.env.LOG_ERROR_MAX_FILES || '30d',
  }),
);
