const winston = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, printf, errors, colorize, json } = winston.format;

// Definir niveles personalizados
const levels = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };

// Registrar colores personalizados para cada nivel (usando nombres reconocidos por Winston)
const customColors = {
  fatal: 'redBG',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'cyan',
  trace: 'grey'
};
winston.addColors(customColors);

// Formato para la consola: usa el colorize integrado, timestamp, errores y formato personalizado
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      msg += `\nStack: ${stack}`;
    } else if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Formato para archivos: JSON para facilitar la estructuración y análisis
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

// Crear el logger con transportes diferenciados
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Transporte para consola con el formato amigable y colores
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Transporte para archivo con rotación diaria en formato JSON
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
  ],
  // Manejadores para excepciones y rechazos
  exceptionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: 'logs/exceptions.log', format: fileFormat })
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: 'logs/rejections.log', format: fileFormat })
  ],
});

// Bloque de ejemplos enmarcado para diferenciarlos en la consola
console.log(`
----------------- EJEMPLOS DE USO -----------------
logger.info('Mensaje informativo.', { user: 'JohnDoe', requestId: '12345' });
logger.warn('Advertencia importante.');
logger.error('¡Error crítico!', new Error('Algo salió mal'));
logger.debug('Información de depuración.');
logger.fatal('Error fatal de la aplicación.');
---------------------------------------------------
`);

// Ejemplos reales de log
logger.info('Mensaje informativo.', { user: 'JohnDoe', requestId: '12345' });
logger.warn('Advertencia importante.');
logger.error('¡Error crítico!', new Error('Algo salió mal'));
logger.debug('Información de depuración.');
logger.fatal('Error fatal de la aplicación.');

module.exports = logger;
