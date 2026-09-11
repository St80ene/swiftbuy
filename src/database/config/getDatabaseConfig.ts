import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

type SupportedDatabase = 'better-sqlite3' | 'mysql' | 'postgres';

const toBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined) return defaultValue;

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

const toNumber = (
  value: string | undefined,
  defaultValue: number,
): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : defaultValue;
};

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  const dbType = configService.get<SupportedDatabase>(
    'DB_TYPE',
    'better-sqlite3',
  );

  const useInMemoryDb = toBoolean(
    configService.get<string>('USE_IN_MEMORY_DB'),
  );

  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';
  const isProduction = nodeEnv === 'production';

  const isInMemorySqlite =
    dbType === 'better-sqlite3' &&
    useInMemoryDb &&
    !isProduction;

  const baseOrmConfig: TypeOrmModuleOptions = {
    autoLoadEntities: true,
    logging: isDevelopment,
  };

  /**
   * Development / Test SQLite
   *
   * Intended for:
   * - local development
   * - automated tests
   *
   * USE_IN_MEMORY_DB=true
   * DB_TYPE=better-sqlite3
   */
  if (isInMemorySqlite) {
    return {
      ...baseOrmConfig,

      type: 'better-sqlite3',
      database: ':memory:',

      /**
       * Rebuild the database every time the application starts.
       * Appropriate because this database exists only in memory.
       */
      dropSchema: true,
      synchronize: true,

      logging: isDevelopment ? ['query', 'error'] : ['error'],
    };
  }

  /**
   * Prevent accidental SQLite usage in production.
   */
  if (isProduction && dbType === 'better-sqlite3') {
    throw new Error(
      'Production cannot use better-sqlite3. Set DB_TYPE=mysql or DB_TYPE=postgres.',
    );
  }

  /**
   * Network database configuration
   */
  const host = configService.get<string>('DB_HOST');
  const username = configService.get<string>('DB_USERNAME');
  const password = configService.get<string>('DB_PASSWORD');
  const database = configService.get<string>('DB_NAME');

  if (!host || !username || !database) {
    throw new Error(
      'Missing required database configuration: DB_HOST, DB_USERNAME, DB_NAME.',
    );
  }

  const port = toNumber(
    configService.get<string>('DB_PORT'),
    dbType === 'postgres' ? 5432 : 3306,
  );

  const sslEnabled = toBoolean(
    configService.get<string>('DB_SSL'),
    isProduction,
  );

  /**
   * MySQL
   */
  if (dbType === 'mysql') {
    return {
      ...baseOrmConfig,

      type: 'mysql',

      host,
      port,
      username,
      password,
      database,

      /**
       * Never let TypeORM modify production schema automatically.
       * Database changes should go through migrations.
       */
      synchronize: false,

      ssl: sslEnabled
        ? {
            rejectUnauthorized: false,
          }
        : false,

      extra: {
        connectionLimit: toNumber(
          configService.get<string>('DB_CONN_LIMIT'),
          10,
        ),
        waitForConnections: true,
        queueLimit: 0,
      },
    };
  }

  /**
   * PostgreSQL
   */
  if (dbType === 'postgres') {
    return {
      ...baseOrmConfig,

      type: 'postgres',

      host,
      port,
      username,
      password,
      database,

      synchronize: false,

      ssl: sslEnabled
        ? {
            rejectUnauthorized: false,
          }
        : false,

      extra: {
        max: toNumber(
          configService.get<string>('DB_CONN_LIMIT'),
          10,
        ),
        idleTimeoutMillis: toNumber(
          configService.get<string>('DB_IDLE_TIMEOUT'),
          60000,
        ),
      },
    };
  }

  throw new Error(
    `Unsupported DB_TYPE "${dbType}". Supported values are: better-sqlite3, mysql, postgres.`,
  );
};