import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbType = configService.get<string>('DB_TYPE', 'better-sqlite3');
  const isInMemory =
    configService.get<string>('USE_IN_MEMORY_DB') === 'true' &&
    configService.get<string>('NODE_ENV') !== 'production';

  // 1. Shared TypeORM Application Controls
  const baseOrmConfig = {
    autoLoadEntities: true,
    logging: configService.get<string>('NODE_ENV') === 'development',
  };

  // 2. In-Memory SQLite Branch (Dev / Test)
  if (isInMemory || dbType === 'better-sqlite3') {
    console.log(`⚡ Using In-Memory SQLite Database for Development/Testing`);
    return {
      ...baseOrmConfig,
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      synchronize: true, // Auto-syncs schema in RAM
      logging: ['query', 'error'], // Log queries for debugging
    };
  }

  // 3. Networked Engine Branch (MySQL / Postgres)
  return {
    ...baseOrmConfig,
    type: dbType as 'mysql' | 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    synchronize: false, // Use migrations in non-in-memory environments
    ssl: configService.get<boolean>('DB_SSL')
      ? { rejectUnauthorized: false }
      : false,
    extra: {
      connectionLimit: configService.get<number>('DB_CONN_LIMIT', 10),
      waitForConnections: true,
      queueLimit: 0,
      idleTimeout: configService.get<number>('DB_IDLE_TIMEOUT', 60000),
    },
  };
};
