import { WinstonModule } from 'nest-winston';
import { format, transports, transport as WinstonTransport } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { loggerConfig } from '../../config';

const { combine, timestamp, printf, colorize, errors, json } = format;

// --- Custom Formatters ---

// Custom format for console logs (human-readable)
const consoleLogFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, context, trace }) => {
    return `${timestamp} [${context || 'Application'}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
  }),
);

// Custom format for file logs (machine-readable)
const fileLogFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

// --- Logger Creation ---

export const createWinstonLogger = () => {
  const config = loggerConfig();
  const loggerTransports: WinstonTransport[] = [];

  // Console Transport (typically for development)
  if (config.console) {
    loggerTransports.push(new transports.Console({ format: consoleLogFormat }));
  }

  // File Transports (typically for production)
  if (config.file) {
    // Shared configuration for daily rotating files
    const dailyRotateFileOptions = {
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.maxSize,
      format: fileLogFormat,
    };

    // Transport for all 'info' level and above logs
    loggerTransports.push(
      new DailyRotateFile({
        ...dailyRotateFileOptions,
        filename: 'logs/application-%DATE%.log',
        level: 'info',
        maxFiles: config.maxFiles,
      }),
    );

    // Transport for 'error' level logs only
    loggerTransports.push(
      new DailyRotateFile({
        ...dailyRotateFileOptions,
        filename: 'logs/error-%DATE%.log',
        level: 'error',
        maxFiles: config.errorMaxFiles,
      }),
    );
  }

  // --- Exception/Rejection Handlers ---
  let exceptionHandlers: WinstonTransport[] = [];
  let rejectionHandlers: WinstonTransport[] = [];

  if (config.file) {
    const crashHandlerOptions = {
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.maxSize,
      maxFiles: config.errorMaxFiles,
      format: fileLogFormat,
    };

    exceptionHandlers = [
      new DailyRotateFile({
        ...crashHandlerOptions,
        filename: 'logs/exceptions-%DATE%.log',
      }),
    ];

    rejectionHandlers = [
      new DailyRotateFile({
        ...crashHandlerOptions,
        filename: 'logs/rejections-%DATE%.log',
      }),
    ];
  }

  return WinstonModule.createLogger({
    level: config.level,
    format: fileLogFormat,
    transports: loggerTransports,
    exceptionHandlers,
    rejectionHandlers,
    exitOnError: false,
  });
};

// --- Fallback Logger ---

// This convenience function remains an excellent pattern for bootstrapping the app
export const createLoggerForApp = () => {
  try {
    return createWinstonLogger();
  } catch (error) {
    console.warn('Logger config not available, using fallback console logger:', error.message);
    return WinstonModule.createLogger({
      level: 'info',
      transports: [new transports.Console({ format: consoleLogFormat })],
    });
  }
};
