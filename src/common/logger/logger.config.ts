import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

interface LogInfo extends winston.Logform.TransformableInfo {
  timestamp?: string;
  context?: string | Record<string, any>;
}

export const createLoggerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldLogToFile = process.env.LOG_TO_FILE === 'true';

  // 1. Base Console Transport (Mandatory for Local Dev & Cloud Aggregators)
  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf((info: LogInfo) => {
                const { timestamp, level, message, context, ...meta } = info;
                const contextStr =
                  typeof context === 'object' && context !== null
                    ? JSON.stringify(context)
                    : (context as string) || '';

                const unknMessage = message !== undefined ? message : '';
                let messageStr = '';
                if (typeof unknMessage === 'object' && unknMessage !== null) {
                  messageStr = JSON.stringify(unknMessage);
                } else if (unknMessage !== undefined && unknMessage !== null) {
                  messageStr = String(unknMessage);
                }

                const metaStr = Object.keys(meta).length
                  ? JSON.stringify(meta)
                  : '';
                const displayContext = contextStr ? `[${contextStr}] ` : '';
                const displayTimestamp =
                  typeof timestamp === 'string' ? timestamp : '';

                return `[${displayTimestamp}] [${level}] ${displayContext}${messageStr} ${metaStr}`.trim();
              }),
            ),
      ),
    }),
  ];

  // 2. Conditional File Transports (Only active if explicitly enabled for VPS/On-Premise deployments)
  if (shouldLogToFile) {
    const fileLogFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    transports.push(
      new DailyRotateFile({
        level: 'error',
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileLogFormat,
      }),
      new DailyRotateFile({
        level: 'info',
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileLogFormat,
      }),
    );
  }

  return WinstonModule.createLogger({ transports });
};
