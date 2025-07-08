import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { loggerConfig } from '../../config';

const { combine, timestamp, printf, colorize, errors } = format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, context, trace }) => {
  return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
});

export const createWinstonLogger = () => {
  // Get validated logger configuration
  const config = loggerConfig();

  const loggerTransports: any[] = [];

  // Console transport (based on config)
  if (config.console) {
    loggerTransports.push(
      new transports.Console({
        format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
      }),
    );
  }

  // File transports (only if file logging is enabled)
  if (config.file) {
    loggerTransports.push(
      // All logs
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: config.maxSize,
        maxFiles: config.maxFiles,
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
      }),

      // Error logs only
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: config.maxSize,
        maxFiles: config.errorMaxFiles,
        level: 'error',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
      }),
    );
  }

  return WinstonModule.createLogger({
    level: config.level,
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
    transports: loggerTransports,
    // Handle uncaught exceptions and unhandled rejections
    exceptionHandlers: config.file
      ? [
          new DailyRotateFile({
            filename: 'logs/exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: config.maxSize,
            maxFiles: config.errorMaxFiles,
          }),
        ]
      : [],
    rejectionHandlers: config.file
      ? [
          new DailyRotateFile({
            filename: 'logs/rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: config.maxSize,
            maxFiles: config.errorMaxFiles,
          }),
        ]
      : [],
    exitOnError: false, // Don't exit on handled exceptions
  });
};

// Convenience function for creating logger with dependency injection support
export const createLoggerForApp = () => {
  try {
    return createWinstonLogger();
  } catch (error) {
    // Fallback logger if config is not available (useful during bootstrap)
    console.warn('Logger config not available, using fallback configuration:', error.message);
    return WinstonModule.createLogger({
      level: 'info',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
      transports: [
        new transports.Console({
          format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
        }),
      ],
    });
  }
};
