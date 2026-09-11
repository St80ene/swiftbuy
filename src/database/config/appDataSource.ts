import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DB_HOST: z.string().trim().min(1, 'DB_HOST is required'),

  DB_PORT: z
    .string()
    .trim()
    .default('3306')
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value > 0 && value <= 65535, {
      message: 'DB_PORT must be a valid port number (1-65535)',
    }),

  DB_USERNAME: z.string().trim().min(1, 'DB_USERNAME is required'),

  DB_PASSWORD: z.string().default(''),

  DB_NAME: z.string().trim().min(1, 'DB_NAME is required'),

  DB_SSL: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),

  DB_CONN_LIMIT: z
    .string()
    .optional()
    .default('10')
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: 'DB_CONN_LIMIT must be a positive integer',
    }),

  DB_IDLE_TIMEOUT: z
    .string()
    .optional()
    .default('60000')
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value >= 0, {
      message: 'DB_IDLE_TIMEOUT must be a non-negative integer',
    }),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      'Invalid database environment variables:',
      result.error.format(),
    );

    throw new Error('Database configuration failed validation.');
  }

  return result.data;
};

const env = parseEnv();

export const mySqlDataSourceOptions: DataSourceOptions = {
  type: 'mysql',

  host: env.DB_HOST,
  port: env.DB_PORT,

  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  /**
   * Never let TypeORM modify the schema automatically.
   * Migrations are the source of truth.
   */
  synchronize: false,

  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],

  migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],

  ssl: env.DB_SSL
    ? {
        rejectUnauthorized: false,
      }
    : false,

  extra: {
    connectionLimit: env.DB_CONN_LIMIT,
    waitForConnections: true,
    queueLimit: 0,

    /**
     * MySQL driver option.
     */
    idleTimeout: env.DB_IDLE_TIMEOUT,
  },
};

const AppDataSource = new DataSource(mySqlDataSourceOptions);

export default AppDataSource;