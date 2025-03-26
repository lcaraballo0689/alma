const winston = require('winston');
require('winston-daily-rotate-file');

const ansiColors = {
  fatal: '\x1b[41m', // Fondo rojo
  error: '\x1b[31m', // Texto rojo
  warn: '\x1b[33m',  // Texto amarillo
  info: '\x1b[32m',  // Texto verde
  debug: '\x1b[36m', // Texto cian
  trace: '\x1b[90m', // Texto gris
};
const reset = '\x1b[0m';

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      const color = ansiColors[level] || '';
      const coloredLevel = `${color}${level}${reset}`;

      let msg = `${timestamp} [${coloredLevel}]: ${message}`;
      if (metadata && Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata, null, 2)}`;
      }
      return msg;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.prettyPrint()
      )
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.json()
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
    new winston.transports.Console(),
  ],
});

logger.info('Mensaje informativo.', { user: 'JohnDoe', requestId: '12345' });
logger.warn('Advertencia importante.');
logger.error('¡Error crítico!', new Error('Algo salió mal'));
logger.debug('Información de depuración.');
logger.fatal('Error fatal de la aplicación.');

module.exports = logger;
