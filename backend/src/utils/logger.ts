import winston from 'winston';
import path from 'path';

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors 
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info['timestamp']} ${info.level}: ${info.message}` +
    (info['splat'] !== undefined ? `${info['splat']}` : ' ') +
    (info['stack'] !== undefined ? ` ${info['stack']}` : ' ')
  )
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define which transports the logger must use
const transports: winston.transport[] = [
  // Console logging
  new winston.transports.Console({
    level: process.env['LOG_LEVEL'] || 'info',
    format: logFormat,
  }),
];

// Add file logging in production or if enabled
if (process.env['NODE_ENV'] === 'production' || process.env['LOG_FILE_ENABLED'] === 'true') {
  const logDir = process.env['LOG_FILE_PATH'] ? path.dirname(process.env['LOG_FILE_PATH']) : 'logs';
  
  // Error log
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  // Combined log
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  levels,
  format: fileFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const createLogger = (module: string) => {
  return {
    error: (message: string, meta?: any) => logger.error(`[${module}] ${message}`, meta),
    warn: (message: string, meta?: any) => logger.warn(`[${module}] ${message}`, meta),
    info: (message: string, meta?: any) => logger.info(`[${module}] ${message}`, meta),
    http: (message: string, meta?: any) => logger.http(`[${module}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${module}] ${message}`, meta),
  };
};

export { logger, morganStream };
