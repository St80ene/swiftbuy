import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

type SupportedDatabase = 'better-sqlite3' | 'mysql' | 'postgres';

const toBoolean = (
  value: string | undefined,
  defaultValue = false,
): boolean => {
  if (value === undefined) return defaultValue;

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

const toNumber = (value: string | undefined, defaultValue: number): number => {
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

  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';

  const useInMemoryDb = toBoolean(
    configService.get<string>('USE_IN_MEMORY_DB'),
  );

  /**
   * Shared TypeORM options.
   *
   * Keep this object untyped so it doesn't force the
   * entire TypeOrmModuleOptions union into the driver branches.
   */
  const baseOrmConfig = {
    autoLoadEntities: true,
    logging: isDevelopment,
  };

  /**
   * SQLite
   */
  if (dbType === 'better-sqlite3' && useInMemoryDb && !isProduction) {
    return {
      ...baseOrmConfig,

      type: 'better-sqlite3',
      database: ':memory:',

      dropSchema: true,
      synchronize: true,

      logging: isDevelopment ? ['query', 'error'] : ['error'],
    };
  }

  /**
   * Never allow SQLite in production.
   */
  if (isProduction && dbType === 'better-sqlite3') {
    throw new Error(
      'Production cannot use better-sqlite3. Set DB_TYPE=mysql or DB_TYPE=postgres.',
    );
  }

  const host = configService.get<string>('DB_HOST');
  const username = configService.get<string>('DB_USERNAME');
  const database = configService.get<string>('DB_NAME');

  const password = configService.get<string>('DB_PASSWORD', '');

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

  const connectionLimit = toNumber(
    configService.get<string>('DB_CONN_LIMIT'),
    10,
  );

  const idleTimeout = toNumber(
    configService.get<string>('DB_IDLE_TIMEOUT'),
    60000,
  );

  /**
   * MySQL
   */
  if (dbType === 'mysql') {
    const mysqlConfig: TypeOrmModuleOptions = {
      ...baseOrmConfig,
      type: 'mysql',
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
        connectionLimit,
        waitForConnections: true,
        queueLimit: 0,
      },
    };

    return mysqlConfig;
  }

  /**
   * PostgreSQL
   */
  if (dbType === 'postgres') {
    const postgresConfig: TypeOrmModuleOptions = {
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
        max: connectionLimit,
        idleTimeoutMillis: idleTimeout,
      },
    };

    return postgresConfig;
  }

  throw new Error(
    `Unsupported DB_TYPE "${dbType}". Supported values: better-sqlite3, mysql, postgres.`,
  );
};
